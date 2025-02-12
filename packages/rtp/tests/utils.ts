import { readFileSync } from "fs";

import type { Transport } from "../src/transport";

export function load(name: string) {
  const base = __dirname;
  const data = readFileSync(`${base}/data/` + name);
  return data;
}

export function createMockTransportPair(): [Transport, Transport] {
  class Mock implements Transport {
    onData!: (buf: Buffer) => void;
    target!: Mock;

    send(buf: Buffer) {
      this.target.onData(buf);
    }
    close() {}
  }

  const a = new Mock();
  const b = new Mock();
  a.target = b;
  b.target = a;

  return [a, b];
}
