import Event from "rx.mini";

import type { PassThrough } from "stream";
import type { MediaStreamTrack } from "../../media/track";
import type { MediaWriter } from "./writer";
import { WebmFactory } from "./writer/webm";

export class MediaRecorder {
  writer: MediaWriter;
  ext?: string;
  tracks: MediaStreamTrack[] = [];
  started = false;
  onError = new Event<[Error]>();

  constructor(
    public props: Partial<MediaRecorderOptions> & {
      numOfTracks: number;
    } & (
        | {
            path: string;
            stream?: PassThrough;
          }
        | {
            path?: string;
            stream: PassThrough;
          }
      ),
  ) {
    this.tracks = props.tracks ?? this.tracks;

    const { path, stream } = props;

    if (path) {
      this.ext = path.split(".").slice(-1)[0];
      this.writer = (() => {
        switch (this.ext) {
          case "webm":
            return new WebmFactory({
              ...props,
              path: path!,
              stream: stream!,
            });
          default:
            throw new Error();
        }
      })();
    } else {
      this.writer = new WebmFactory({
        ...props,
        path: path!,
        stream: stream!,
      });
    }

    if (this.tracks.length === props.numOfTracks) {
      this.start().catch((error) => {
        this.onError.execute(error);
      });
    }
  }

  async addTrack(track: MediaStreamTrack) {
    this.tracks.push(track);
    await this.start();
  }

  private async start() {
    if (
      this.tracks.length === this.props.numOfTracks &&
      this.started === false
    ) {
      this.started = true;
      await this.writer.start(this.tracks);
    }
  }

  async stop() {
    await this.writer.stop();
  }
}

export interface MediaRecorderOptions {
  width: number;
  height: number;
  jitterBufferLatency: number;
  jitterBufferSize: number;
  waitForKeyframe: boolean;
  defaultDuration: number;
  tracks: MediaStreamTrack[];
  disableNtp: boolean;
}
