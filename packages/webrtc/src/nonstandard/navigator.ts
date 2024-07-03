import { MediaStream, MediaStreamTrack } from "../media/track";

export class Navigator {
  readonly mediaDevices: MediaDevices;

  constructor(props: ConstructorParameters<typeof MediaDevices>[0] = {}) {
    this.mediaDevices = new MediaDevices(props);
  }
}

class MediaDevices extends EventTarget {
  video?: MediaStreamTrack;
  audio?: MediaStreamTrack;

  constructor(props: { video?: MediaStreamTrack; audio?: MediaStreamTrack }) {
    super();
    this.video = props.video;
    this.audio = props.audio;
  }

  readonly getUserMedia = async (
    constraints: MediaStreamConstraints,
  ): Promise<MediaStream> => {
    if (constraints.video && constraints.audio) {
      return new MediaStream([this.video!, this.audio!]);
    } else if (constraints.audio) {
      return new MediaStream([this.audio!]);
    } else if (constraints.video) {
      return new MediaStream([this.video!]);
    }

    throw new Error("Not implemented");
  };

  readonly getDisplayMedia = this.getUserMedia;
}

interface MediaStreamConstraints {
  audio?: boolean | MediaTrackConstraints;
  peerIdentity?: string;
  preferCurrentTab?: boolean;
  video?: boolean | MediaTrackConstraints;
}

interface MediaTrackConstraints extends MediaTrackConstraintSet {
  advanced?: MediaTrackConstraintSet[];
}

interface MediaTrackConstraintSet {
  aspectRatio?: ConstrainDouble;
  autoGainControl?: ConstrainBoolean;
  channelCount?: ConstrainULong;
  deviceId?: ConstrainDOMString;
  displaySurface?: ConstrainDOMString;
  echoCancellation?: ConstrainBoolean;
  facingMode?: ConstrainDOMString;
  frameRate?: ConstrainDouble;
  groupId?: ConstrainDOMString;
  height?: ConstrainULong;
  noiseSuppression?: ConstrainBoolean;
  sampleRate?: ConstrainULong;
  sampleSize?: ConstrainULong;
  width?: ConstrainULong;
}

type ConstrainDOMString = string | string[] | ConstrainDOMStringParameters;
interface ConstrainDOMStringParameters {
  exact?: string | string[];
  ideal?: string | string[];
}
type ConstrainBoolean = boolean | ConstrainBooleanParameters;
interface ConstrainBooleanParameters {
  exact?: boolean;
  ideal?: boolean;
}
type ConstrainULong = number | ConstrainULongRange;
interface ConstrainULongRange extends ULongRange {
  exact?: number;
  ideal?: number;
}
interface ULongRange {
  max?: number;
  min?: number;
}
type ConstrainDouble = number | ConstrainDoubleRange;
interface ConstrainDoubleRange extends DoubleRange {
  exact?: number;
  ideal?: number;
}
interface DoubleRange {
  max?: number;
  min?: number;
}
