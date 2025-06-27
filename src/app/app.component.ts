import { Component, ElementRef, ViewChild } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PeerService } from './services/peer.service';

@Component({
  selector: 'app-root',
  imports: [NgFor, NgIf, FormsModule],
  template: `
    <div class="video-chat-container">
      <div class="header-container">
        <div class="title-container">
          <h2 class="title">P2P Video Chat</h2>
          <div class="connection-status">
            <p>
              <p *ngIf="connectionStatus === 'connecting'">
                <strong class="connecting">Connecting to server...</strong>
              </p>
              <p *ngIf="connectionStatus === 'connected' && !room">
                <strong class="connected">Connected. Waiting for room input...</strong>
              </p>
              <p *ngIf="connectionStatus === 'failed'">
                <strong class="error">Connection failed</strong>
              </p>
              <div class="room-info" *ngIf="room">
                <p class="room-name">Joined room: {{ room }}</p>
                <button class="leave-room-btn" (click)="leaveRoom()" *ngIf="room">Leave Room</button>
              </div>
          </div>
        </div>
        <button class="reload-btn" *ngIf="connectionStatus === 'failed'" (click)="retryConnection()">
          <img src="/reload_icon.png" alt="Reload" width="40" />
        </button>
      </div>
      <div class="video-container">
        <video #localVideo class="video" autoplay muted></video>
        <video #remoteVideo class="video" autoplay></video>
      </div>
      <div class="chat-container">
        <div class="messages">
          <p *ngFor="let msg of messages">
            <strong>{{ msg.sender && msg.sender + ": " }}</strong>
            <span [class.bold]="!msg.sender">{{ msg.message }}</span>
          </p>
          <div id="anchor"></div>
        </div>
        <input
          type="text"
          [(ngModel)]="newMessage"
          placeholder="Type a message..."
          (keydown.enter)="sendMessage()"
        />
      </div>
    </div>
  `,
  styles: [
    `
      .bold {
        font-weight: bold;
      }
      .video-chat-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        margin: 8px;
        min-height: calc(100vh - 16px);
        background: linear-gradient(135deg, #4c6ef5, #15aabf);
        color: #fff;
        font-family: 'Arial', sans-serif;
      }
      .video-container {
        display: flex;
        flex-flow: row wrap;
        gap: 20px;
        margin-bottom: 20px;
      }
      .header-container {
        position: relative;
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        width: 100%;
        max-width: 800px;
        margin-bottom: 20px;
      }
      .header-container .title-container {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        margin: auto;
      }
      .header-container .reload-btn {
        position: absolute;
        right: 0;
        top: 0px;
        padding: 7px 16px;
        border: none;
        border-radius: 999px;
        cursor: pointer;
        background: linear-gradient(90deg, #ff7675 0%, #fd5f00 100%);
        color: #fff;
        box-shadow: 0 2px 8px rgba(253, 95, 0, 0.15);
        transition: background 0.3s, transform 0.2s, box-shadow 0.2s;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .header-container .reload-btn:hover {
        background: linear-gradient(90deg, #fd5f00 0%, #ff7675 100%);
        transform: scale(1.07);
        box-shadow: 0 4px 16px rgba(253, 95, 0, 0.22);
      }
      .header-container .reload-btn:active {
        transform: scale(0.95);
      }
      .header-container .leave-room-btn {
        position: relative;
        right: 0;
        top: 0px;
        padding: 7px 16px;
        border: none;
        border-radius: 999px;
        cursor: pointer;
        background: linear-gradient(90deg,rgb(245, 177, 76) 0%,rgb(191, 160, 21) 100%);
        color: #fff;
        box-shadow: 0 2px 8px rgba(21, 33, 87, 0.15);
        transition: transform 0.2s, box-shadow 0.2s;
      }
      .header-container .leave-room-btn:hover {
        background: linear-gradient(90deg,rgb(191, 160, 21)
          0%,rgb(245, 177, 76) 100%);
        box-shadow: 0 4px 16px rgba(21, 33, 87, 0.22);
      }
      .header-container .leave-room-btn:active {
        transform: scale(0.95);
        background: rgb(191, 160, 21);
        box-shadow: 0 2px 8px rgba(21, 33, 87, 0.15);
      }
      .video {
        width: 400px;
        height: 300px;
        border-radius: 10px;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
        background: #000;
        margin: auto;
      }
      .controls {
        margin-top: 20px;
      }
      .connection-status {
        margin-top: 8px;
        font-size: 1.2rem;
      }
      .connection-status .error {
        display: inline-block;
        color: #ff4d4d;;
        background: linear-gradient(90deg, #ffd6d6 0%, #ffe6e6 100%);
        padding: 6px 18px;
        border-radius: 999px;
        font-weight: bold;
        box-shadow: 0 2px 8px rgba(255, 99, 71, 0.12);
        letter-spacing: 0.5px;
        font-size: 1.1rem;
        border: 1px solid #ffb3b3;
        margin-top: 4px;
        transition: background 0.3s, color 0.3s;
      }
      .connection-status .connecting {
        display: inline-block;
        color:rgb(21, 33, 87);
        background: linear-gradient(90deg, #b7f5c2 0%,rgb(123, 156, 228) 100%);
        padding: 6px 18px;
        border-radius: 999px;
        font-weight: bold;
        box-shadow: 0 2px 8px rgba(123, 228, 149, 0.15);
        letter-spacing: 0.5px;
        font-size: 1.1rem;
        border: 1px solidrgb(123, 156, 228);
        margin-top: 4px;
        transition: background 0.3s, color 0.3s;
      }
      .connection-status .connected {
        display: inline-block;
        color: #155724;
        background: linear-gradient(90deg, #b7f5c2 0%, #7be495 100%);
        padding: 6px 18px;
        border-radius: 999px;
        font-weight: bold;
        box-shadow: 0 2px 8px rgba(123, 228, 149, 0.15);
        letter-spacing: 0.5px;
        font-size: 1.1rem;
        border: 1px solid #7be495;
        margin-top: 4px;
        transition: background 0.3s, color 0.3s;
      }
      .room-info {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 10px;
      }
      .room-info .room-name {
        display: inline-block;
        color:rgb(0, 0, 0);
        background: linear-gradient(90deg,rgb(253, 253, 253) 0%,rgb(189, 236, 250) 100%);
        padding: 6px 18px;
        border-radius: 999px;
        font-weight: bold;
        box-shadow: 0 2px 8px rgba(123, 228, 149, 0.15);
        text-align: center;
        letter-spacing: 0.5px;
        font-size: 1.1rem;
        border: 1px solid rgb(123, 216, 228);
        transition: background 0.3s, color 0.3s;
      }
      .chat-container {
        margin-top: 20px;
        width: 100%;
        max-width: 400px;
      }
      .chat-container .messages {
        display: block; /* Not flex */
        box-sizing: border-box;
        height: 150px;
        overflow-y: auto;
        width: 100%;
        border: 1px solid #ccc;
        padding: 10px;
        background: #fff;
        color: #000;
        margin: 0 auto 10px auto;
      }
      .chat-container .messages * {
        overflow-anchor: none;
      }
      .chat-container #anchor {
        overflow-anchor: auto;
        height: 1px;
      }
      .chat-container input {
        box-sizing: border-box;
        width: 100%;
        padding: 10px;
        font-size: 1rem;
        border: 1px solid #ccc;
        border-radius: 5px;
      }

      @media (max-width: 600px) {
        .video-chat-container {
          margin: 0;
          padding: 24px 8px;
        }
        .video-container {
          flex-direction: column;
          align-items: center;
        }
        .video {
          width: 100%;
          height: auto;
          max-width: 400px;
        }
      }
    `,
  ],
})
export class AppComponent {
  @ViewChild('localVideo') localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideo!: ElementRef<HTMLVideoElement>;

