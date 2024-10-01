import { createSocket } from "dgram";
import { randomPort } from "../../common/src";
import { getGlobalIp, url2Address } from "../src";
import { createTurnEndpoint } from "../src/turn/protocol";
import type { Address } from "../src/types/model";

const address: Address = url2Address("127.0.0.1:3478")!;
const username = "username";
const password = "password";

(async () => {
  const turn1 = await createTurnEndpoint(address, username, password, {
    transport: "tcp",
  });
  turn1.turn.onData.subscribe((data, addr) => {
    console.log("turn1 onData", data.toString(), addr);
  });

  console.log("turn1", turn1.turn.relayedAddress, turn1.turn.mappedAddress);

  const ip = await getGlobalIp();
  const port = await randomPort();
  const socket = createSocket("udp4");
  socket.bind(port);

  await turn1.turn.getChannel([ip, port]);

  setInterval(() => {
    socket.send(
      Buffer.from("ping"),
      turn1.turn.relayedAddress[1],
      turn1.turn.relayedAddress[0],
    );
  }, 1000);
})();
