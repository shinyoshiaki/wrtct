import { createHash } from "crypto";
import { jspack } from "@shinyoshiaki/jspack";
import debug from "debug";
import PCancelable from "p-cancelable";
import Event from "rx.mini";
import { setTimeout } from "timers/promises";

import { int } from "../../../common/src";
import type { InterfaceAddresses } from "../../../common/src/network";
import type { Candidate } from "../candidate";
import { TransactionFailed } from "../exceptions";
import { type Future, future, randomTransactionId } from "../helper";
import type { Connection } from "../ice";
import { classes, methods } from "../stun/const";
import { Message, parseMessage } from "../stun/message";
import { Transaction } from "../stun/transaction";
import { type Transport, UdpTransport } from "../transport";
import type { Address, Protocol } from "../types/model";

const log = debug("werift-ice:packages/ice/src/turn/protocol.ts");

const DEFAULT_CHANNEL_REFRESH_TIME = 500;
const DEFAULT_ALLOCATION_LIFETIME = 600;
const TCP_TRANSPORT = 0x06000000;
const UDP_TRANSPORT = 0x11000000;

class TurnTransport implements Protocol {
  readonly type = "turn";
  localCandidate!: Candidate;
  receiver?: Connection;

  constructor(public turn: TurnClient) {
    turn.onDatagramReceived = this.datagramReceived;
  }

  private datagramReceived = (data: Buffer, addr: Address) => {
    try {
      const message = parseMessage(data);
      if (!message) {
        this.receiver?.dataReceived(data, this.localCandidate.component);
        return;
      }

      if (
        (message?.messageClass === classes.RESPONSE ||
          message?.messageClass === classes.ERROR) &&
        this.turn.transactions[message.transactionIdHex]
      ) {
        const transaction = this.turn.transactions[message.transactionIdHex];
        transaction.responseReceived(message, addr);
      } else if (message?.messageClass === classes.REQUEST) {
        this.receiver?.requestReceived(message, addr, this, data);
      }
    } catch (error) {
      log("datagramReceived error", error);
    }
  };

  async request(request: Message, addr: Address, integrityKey?: Buffer) {
    if (this.turn.transactions[request.transactionIdHex])
      throw new Error("exist");

    if (integrityKey) {
      request.addMessageIntegrity(integrityKey);
      request.addFingerprint();
    }

    const transaction = new Transaction(request, addr, this);
    this.turn.transactions[request.transactionIdHex] = transaction;

    try {
      return await transaction.run();
    } catch (e) {
      throw e;
    } finally {
      delete this.turn.transactions[request.transactionIdHex];
    }
  }
  async connectionMade() {}
  async sendData(data: Buffer, addr: Address) {
    await this.turn.sendData(data, addr);
  }
  async sendStun(message: Message, addr: Address) {
    await this.turn.sendData(message.bytes, addr);
  }
}

class TurnClient implements Protocol {
  type = "inner_turn";
  readonly onData = new Event<[Buffer, Address]>();
  transactions: { [hexId: string]: Transaction } = {};
  integrityKey?: Buffer;
  nonce?: Buffer;
  realm?: string;
  relayedAddress!: Address;
  mappedAddress!: Address;
  refreshHandle?: Future;
  channelNumber = 0x4000;
  channelByAddr: { [addr: string]: { number: number; address: Address } } = {};
  addrByChannel: { [channel: number]: Address } = {};
  localCandidate!: Candidate;
  /**sec */
  channelRefreshTime =
    this.options.channelRefreshTime ?? DEFAULT_CHANNEL_REFRESH_TIME;

  onDatagramReceived: (data: Buffer, addr: Address) => void = () => {};

  private channelBinding?: Promise<void>;
  channelRefreshAt = 0;

  constructor(
    public server: Address,
    public username: string,
    public password: string,
    public lifetime: number,
    public transport: Transport,
    public options: {
      /**sec */
      channelRefreshTime?: number;
    } = {},
  ) {}

  async connectionMade() {
    this.transport.onData = (data, addr) => {
      this.datagramReceived(data, addr);
    };
  }

