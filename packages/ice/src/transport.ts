import { type Socket, type SocketType, createSocket } from "dgram";
import debug from "debug";

import { type Socket as TcpSocket, connect } from "net";
import {
  type InterfaceAddresses,
  findPort,
  interfaceAddress,
} from "../../common/src";
import type { Address } from "./types/model";
import { normalizeFamilyNodeV18 } from "./utils";

const log = debug("werift-ice:packages/ice/src/transport.ts");

export class UdpTransport implements Transport {
  readonly type = "udp";
  readonly socket: Socket;
  onData: (data: Buffer, addr: Address) => void = () => {};

  private constructor(
    private socketType: SocketType,
    private portRange?: [number, number],
    private interfaceAddresses?: InterfaceAddresses,
  ) {
    this.socket = createSocket(socketType);
    this.socket.on("message", (data, info) => {
      if (normalizeFamilyNodeV18(info.family) === 6) {
        [info.address] = info.address.split("%"); // example fe80::1d3a:8751:4ffd:eb80%wlp82s0
      }
      try {
        this.onData(data, [info.address, info.port]);
      } catch (error) {
        log("onData error", error);
      }
    });
  }

  static async init(
    type: SocketType,
    portRange?: [number, number],
    interfaceAddresses?: InterfaceAddresses,
  ) {
    const transport = new UdpTransport(type, portRange, interfaceAddresses);
    await transport.init();
    return transport;
  }

  private async init() {
    const address = interfaceAddress(this.socketType, this.interfaceAddresses);
    if (this.portRange) {
      const port = await findPort(
        this.portRange[0],
        this.portRange[1],
        this.socketType,
        this.interfaceAddresses,
      );
      this.socket.bind({ port, address });
    } else {
      this.socket.bind({ address });
    }
    await new Promise((r) => this.socket.once("listening", r));
  }

  send = (data: Buffer, addr: Address) =>
    new Promise<void>((r, f) => {
      this.socket.send(data, addr[1], addr[0], (error) => {
        if (error) {
          log("send error", addr, data);
          f(error);
        } else {
          r();
        }
      });
    });

  address() {
    return this.socket.address();
  }

  close = () =>
    new Promise<void>((r) => {
      this.socket.once("close", r);
      try {
        this.socket.close();
      } catch (error) {
        r();
      }
    });
}

export class TcpTransport implements Transport {
  readonly type = "tcp";
  private connecting!: Promise<void>;
  private client!: TcpSocket;
  onData: (data: Buffer, addr: Address) => void = () => {};
  closed = false;

  private constructor(private addr: Address) {
    this.connect();
  }

  private connect() {
    if (this.closed) {
      return;
    }

    if (this.client) {
      this.client.destroy();
    }
    this.connecting = new Promise((r, f) => {
      try {
        this.client = connect({ port: this.addr[1], host: this.addr[0] }, r);
      } catch (error) {
        f(error);
      }
    });

    this.client.on("data", (data) => {
      const addr = [
        this.client.remoteAddress!,
        this.client.remotePort!,
      ] as Address;
      this.onData(data, addr);
    });
    this.client.on("end", () => {
      this.connect();
    });
    this.client.on("error", (error) => {
      console.log("error", error);
    });
  }

  private async init() {
    await this.connecting;
  }

  static async init(addr: Address) {
    const transport = new TcpTransport(addr);
    await transport.init();
    return transport;
  }

  send = async (data: Buffer, addr: Address) => {
    await this.connecting;
    this.client.write(data, (err) => {
      if (err) {
        console.log("err", err);
      }
    });
  };

  close = async () => {
    this.closed = true;
    this.client.destroy();
  };
}

export interface Transport {
  type: string;
  onData: (data: Buffer, addr: Address) => void;
  send: (data: Buffer, addr: Address) => Promise<void>;
  close: () => Promise<void>;
}
