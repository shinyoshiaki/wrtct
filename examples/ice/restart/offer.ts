import { Server } from "ws";
import { RTCPeerConnection } from "../../../packages/webrtc/src";

const server = new Server({ port: 8888 });
console.log("start");

server.on("connection", async (socket) => {
  console.log("connection");
  const pc = new RTCPeerConnection();
  pc.onIceCandidate.subscribe((candidate) => {
    socket.send(JSON.stringify(candidate));
  });
  pc.iceConnectionStateChange.subscribe((state) => {
    console.log(state);
  });

  const transceiver = pc.addTransceiver("video");
  transceiver.onTrack.subscribe((track) => {
    transceiver.sender.replaceTrack(track);
    setInterval(async () => {
      await transceiver.receiver.sendRtcpPLI(track.ssrc);
    }, 3000);
  });

  pc.setLocalDescription(await pc.createOffer());
  const sdp = JSON.stringify(pc.localDescription);
  socket.send(sdp);

  socket.on("message", async (data: any) => {
    const msg = JSON.parse(data);
    console.log(msg);
    if (msg.candidate) {
      await pc.addIceCandidate(msg);
    } else {
      if (msg.type === "offer") {
        await pc.setRemoteDescription(msg);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        const sdp = JSON.stringify(pc.localDescription);
        socket.send(sdp);
      } else if (msg.type === "answer") {
        await pc.setRemoteDescription(msg);
      } else if (msg.type === "restart") {
        const offer = await pc.createOffer({ iceRestart: true });
        await pc.setLocalDescription(offer);
        const sdp = JSON.stringify(pc.localDescription);
        socket.send(sdp);
      }
    }
  });
});
