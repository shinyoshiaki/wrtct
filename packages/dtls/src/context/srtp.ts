import type { Profile } from "../imports/rtp";

export class SrtpContext {
  srtpProfile?: Profile;

  static findMatchingSRTPProfile(remote: Profile[], local: Profile[]) {
    for (const v of local) {
      if (remote.includes(v)) return v;
    }
  }
}
