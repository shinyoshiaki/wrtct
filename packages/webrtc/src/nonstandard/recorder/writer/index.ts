import type { PassThrough } from "stream";
import type { MediaRecorderOptions } from "..";
import type { MediaStreamTrack } from "../../..";

export abstract class MediaWriter {
  constructor(
    protected props: Partial<MediaRecorderOptions> & {
      path: string;
      stream?: PassThrough;
    } & { path?: string; stream: PassThrough },
  ) {}

  async start(tracks: MediaStreamTrack[]) {}

  async stop() {}
}
