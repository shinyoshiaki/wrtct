import { exec } from "child_process";
import { createSocket } from "dgram";
import { Server } from "ws";
import {
  MediaStreamTrack,
  RTCPeerConnection,
  RTCRtpCodecParameters,
  RtpPacket,
  randomPort,
} from "../../../packages/webrtc/src";

// open answer.html

const server = new Server({ port: 8888 });
console.log("start");

server.on("connection", async (socket) => {
  const payloadType = 96;
  const pc = new RTCPeerConnection({
    codecs: {
      audio: [],
      video: [
        new RTCRtpCodecParameters({
          mimeType: "video/VP8",
          clockRate: 90000,
          payloadType: payloadType,
        }),
      ],
    },
  });

  const track = new MediaStreamTrack({ kind: "video" });
  randomPort().then((port) => {
    const udp = createSocket("udp4");
    udp.bind(port);

    exec(
      `ffmpeg -re -f lavfi -i testsrc=size=640x480:rate=30 -vcodec libvpx -cpu-used 5 -deadline 1 -g 10 -error-resilient 1 -auto-alt-ref 1 -f rtp rtp://127.0.0.1:${port}`,
    );
    udp.on("message", (data) => {
      const rtp = RtpPacket.deSerialize(data);
      rtp.header.payloadType = payloadType;
      track.writeRtp(rtp);
    });
  });
  pc.addTransceiver(track, { direction: "sendonly" });

  await pc.setLocalDescription(await pc.createOffer());
  const sdp = JSON.stringify(pc.localDescription);
  socket.send(sdp);

  socket.on("message", (data: any) => {
    pc.setRemoteDescription(JSON.parse(data));
  });
});
