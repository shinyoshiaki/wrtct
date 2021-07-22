import { decode, types } from "binary-data";
import debug from "debug";
import { Event } from "rx.mini";

import {
  HashAlgorithm,
  NamedCurveAlgorithm,
  SignatureAlgorithm,
  SignatureHash,
} from "./cipher/const";
import { exportKeyingMaterial } from "./cipher/prf";
import { SessionType, SessionTypes } from "./cipher/suites/abstract";
import { CipherContext } from "./context/cipher";
import { DtlsContext } from "./context/dtls";
import { SrtpContext } from "./context/srtp";
import { TransportContext } from "./context/transport";
import { EllipticCurves } from "./handshake/extensions/ellipticCurves";
import { ExtendedMasterSecret } from "./handshake/extensions/extendedMasterSecret";
import { RenegotiationIndication } from "./handshake/extensions/renegotiationIndication";
import { Signature } from "./handshake/extensions/signature";
import { UseSRTP } from "./handshake/extensions/useSrtp";
import { dumpBuffer } from "./helper";
import { createPlaintext } from "./record/builder";
import { ContentType } from "./record/const";
import { FragmentedHandshake } from "./record/message/fragment";
import { parsePacket, parsePlainText } from "./record/receive";
import { Transport } from "./transport";
import { Extension } from "./typings/domain";

const log = debug("werift-dtls : packages/dtls/src/socket.ts : log");
const err = debug("werift-dtls : packages/dtls/src/socket.ts : err");

export class DtlsSocket {
  readonly onConnect = new Event();
  readonly onData = new Event<[Buffer]>();
  readonly onError = new Event<[Error]>();
  readonly onClose = new Event();
  readonly transport: TransportContext = new TransportContext(
    this.options.transport
  );
  readonly cipher: CipherContext = new CipherContext(
    this.sessionType,
    this.options.cert,
    this.options.key,
    this.options.signatureHash
  );
  readonly dtls: DtlsContext = new DtlsContext(this.options, this.sessionType);
  readonly srtp: SrtpContext = new SrtpContext();

  extensions: Extension[] = [];
  onHandleHandshakes!: (assembled: FragmentedHandshake[]) => Promise<void>;

  private bufferFragmentedHandshakes: FragmentedHandshake[] = [];

  constructor(public options: Options, public sessionType: SessionTypes) {
    this.setupExtensions();
    this.transport.socket.onData = this.udpOnMessage;
  }

  private udpOnMessage = (data: Buffer) => {
    const packets = parsePacket(data);

    for (const packet of packets) {
      try {
        const message = parsePlainText(this.dtls, this.cipher)(packet);
        switch (message.type) {
          case ContentType.handshake:
            {
              const handshake = message.data as FragmentedHandshake;
              const handshakes = this.handleFragmentHandshake([handshake]);
              const assembled = Object.values(
                handshakes.reduce(
                  (acc: { [type: string]: FragmentedHandshake[] }, cur) => {
                    if (!acc[cur.msg_type]) acc[cur.msg_type] = [];
                    acc[cur.msg_type].push(cur);
                    return acc;
                  },
                  {}
                )
              )
                .map((v) => FragmentedHandshake.assemble(v))
                .sort((a, b) => a.msg_type - b.msg_type);

              this.onHandleHandshakes(assembled).catch((error) => {
                err(this.dtls.session, "onHandleHandshakes error", error);
                this.onError.execute(error);
              });
            }
            break;
          case ContentType.applicationData:
            {
              this.onData.execute(message.data as Buffer);
            }
            break;
          case ContentType.alert:
            this.onClose.execute();
            break;
        }
      } catch (error) {
        err(
          this.dtls.session,
          "catch udpOnMessage error",
          error,
          dumpBuffer(data)
        );
      }
    }
  };

  private setupExtensions() {
    {
      log(this.dtls.session, "support srtpProfiles", this.options.srtpProfiles);
      if (this.options.srtpProfiles && this.options.srtpProfiles.length > 0) {
        const useSrtp = UseSRTP.create(
          this.options.srtpProfiles,
          Buffer.from([0x00])
        );
        this.extensions.push(useSrtp.extension);
      }
    }

    {
      const curve = EllipticCurves.createEmpty();
      curve.data = Object.values(NamedCurveAlgorithm);
      this.extensions.push(curve.extension);
    }

    {
      const signature = Signature.createEmpty();
      // libwebrtc/OpenSSL require 4=1 , 4=3 signatureHash
      signature.data = [
        { hash: HashAlgorithm.sha256, signature: SignatureAlgorithm.rsa },
        { hash: HashAlgorithm.sha256, signature: SignatureAlgorithm.ecdsa },
      ];
      this.extensions.push(signature.extension);
    }

    {
      if (this.options.extendedMasterSecret) {
        this.extensions.push({
          type: ExtendedMasterSecret.type,
          data: Buffer.alloc(0),
        });
      }
    }

    {
      const renegotiationIndication = RenegotiationIndication.createEmpty();
      this.extensions.push(renegotiationIndication.extension);
    }
  }

  handleFragmentHandshake(messages: FragmentedHandshake[]) {
    let handshakes = messages.filter((v) => {
      // find fragmented
      if (v.fragment_length !== v.length) {
        this.bufferFragmentedHandshakes.push(v);
        return false;
      }
      return true;
    });

    if (this.bufferFragmentedHandshakes.length > 1) {
      const last = this.bufferFragmentedHandshakes.slice(-1)[0];
      if (last.fragment_offset + last.fragment_length === last.length) {
        handshakes = [...this.bufferFragmentedHandshakes, ...handshakes];
        this.bufferFragmentedHandshakes = [];
      }
    }
    return handshakes; // return un fragmented handshakes
  }

  /**send application data */
  send = async (buf: Buffer) => {
    const pkt = createPlaintext(this.dtls)(
      [{ type: ContentType.applicationData, fragment: buf }],
      ++this.dtls.recordSequenceNumber
    )[0];
    await this.transport.send(this.cipher.encryptPacket(pkt).serialize());
  };

  close() {
    this.transport.socket.close();
  }

  extractSessionKeys() {
    const keyLen = 16;
    const saltLen = 14;

    const keyingMaterial = this.exportKeyingMaterial(
      "EXTRACTOR-dtls_srtp",
      keyLen * 2 + saltLen * 2
    );

    const { clientKey, serverKey, clientSalt, serverSalt } = decode(
      keyingMaterial,
      {
        clientKey: types.buffer(keyLen),
        serverKey: types.buffer(keyLen),
        clientSalt: types.buffer(saltLen),
        serverSalt: types.buffer(saltLen),
      }
    );

    if (this.sessionType === SessionType.CLIENT) {
      return {
        localKey: clientKey,
        localSalt: clientSalt,
        remoteKey: serverKey,
        remoteSalt: serverSalt,
      };
    } else {
      return {
        localKey: serverKey,
        localSalt: serverSalt,
        remoteKey: clientKey,
        remoteSalt: clientSalt,
      };
    }
  }

  exportKeyingMaterial(label: string, length: number) {
    return exportKeyingMaterial(
      label,
      length,
      this.cipher.masterSecret,
      this.cipher.localRandom.serialize(),
      this.cipher.remoteRandom.serialize(),
      this.sessionType === SessionType.CLIENT
    );
  }
}

export interface Options {
  transport: Transport;
  srtpProfiles?: number[];
  cert?: string;
  key?: string;
  signatureHash?: SignatureHash;
  certificateRequest?: boolean;
  extendedMasterSecret?: boolean;
}
