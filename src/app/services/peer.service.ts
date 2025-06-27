import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PeerService {
  private localStream!: MediaStream;

  async initStream(): Promise<MediaStream> {
    this.localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: {
        noiseSuppression: true,
        echoCancellation: true,
        autoGainControl: true
      }
    });
    return this.localStream;
  }

  getStream(): MediaStream {
    if (!this.localStream) {
      throw new Error('Local stream not initialized. Call initStream() first.');
    }
    return this.localStream;
  }

  createPeer(stream: MediaStream): RTCPeerConnection {
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    stream.getTracks().forEach((track) => {
      peer.addTrack(track, stream);
    });

    return peer;
  }
}