  private handleChannelData(data: Buffer) {
    const [channel, length] = jspack.Unpack("!HH", data.slice(0, 4));
    const addr = this.addrByChannel[channel];

    if (addr) {
      const payload = data.subarray(4, 4 + length);
      this.onDatagramReceived(payload, addr);
      this.onData.execute(payload, addr);
    }
  }

  private handleSTUNMessage(data: Buffer, addr: Address) {
    try {
      const message = parseMessage(data);
      if (!message) throw new Error("not stun message");
      if (
        message.messageClass === classes.RESPONSE ||
        message.messageClass === classes.ERROR
      ) {
        const transaction = this.transactions[message.transactionIdHex];
        if (transaction) {
          transaction.responseReceived(message, addr);
        }
      } else if (message.messageClass === classes.REQUEST) {
        this.onDatagramReceived(data, addr);
      }

      if (message.getAttributeValue("DATA")) {
        const buf: Buffer = message.getAttributeValue("DATA");
        this.onDatagramReceived(buf, addr);
        this.onData.execute(buf, addr);
      }
    } catch (error) {
      log("parse error", data.toString());
    }
  }

  private datagramReceived(data: Buffer, addr: Address) {
    if (data.length >= 4 && isChannelData(data)) {
      this.handleChannelData(data);
    } else {
      this.handleSTUNMessage(data, addr);
    }
  }

  async connect() {
    const request = new Message(methods.ALLOCATE, classes.REQUEST);
    request
      .setAttribute("LIFETIME", this.lifetime)
      .setAttribute("REQUESTED-TRANSPORT", UDP_TRANSPORT);

    const [response] = await this.requestWithRetry(request, this.server).catch(
      (e) => {
        log("connect error", e);
        throw e;
      },
    );
    this.relayedAddress = response.getAttributeValue("XOR-RELAYED-ADDRESS");
    this.mappedAddress = response.getAttributeValue("XOR-MAPPED-ADDRESS");
    const exp = response.getAttributeValue("LIFETIME");
    log("connect", this.relayedAddress, this.mappedAddress, { exp });

    this.refreshHandle = future(this.refresh(exp));
  }

  async createPermission(peerAddress: Address) {
    const request = new Message(methods.CREATE_PERMISSION, classes.REQUEST);
    request
      .setAttribute("XOR-PEER-ADDRESS", peerAddress)
      .setAttribute("USERNAME", this.username)
      .setAttribute("REALM", this.realm)
      .setAttribute("NONCE", this.nonce);
    const [response] = await this.request(request, this.server).catch((e) => {
      request;
      throw e;
    });
    return response;
  }

  refresh = (exp: number) =>
    new PCancelable(async (_, f, onCancel) => {
      let run = true;
      onCancel(() => {
        run = false;
        f("cancel");
      });

      while (run) {
        // refresh before expire
        const delay = (5 / 6) * exp * 1000;
        log("refresh delay", delay, { exp });
        await setTimeout(delay);

        const request = new Message(methods.REFRESH, classes.REQUEST);
        request.setAttribute("LIFETIME", exp);

        try {
          const [message] = await this.requestWithRetry(request, this.server);
          exp = message.getAttributeValue("LIFETIME");
          log("refresh", { exp });
        } catch (error) {
          log("refresh error", error);
        }
      }
    });

  async request(request: Message, addr: Address): Promise<[Message, Address]> {
    if (this.transactions[request.transactionIdHex]) {
      throw new Error("exist");
    }
    if (this.integrityKey) {
      request
        .setAttribute("USERNAME", this.username)
        .setAttribute("REALM", this.realm)
        .setAttribute("NONCE", this.nonce)
        .addMessageIntegrity(this.integrityKey)
        .addFingerprint();
    }

    const transaction = new Transaction(request, addr, this);
    this.transactions[request.transactionIdHex] = transaction;

    try {
      return await transaction.run();
    } catch (e) {
      throw e;
    } finally {
      delete this.transactions[request.transactionIdHex];
    }
  }

