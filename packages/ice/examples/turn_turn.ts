import { validateAddress } from "../src/ice";
import { createTurnEndpoint } from "../src/turn/protocol";
import { Address } from "../src/types/model";

const url2Address = (url?: string) => {
  if (!url) return;
  const [address, port] = url.split(":");
  return [address, parseInt(port)] as Address;
};
const address: Address = url2Address("turn.werift.com:443")!;
const username = "";
const password = "";

(async () => {
  console.log("address", validateAddress(address)!);
  const turn1 = await createTurnEndpoint(
    validateAddress(address)!,
    username,
    password,
    {},
  );

  const turn2 = await createTurnEndpoint(address, username, password, {});
  await turn2.turn.getChannel(turn1.turn.relayedAddress);

  await turn1.turn.getChannel(turn2.turn.relayedAddress);
  
  turn1.turn.onData.subscribe((data, addr) => {
    console.log("turn1 onData", data.toString(), addr);
    turn1.sendData(Buffer.from("pong"), turn2.turn.mappedAddress);
  });
  turn2.turn.onData.subscribe((data, addr) => {
    console.log("turn2 onData", data.toString(), addr);
  });

  setInterval(() => {
    turn2.sendData(Buffer.from("ping"), turn1.turn.mappedAddress);
  }, 1000);
})();
