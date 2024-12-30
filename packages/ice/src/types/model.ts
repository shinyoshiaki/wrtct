import type { Candidate } from "../candidate";
import type { Event } from "../imports/common";
import type { Message } from "../stun/message";

export type Address = Readonly<[string, number]>;

export interface Protocol {
  type: string;
  onRequestReceived: Event<[Message, readonly [string, number], Buffer]>;
  request: (
    message: Message,
    addr: Address,
    integrityKey?: Buffer,
    retransmissions?: any,
  ) => Promise<[Message, Address]>;
  close: () => Promise<void>;
  connectionMade: (...args: any) => Promise<void>;
  sendStun: (message: Message, addr: Address) => Promise<void>;
  sendData: (data: Buffer, addr: Address) => Promise<void>;
  localCandidate?: Candidate;
  sentMessage?: Message;
  responseAddr?: Address;
  responseMessage?: string;
}