  socket!: Socket;
  peerConnection!: RTCPeerConnection;
  room = '';
  connectionStatus: 'connecting' | 'connected' | 'failed' = 'connecting';
  candidateQueue: RTCIceCandidateInit[] = [];
  messages: { sender: string; message: string }[] = [];
  newMessage: string = '';

  constructor(private peerService: PeerService) {}

  async ngOnInit() {
    const stream = await this.peerService.initStream();
    this.localVideo.nativeElement.srcObject = stream;
    this.localVideo.nativeElement.muted = true;
    this.connectToSocket();
  }

  connectToSocket() {
    this.connectionStatus = 'connecting';
    this.socket = io('https://p2pchat.jgautier.com', {
      path: '/api/socket.io',
      reconnection: false,
    });

    this.awaitSocketConnection()
      .then(() => {
        this.connectionStatus = 'connected';
        this.promptAndJoinRoom();
      })
      .catch(() => {
        this.connectionStatus = 'failed';
      });
  }

  awaitSocketConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket.on('connect', resolve);
      this.socket.on('connect_error', reject);
    });
  }

  retryConnection() {
    if (this.socket) {
      this.socket.disconnect();
    }
    this.connectToSocket();
  }

  promptAndJoinRoom() {
    setTimeout(() => {
      let roomName: string | null = null;
      while (!roomName) {
        roomName = prompt('Enter room name:') || '';
        if (!roomName) alert('Room name is required');
      }
      this.room = roomName;
      this.joinRoom();
    }, 50);
  }

  joinRoom() {
    this.socket.emit('join', this.room);

    this.socket.on('joined', () => this.initPeer(true));
    this.socket.on('chat_message', (data: any) => {
      this.messages.push({ sender: 'Peer', message: data.message });
    });
    this.socket.on('other_user', () => {
      this.messages.push({ sender: '', message: 'A peer has joined the room.' });
      this.initPeer(false);
    });
    this.socket.on('user_left', () => {
      this.remoteVideo.nativeElement.srcObject = null;
      this.messages.push({ sender: '', message: 'Peer has left the room.' });
    });

    this.socket.on('signal', async ({ signal }: any) => {
      if (signal?.type && signal?.sdp) {
        const desc = new RTCSessionDescription(signal);
        await this.peerConnection.setRemoteDescription(desc);

        for (const c of this.candidateQueue) {
          await this.peerConnection.addIceCandidate(c);
        }
        this.candidateQueue = [];

        if (desc.type === 'offer') {
          const answer = await this.peerConnection.createAnswer();
          await this.peerConnection.setLocalDescription(answer);
          this.socket.emit('signal', { signal: answer });
        }
      } else if (signal?.candidate) {
        if (this.peerConnection.remoteDescription) {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(signal));
        } else {
          this.candidateQueue.push(signal);
        }
      }
    });
  }

  leaveRoom() {
    window.location.reload();
  }

  cleanupSocketListeners() {
    this.socket.off('joined');
    this.socket.off('other_user');
    this.socket.off('signal');
    this.socket.off('chat_message');
    this.socket.off('user_left');
  }

  async initPeer(isInitiator: boolean) {
    const stream = this.peerService.getStream();
    this.peerConnection = this.peerService.createPeer(stream);

    this.peerConnection.onicecandidate = (e) => {
      if (e.candidate) {
        this.socket.emit('signal', { signal: e.candidate });
      }
    };

    this.peerConnection.ontrack = (event) => {
      this.remoteVideo.nativeElement.srcObject = event.streams[0];
    };

    if (isInitiator) {
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      this.socket.emit('signal', { signal: offer });
    }
  }

  sendMessage() {
    if (this.newMessage.trim()) {
      this.messages.push({ sender: 'Me', message: this.newMessage });
      this.socket.emit('chat_message', { message: this.newMessage });
      this.newMessage = '';
    }
  }
}