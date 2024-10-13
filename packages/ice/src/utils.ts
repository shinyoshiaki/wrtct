import os from "os";
import * as nodeIp from "ip";
import type { InterfaceAddresses } from "../../common/src/network";
import { classes, methods } from "./stun/const";
import { Message } from "./stun/message";
import { StunProtocol } from "./stun/protocol";
import type { Address } from "./types/model";

export async function getGlobalIp(
  stunServer?: Address,
  interfaceAddresses?: InterfaceAddresses,
) {
  const protocol = new StunProtocol();
  await protocol.connectionMade(true, undefined, interfaceAddresses);
  const request = new Message(methods.BINDING, classes.REQUEST);
  const [response] = await protocol.request(
    request,
    stunServer ?? ["stun.l.google.com", 19302],
  );
  await protocol.close();

  const address = response.getAttributeValue("XOR-MAPPED-ADDRESS");
  return address[0] as string;
}

export function normalizeFamilyNodeV18(family: string | number): 4 | 6 {
  if (family === "IPv4") return 4;
  if (family === "IPv6") return 6;

  return family as 4 | 6;
}

function isAutoconfigurationAddress(info: os.NetworkInterfaceInfo) {
  return (
    normalizeFamilyNodeV18(info.family) === 4 &&
    info.address?.startsWith("169.254.")
  );
}

function nodeIpAddress(family: number): string[] {
  // https://chromium.googlesource.com/external/webrtc/+/master/rtc_base/network.cc#236
  const costlyNetworks = ["ipsec", "tun", "utun", "tap"];
  const banNetworks = ["vmnet", "veth"];

  const interfaces = os.networkInterfaces();

  const all = Object.keys(interfaces)
    .map((nic) => {
      for (const word of [...costlyNetworks, ...banNetworks]) {
        if (nic.startsWith(word)) {
          return {
            nic,
            addresses: [],
          };
        }
      }
      const addresses = interfaces[nic]!.filter(
        (details) =>
          normalizeFamilyNodeV18(details.family) === family &&
          !nodeIp.isLoopback(details.address) &&
          !isAutoconfigurationAddress(details),
      );
      return {
        nic,
        addresses: addresses.map((address) => address.address),
      };
    })
    .filter((address) => !!address);

  // os.networkInterfaces doesn't actually return addresses in a good order.
  // have seen instances where en0 (ethernet) is after en1 (wlan), etc.
  // eth0 > eth1
  all.sort((a, b) => a.nic.localeCompare(b.nic));
  return Object.values(all).flatMap((entry) => entry.addresses);
}

export function getHostAddresses(useIpv4: boolean, useIpv6: boolean) {
  const address: string[] = [];
  if (useIpv4) address.push(...nodeIpAddress(4));
  if (useIpv6) address.push(...nodeIpAddress(6));
  return address;
}

export const url2Address = (url?: string) => {
  if (!url) return;
  const [address, port] = url.split(":");
  return [address, Number.parseInt(port)] as Address;
};
