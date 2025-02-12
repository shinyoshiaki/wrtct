import io from "socket.io-client";
import { RTCPeerConnection } from "../../../packages/webrtc/src";

const socket = io("https://serene-anchorage-28732.herokuapp.com/");

console.log("start browser first");

(async () => {
  const pc = new RTCPeerConnection({});
  pc.onIceCandidate.subscribe((candidate) => {
    socket.emit("sdp", {
      candidate: JSON.stringify(candidate),
      roomId: "test",
    });
  });
  const transceiver = pc.addTransceiver("video");
  transceiver.onTrack.subscribe((track) => {
    transceiver.sender.replaceTrack(track);
  });

  const offer = await pc.createOffer();
  pc.setLocalDescription(offer);
  const sdp = JSON.stringify(pc.localDescription);

  socket.emit("join", { roomId: "test" });
  socket.on("join", () => {
    console.log("join");
    socket.emit("sdp", { sdp, roomId: "test" });
  });
  socket.on("sdp", (data: any) => {
    console.log(data);
    const msg = JSON.parse(data.sdp);
    if (msg.sdp) {
      pc.setRemoteDescription(msg);
    } else if (msg.candidate) {
      console.log(data.candidate);
      pc.addIceCandidate(msg);
    }
  });
})();
