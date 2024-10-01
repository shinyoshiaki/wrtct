import { validateAddress } from "../src/ice";
import { createTurnEndpoint } from "../src/turn/protocol";
import type { Address } from "../src/types/model";
import { url2Address } from "../src/utils";

const address: Address = url2Address("127.0.0.1:3478")!;
const username = "username";
const password = "password";

(async () => {
  const receiver = await createTurnEndpoint(
    validateAddress(address)!,
    username,
    password,
    { transport: "udp" },
  );

  const sender = await createTurnEndpoint(address, username, password, {
    transport: "udp",
  });

  await sender.turn.getChannel(receiver.turn.relayedAddress).catch((e) => e);
  await receiver.turn.getChannel(sender.turn.relayedAddress).catch((e) => e);

  receiver.turn.onData.subscribe((data, addr) => {
    console.log("receiver onData", data.toString(), addr);
    receiver.sendData(
      Buffer.from("pong " + new Date().toISOString()),
      sender.turn.relayedAddress,
    );
  });
  sender.turn.onData.subscribe((data, addr) => {
    console.log("sender onData", data.toString(), addr);
  });

  setInterval(async () => {
    await sender.sendData(
      Buffer.from("ping " + new Date().toISOString()),
      receiver.turn.relayedAddress,
    );
  }, 2000);
})();