  async requestWithRetry(
    request: Message,
    addr: Address,
  ): Promise<[Message, Address]> {
    let message: Message, address: Address;
    try {
      [message, address] = await this.request(request, addr);
    } catch (error) {
      if (error instanceof TransactionFailed == false) {
        log("requestWithRetry error", error);
        throw error;
      }

      // resolve dns address
      this.server = error.addr;

      const [errorCode] = error.response.getAttributeValue("ERROR-CODE");
      const nonce = error.response.getAttributeValue("NONCE");
      const realm = error.response.getAttributeValue("REALM");

      if (
        ((errorCode === 401 && realm) || (errorCode === 438 && this.realm)) &&
        nonce
      ) {
        log("retry with nonce", errorCode);

        this.nonce = nonce;
        if (errorCode === 401) {
          this.realm = realm;
        }
        this.integrityKey = makeIntegrityKey(
          this.username,
          this.realm!,
          this.password,
        );

        request.transactionId = randomTransactionId();
        [message, address] = await this.request(request, this.server);
      } else {
        throw error;
      }
    }
    return [message!, address!];
  }

  async sendData(data: Buffer, addr: Address) {
    const channel = await this.getChannel(addr);

    const header = jspack.Pack("!HH", [channel.number, data.length]);
    this.transport.send(
      Buffer.concat([Buffer.from(header), data]),
      this.server,
    );
  }

  async getChannel(addr: Address) {
    if (this.channelBinding) {
      await this.channelBinding;
    }

    let channel = this.channelByAddr[addr.join("")];

    if (!channel) {
      this.channelByAddr[addr.join("")] = {
        number: this.channelNumber++,
        address: addr,
      };
      channel = this.channelByAddr[addr.join("")];
      this.addrByChannel[channel.number] = addr;

      this.channelBinding = this.channelBind(channel.number, addr);
      await this.channelBinding.catch((e) => {
        log("channelBind error", e);
        throw e;
      });
      this.channelRefreshAt = int(Date.now() / 1000) + this.channelRefreshTime;
      this.channelBinding = undefined;
      log("channelBind", channel);
    } else if (this.channelRefreshAt < int(Date.now() / 1000)) {
      this.channelBinding = this.channelBind(channel.number, addr);
      this.channelRefreshAt = int(Date.now() / 1000) + this.channelRefreshTime;
      await this.channelBinding.catch((e) => {
        log("channelBind error", e);
        throw e;
      });
      this.channelBinding = undefined;
      log("channelBind refresh", channel);
    }
    return channel;
  }

  private async channelBind(channelNumber: number, addr: Address) {
    const request = new Message(methods.CHANNEL_BIND, classes.REQUEST);
    request
      .setAttribute("CHANNEL-NUMBER", channelNumber)
      .setAttribute("XOR-PEER-ADDRESS", addr);
    const [response] = await this.requestWithRetry(request, this.server);
    if (response.messageMethod !== methods.CHANNEL_BIND) {
      throw new Error("should be CHANNEL_BIND");
    }
  }

  async sendStun(message: Message, addr: Address) {
    await this.transport.send(message.bytes, addr);
  }
}

export async function createTurnEndpoint(
  serverAddr: Address,
  username: string,
  password: string,
  {
    lifetime,
    portRange,
    interfaceAddresses,
  }: {
    lifetime?: number;
    ssl?: boolean;
    transport?: "udp";
    portRange?: [number, number];
    interfaceAddresses?: InterfaceAddresses;
  },
) {
  if (lifetime == undefined) {
    lifetime = DEFAULT_ALLOCATION_LIFETIME;
  }

  const transport = await UdpTransport.init(
    "udp4",
    portRange,
    interfaceAddresses,
  );

  const turnClient = new TurnClient(
    serverAddr,
    username,
    password,
    lifetime,
    transport,
  );

  await turnClient.connectionMade();
  await turnClient.connect();
  const turnTransport = new TurnTransport(turnClient);

  return turnTransport;
}

export function makeIntegrityKey(
  username: string,
  realm: string,
  password: string,
) {
  return createHash("md5")
    .update(Buffer.from([username, realm, password].join(":")))
    .digest();
}

function isChannelData(data: Buffer) {
  return (data[0] & 0xc0) == 0x40;
}
