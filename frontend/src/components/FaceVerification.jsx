import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, Check, X, AlertTriangle } from 'lucide-react';

// Face-api.js loads models from CDN
const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model/';

let faceApiLoaded = false;
let faceApiModule = null;

async function loadFaceApi() {
    if (faceApiLoaded && faceApiModule) return faceApiModule;
    try {
        const faceapi = await import('face-api.js');
        await Promise.all([
            faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        faceApiLoaded = true;
        faceApiModule = faceapi;
        return faceapi;
    } catch (err) {
        console.warn('Face-api.js loading failed, using fallback:', err);
        return null;
    }
}

// Selfie capture component for signup
export function SelfieCapture({ onCapture, onSkip }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [streaming, setStreaming] = useState(false);
    const [captured, setCaptured] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: 480, height: 480 }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setStreaming(true);
            }
        } catch (err) {
            setError('Camera access denied. You can skip this step.');
        }
    };

    const stopCamera = () => {
        if (videoRef.current?.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(t => t.stop());
        }
    };

    const capture = async () => {
        if (!videoRef.current || !canvasRef.current) return;
        setLoading(true);
        setError('');

        const canvas = canvasRef.current;
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);

        const imageData = canvas.toDataURL('image/jpeg', 0.8);

        // Try face detection
        const faceapi = await loadFaceApi();
        if (faceapi) {
            const detection = await faceapi.detectSingleFace(canvas)
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (detection) {
                const descriptor = Array.from(detection.descriptor);
                setCaptured(imageData);
                stopCamera();
                setLoading(false);
                onCapture({ image: imageData, descriptor });
                return;
            } else {
                setError('No face detected. Please look at the camera and try again.');
                setLoading(false);
                return;
            }
        }

        // Fallback: just capture without face detection
        setCaptured(imageData);
        stopCamera();
        setLoading(false);
        onCapture({ image: imageData, descriptor: null });
    };

    const retake = () => {
        setCaptured(null);
        setError('');
        startCamera();
    };

    return (
        <div className="selfie-capture">
            <div className="selfie-preview">
                {!captured ? (
                    <>
                        <video ref={videoRef} autoPlay muted playsInline className="selfie-video" />
                        <div className="selfie-overlay">
                            <div className="selfie-circle" />
                        </div>
                    </>
                ) : (
                    <img src={captured} alt="Selfie" className="selfie-result" />
                )}
                <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>

            {error && (
                <div className="selfie-error">
                    <AlertTriangle size={16} /> {error}
                </div>
            )}

            <div className="selfie-actions">
                {!captured ? (
                    <>
                        <button className="btn btn-primary selfie-btn" onClick={capture} disabled={!streaming || loading}>
                            {loading ? <RefreshCw size={20} className="spin" /> : <Camera size={20} />}
                            {loading ? 'Detecting face...' : 'Take Selfie'}
                        </button>
                        <button className="btn btn-secondary" onClick={onSkip}>Skip</button>
                    </>
                ) : (
                    <>
                        <button className="btn btn-primary" onClick={() => { }}>
                            <Check size={18} /> Looks good!
                        </button>
                        <button className="btn btn-secondary" onClick={retake}>
                            <RefreshCw size={18} /> Retake
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

// Face verification for photo uploads
export async function verifyFaceInPhoto(photoElement, storedDescriptor) {
    if (!storedDescriptor || storedDescriptor.length === 0) return { verified: true, reason: 'No face data stored' };

    const faceapi = await loadFaceApi();
    if (!faceapi) return { verified: true, reason: 'Face API not available' };

    try {
        const detections = await faceapi.detectAllFaces(photoElement)
            .withFaceLandmarks()
            .withFaceDescriptors();

        if (detections.length === 0) {
            return { verified: true, reason: 'No faces in photo' };
        }

        const storedFloat = new Float32Array(storedDescriptor);

        for (const detection of detections) {
            const distance = faceapi.euclideanDistance(storedFloat, detection.descriptor);
            if (distance < 0.6) {
                return { verified: true, reason: 'Face match found' };
            }
        }

        return { verified: false, reason: 'Your face was not detected in this photo. You can only upload photos containing yourself.' };
    } catch (err) {
        console.error('Face verification error:', err);
        return { verified: true, reason: 'Verification error, allowing upload' };
    }
}

export default { SelfieCapture, verifyFaceInPhoto };
