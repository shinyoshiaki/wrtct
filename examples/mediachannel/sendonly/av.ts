import { Server } from "ws";
import {
  RTCPeerConnection,
  RTCRtpCodecParameters,
} from "../../../packages/webrtc/src";
import { getUserMedia } from "../../../packages/webrtc/src/nonstandard";

const server = new Server({ port: 8881 });
console.log("start");

server.on("connection", async (socket) => {
  const pc = new RTCPeerConnection({
    codecs: {
      video: [
        new RTCRtpCodecParameters({
          mimeType: "video/H264",
          clockRate: 90000,
          rtcpFeedback: [
            { type: "nack" },
            { type: "nack", parameter: "pli" },
            { type: "goog-remb" },
          ],
        }),
      ],
      audio: [
        new RTCRtpCodecParameters({
          mimeType: "audio/opus",
          clockRate: 48000,
          channels: 2,
        }),
      ],
    },
  });

  const stream = await getUserMedia({
    path: "~/Downloads/test.mp4",
    loop: true,
    width: 320,
    height: 240,
  });

  pc.addTransceiver(stream.audio, { direction: "sendonly" });
  pc.addTransceiver(stream.video, { direction: "sendonly" });

  pc.connectionStateChange
    .watch((state) => state === "connected")
    .then(() => {
      stream.start();
    });

  await pc.setLocalDescription(await pc.createOffer());
  const sdp = JSON.stringify(pc.localDescription);
  socket.send(sdp);

  socket.on("message", (data: any) => {
    pc.setRemoteDescription(JSON.parse(data));
  });
});
