import { RTCRtpCodecParameters } from "..";

export const useH264 = (props: Partial<RTCRtpCodecParameters> = {}) =>
  new RTCRtpCodecParameters({
    mimeType: "video/h264",
    clockRate: 90000,
    rtcpFeedback: [
      { type: "nack" },
      { type: "nack", parameter: "pli" },
      { type: "goog-remb" },
    ],
    parameters:
      "profile-level-id=42e01f;packetization-mode=1;level-asymmetry-allowed=1",
    ...props,
  });

export const useVP8 = (props: Partial<RTCRtpCodecParameters> = {}) =>
  new RTCRtpCodecParameters({
    mimeType: "video/VP8",
    clockRate: 90000,
    rtcpFeedback: [
      { type: "nack" },
      { type: "nack", parameter: "pli" },
      { type: "goog-remb" },
    ],
    ...props,
  });
