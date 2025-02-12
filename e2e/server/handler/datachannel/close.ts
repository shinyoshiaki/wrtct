import type { AcceptFn } from "protoo-server";
import { type RTCDataChannel, RTCPeerConnection } from "../../";
import { peerConfig } from "../../fixture";

export class datachannel_close_server_create_close {
  pc!: RTCPeerConnection;

  async exec(type: string, payload: any, accept: AcceptFn) {
    switch (type) {
      case "init":
        {
          this.pc = new RTCPeerConnection(await peerConfig);
          const dc = this.pc.createDataChannel("dc");
          dc.onMessage.subscribe(() => {
            dc.close();
          });
          dc.stateChanged.subscribe(console.log);
          await this.pc.setLocalDescription(await this.pc.createOffer());
          accept(this.pc.localDescription);
        }
        break;
      case "candidate":
        {
          await this.pc.addIceCandidate(payload);
          accept({});
        }
        break;
      case "answer":
        {
          await this.pc.setRemoteDescription(payload);
          accept({});
        }
        break;
    }
  }
}

export class datachannel_close_server_create_client_close {
  pc!: RTCPeerConnection;
  dc!: RTCDataChannel;

  async exec(type: string, payload: any, accept: AcceptFn) {
    switch (type) {
      case "init":
        {
          this.pc = new RTCPeerConnection(await peerConfig);
          this.dc = this.pc.createDataChannel("dc");
          this.dc.stateChanged
            .watch((state) => state === "open")
            .then(() => {
              this.dc.send("hello");
            });
          await this.pc.setLocalDescription(await this.pc.createOffer());
          accept(this.pc.localDescription);
        }
        break;
      case "candidate":
        {
          await this.pc.addIceCandidate(payload);
          accept({});
        }
        break;
      case "answer":
        {
          await this.pc.setRemoteDescription(payload);
          accept({});
        }
        break;
      case "done":
        {
          await this.dc.stateChanged.watch((state) => state === "closed");
          accept({});
        }
        break;
    }
  }
}

export class datachannel_close_client_create_close {
  pc!: RTCPeerConnection;
  dc!: RTCDataChannel;

  async exec(type: string, payload: any, accept: AcceptFn) {
    switch (type) {
      case "init":
        {
          this.pc = new RTCPeerConnection(await peerConfig);
          await this.pc.setRemoteDescription(payload);
          await this.pc.setLocalDescription(await this.pc.createAnswer());

          this.pc.onDataChannel.subscribe((dc) => {
            this.dc = dc;
            dc.send("hello");
          });

          accept(this.pc.localDescription);
        }
        break;
      case "candidate":
        {
          await this.pc.addIceCandidate(payload);
          accept({});
        }
        break;
      case "done": {
        if (this.dc.readyState !== "closed") {
          await this.dc.stateChanged.watch((state) => state === "closed");
        }
        accept({});
      }
    }
  }
}

export class datachannel_close_client_create_server_close {
  pc!: RTCPeerConnection;

  async exec(type: string, payload: any, accept: AcceptFn) {
    switch (type) {
      case "init":
        {
          this.pc = new RTCPeerConnection(await peerConfig);
          await this.pc.setRemoteDescription(payload);
          await this.pc.setLocalDescription(await this.pc.createAnswer());

          this.pc.onDataChannel.subscribe((dc) => {
            dc.onMessage.once(() => {
              console.log("onmessage");
              dc.close();
            });
          });

          accept(this.pc.localDescription);
        }
        break;
      case "candidate":
        {
          await this.pc.addIceCandidate(payload);
          accept({});
        }
        break;
    }
  }
}
