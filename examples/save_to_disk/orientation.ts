import { appendFile, unlink, writeFile } from "fs/promises";
import { Server } from "ws";
import { RTCPeerConnection } from "../../packages/webrtc/src";
import {
  DepacketizeCallback,
  JitterBufferCallback,
  LipsyncCallback,
  NtpTimeCallback,
  RtcpSourceCallback,
  RtpSourceCallback,
  WebmCallback,
  saveToFileSystem,
} from "../../packages/webrtc/src/nonstandard";
import { randomUUID } from "crypto";

// open ./answer.html

const server = new Server({ port: 8878 });
console.log("start");

server.on("connection", async (socket) => {
  const output = `./output-${Date.now()}.webm`;
  console.log("connected", output);
  const pc = new RTCPeerConnection();

  let trackNumber = 1;

  const webm = new WebmCallback(
    [
      {
        kind: "audio",
        codec: "OPUS",
        clockRate: 48000,
        trackNumber: trackNumber++,
      },
      {
        width: 640,
        height: 360,
        kind: "video",
        codec: "VP8",
        clockRate: 90000,
        trackNumber: trackNumber++,
      },
    ],
    { duration: 1000 * 60 * 60 },
  );

  const audio = new RtpSourceCallback();
  const video = new RtpSourceCallback();
  const audioRtcp = new RtcpSourceCallback();
  const videoRtcp = new RtcpSourceCallback();
  const lipsync = new LipsyncCallback({
    syncInterval: 3000,
    bufferLength: 5,
    fillDummyAudioPacket: Buffer.from([0xf8, 0xff, 0xfe]),
  });

  {
    const depacketizer = new DepacketizeCallback("opus");
    const ntpTime = new NtpTimeCallback(48000);

    audio.pipe(ntpTime.input);
    audioRtcp.pipe(ntpTime.input);

    ntpTime.pipe(depacketizer.input);
    depacketizer.pipe(lipsync.inputAudio);
    lipsync.pipeAudio(webm.inputAudio);
  }
  {
    const jitterBuffer = new JitterBufferCallback(90000);
    const ntpTime = new NtpTimeCallback(jitterBuffer.clockRate);
    const depacketizer = new DepacketizeCallback("vp8", {
      isFinalPacketInSequence: (h) => h.marker,
    });

    video.pipe(jitterBuffer.input);
    videoRtcp.pipe(ntpTime.input);

    jitterBuffer.pipe(ntpTime.input);
    ntpTime.pipe(depacketizer.input);
    depacketizer.pipe(lipsync.inputVideo);
    lipsync.pipeVideo((o) => {
      webm.inputVideo({ ...o, trackNumber });
    });
  }

  setInterval(() => {
    webm.addTrackEntry({
      kind: "video",
      codec: "VP8",
      trackNumber: trackNumber++,
      width: 360,
      height: 640,
      clockRate: 90000,
      roll: (trackNumber % 4) * 90,
    });
  }, 1000);

  await unlink(output).catch(() => {});
  const tmp = randomUUID();
  webm.pipe(async (o) => {
    if (o.kind !== "initial") {
      await appendFile(tmp, o.saveToFile);
    }
  });

  pc.addTransceiver("video").onTrack.subscribe((track, transceiver) => {
    transceiver.sender.replaceTrack(track);
    track.onReceiveRtp.subscribe((rtp) => {
      video.input(rtp);
    });
    track.onReceiveRtcp.once((rtcp) => {
      videoRtcp.input(rtcp);
    });
    setInterval(() => {
      transceiver.receiver.sendRtcpPLI(track.ssrc);
    }, 2_000);
  });
  pc.addTransceiver("audio").onTrack.subscribe((track, transceiver) => {
    transceiver.sender.replaceTrack(track);
    track.onReceiveRtp.subscribe((rtp) => {
      audio.input(rtp);
    });
    track.onReceiveRtcp.once((rtcp) => {
      audioRtcp.input(rtcp);
    });
  });

  await pc.setLocalDescription(await pc.createOffer());
  const sdp = JSON.stringify(pc.localDescription);
  socket.send(sdp);

  socket.on("message", (data: any) => {
    pc.setRemoteDescription(JSON.parse(data));
  });

  setTimeout(async () => {
    console.log("stop");
    audio.stop();
    video.stop();
    await pc.close();

    const header = randomUUID();
    await writeFile(header, webm.createStaticPart());
  }, 20_000);
});
