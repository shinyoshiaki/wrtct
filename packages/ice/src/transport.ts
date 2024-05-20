import { type Socket, type SocketType, createSocket } from "dgram";
import debug from "debug";

import {
  type InterfaceAddresses,
  findPort,
  interfaceAddress,
} from "../../common/src";
import type { Address } from "./types/model";
import { normalizeFamilyNodeV18 } from "./utils";

const log = debug("werift-ice:packages/ice/src/transport.ts");

export class UdpTransport implements Transport {
  private socket: Socket;
  onData: (data: Buffer, addr: Address) => void = () => {};

  constructor(
    private type: SocketType,
    private portRange?: [number, number],
    private interfaceAddresses?: InterfaceAddresses,
  ) {
    this.socket = createSocket(this.type);
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
    const address = interfaceAddress(this.type, this.interfaceAddresses);
    if (this.portRange) {
      const port = await findPort(
        this.portRange[0],
        this.portRange[1],
        this.type,
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

export interface Transport {
  onData: (data: Buffer, addr: Address) => void;
  send: (data: Buffer, addr: Address) => Promise<void>;
}
