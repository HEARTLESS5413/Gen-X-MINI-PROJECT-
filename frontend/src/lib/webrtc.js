// ===== WebRTC Peer Connection Engine =====
// Handles peer-to-peer audio/video connections using STUN/TURN servers

const ICE_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
];

export class WebRTCConnection {
    constructor({ onRemoteStream, onIceCandidate, onConnectionStateChange }) {
        this.pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        this.localStream = null;
        this.remoteStream = null;
        this.onRemoteStream = onRemoteStream;
        this.onIceCandidate = onIceCandidate;
        this.onConnectionStateChange = onConnectionStateChange;

        // Handle incoming remote tracks
        this.pc.ontrack = (event) => {
            this.remoteStream = event.streams[0];
            if (this.onRemoteStream) this.onRemoteStream(event.streams[0]);
        };

        // Handle ICE candidates
        this.pc.onicecandidate = (event) => {
            if (event.candidate && this.onIceCandidate) {
                this.onIceCandidate(event.candidate.toJSON());
            }
        };

        // Connection state monitoring
        this.pc.onconnectionstatechange = () => {
            if (this.onConnectionStateChange) {
                this.onConnectionStateChange(this.pc.connectionState);
            }
        };
    }

    // Get local media stream
    async getLocalStream(type = 'audio') {
        try {
            const constraints = type === 'video'
                ? { audio: true, video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } }
                : { audio: true, video: false };

            this.localStream = await navigator.mediaDevices.getUserMedia(constraints);

            // Add tracks to peer connection
            this.localStream.getTracks().forEach(track => {
                this.pc.addTrack(track, this.localStream);
            });

            return this.localStream;
        } catch (err) {
            console.error('Failed to get media:', err);
            throw err;
        }
    }

    // Create SDP offer (caller side)
    async createOffer() {
        const offer = await this.pc.createOffer();
        await this.pc.setLocalDescription(offer);
        return this.pc.localDescription;
    }

    // Create SDP answer (receiver side)
    async createAnswer(offer) {
        await this.pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await this.pc.createAnswer();
        await this.pc.setLocalDescription(answer);
        return this.pc.localDescription;
    }

    // Set remote answer (caller side, after receiver responds)
    async setRemoteAnswer(answer) {
        await this.pc.setRemoteDescription(new RTCSessionDescription(answer));
    }

    // Add ICE candidate from remote peer
    async addIceCandidate(candidate) {
        try {
            await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
            console.error('Error adding ICE candidate:', err);
        }
    }

    // Toggle mute
    toggleMute() {
        if (!this.localStream) return false;
        const audioTracks = this.localStream.getAudioTracks();
        const newState = !audioTracks[0]?.enabled;
        audioTracks.forEach(t => t.enabled = newState);
        return !newState; // return isMuted
    }

    // Toggle camera
    toggleCamera() {
        if (!this.localStream) return false;
        const videoTracks = this.localStream.getVideoTracks();
        const newState = !videoTracks[0]?.enabled;
        videoTracks.forEach(t => t.enabled = newState);
        return newState; // return isVideoOn
    }

    // Replace video track with screen share
    async startScreenShare() {
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            const screenTrack = screenStream.getVideoTracks()[0];
            const sender = this.pc.getSenders().find(s => s.track?.kind === 'video');
            if (sender) await sender.replaceTrack(screenTrack);

            screenTrack.onended = () => this.stopScreenShare();
            this._screenStream = screenStream;
            return screenStream;
        } catch (err) {
            console.error('Screen share error:', err);
            return null;
        }
    }

    // Restore camera from screen share
    async stopScreenShare() {
        if (this._screenStream) {
            this._screenStream.getTracks().forEach(t => t.stop());
        }
        const cameraTrack = this.localStream?.getVideoTracks()[0];
        const sender = this.pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender && cameraTrack) await sender.replaceTrack(cameraTrack);
    }

    // Clean up
    destroy() {
        this.localStream?.getTracks().forEach(t => t.stop());
        this._screenStream?.getTracks().forEach(t => t.stop());
        this.pc.close();
    }
}
