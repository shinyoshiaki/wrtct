import { createSocket } from "dgram";
import { randomPort } from "../../common/src";
import { getGlobalIp } from "../src";
import { createTurnEndpoint } from "../src/turn/protocol";
import { Address } from "../src/types/model";

const address: Address = ["turn.com", 443];
const username = "";
const password = "";

(async () => {
  const turn1 = await createTurnEndpoint(address, username, password, {});
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
    console.log("send ping");
    socket.send(
      Buffer.from("ping"),
      turn1.turn.relayedAddress[1],
      turn1.turn.relayedAddress[0],
    );
  }, 1000);
})();
