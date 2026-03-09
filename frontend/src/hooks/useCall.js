import { useEffect, useState, useRef } from 'react';
import Peer from 'peerjs';
import io from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const socket = io(BACKEND_URL);

export const useCall = (userId) => {
    const [peerId, setPeerId] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [myStream, setMyStream] = useState(null);
    const peerRef = useRef(null);

    useEffect(() => {
        let host = 'localhost';
        let port = 5000;
        let secure = false;

        try {
            if (BACKEND_URL && BACKEND_URL !== 'http://localhost:5000') {
                const url = new URL(BACKEND_URL);
                host = url.hostname;
                port = url.port || (url.protocol === 'https:' ? 443 : 80);
                secure = url.protocol === 'https:';
            }
        } catch (e) {
            console.error("Invalid BACKEND_URL:", e);
        }

        const peer = new Peer(userId, {
            host: host,
            port: port,
            secure: secure,
            path: '/peerjs'
        });

        peer.on('open', (id) => {
            setPeerId(id);
            socket.emit('join-room', 'default-room', id);
        });

        peer.on('call', (call) => {
            navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
                setMyStream(stream);
                call.answer(stream);
                call.on('stream', (userRemoteStream) => {
                    setRemoteStream(userRemoteStream);
                });
            });
        });

        peerRef.current = peer;

        return () => {
            peer.destroy();
        };
    }, [userId]);

    const startCall = (remoteUserId) => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
            setMyStream(stream);
            const call = peerRef.current.call(remoteUserId, stream);
            call.on('stream', (userRemoteStream) => {
                setRemoteStream(userRemoteStream);
            });
        });
    };

    return { peerId, remoteStream, myStream, startCall };
};
