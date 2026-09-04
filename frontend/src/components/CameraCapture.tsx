'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import {
  Camera,
  RefreshCw,
  X,
  Check,
  AlertCircle,
  FlipHorizontal,
  Sparkles,
} from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onCancel?: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  onCapture,
  onCancel,
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize or switch camera
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    setIsInitializing(true);
    setCameraError(null);

    const startCamera = async () => {
      // Stop any existing tracks
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera access is not supported by this browser.');
        }

        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        };

        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        activeStream = mediaStream;
        setStream(mediaStream);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err: any) {
        let msg = 'Unable to access camera. Please check browser permissions.';
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          msg = 'Camera permission was denied. Please allow camera permissions in your browser.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          msg = 'No camera device was detected on your system.';
        }
        setCameraError(msg);
      } finally {
        setIsInitializing(false);
      }
    };

    startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode]);

  // Capture current video frame to JPEG file
  const handleSnap = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw current frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `leaf_camera_${Date.now()}.jpg`, {
          type: 'image/jpeg',
        });
        setCapturedFile(file);
        setCapturedPreview(canvas.toDataURL('image/jpeg', 0.9));
      },
      'image/jpeg',
      0.9
    );
  };

  const handleRetake = () => {
    setCapturedPreview(null);
    setCapturedFile(null);
  };

  const handleConfirm = () => {
    if (capturedFile) {
      // Stop camera stream
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      onCapture(capturedFile);
    }
  };

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-forest-950 border border-emerald-500/20 shadow-2xl flex flex-col items-center">
      {/* Viewfinder Header */}
      <div className="w-full flex items-center justify-between p-3.5 bg-forest-900/80 border-b border-emerald-500/15 z-10">
        <div className="flex items-center gap-2">
          <Badge variant="sprout">
            <Camera className="w-3 h-3" />
            <span>Live Camera Scanner</span>
          </Badge>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Align leaf within guide marks
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!capturedPreview && (
            <button
              onClick={toggleCameraFacing}
              className="p-1.5 rounded-lg bg-forest-800 text-slate-300 hover:text-emerald-300 border border-emerald-500/20 transition text-xs flex items-center gap-1"
              title="Flip Camera"
            >
              <FlipHorizontal className="w-3.5 h-3.5" />
              <span className="text-[11px] hidden sm:inline">Flip</span>
            </button>
          )}
          {onCancel && (
            <button
              onClick={onCancel}
              className="p-1.5 rounded-lg bg-forest-800 text-slate-400 hover:text-rose-400 transition"
              title="Close Camera"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Video Viewport & Alignment Overlay */}
      <div className="relative w-full aspect-[4/3] max-h-[380px] bg-black flex items-center justify-center overflow-hidden">
        {isInitializing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-forest-950/90 z-20 space-y-2">
            <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin" />
            <span className="text-xs text-slate-300">Initializing camera feed...</span>
          </div>
        )}

        {cameraError ? (
          <div className="p-6 text-center max-w-sm space-y-3 z-20">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
            <p className="text-xs text-rose-200 leading-relaxed">{cameraError}</p>
            <Button variant="outline" size="sm" onClick={() => setFacingMode((prev) => prev)}>
              Retry Camera
            </Button>
          </div>
        ) : capturedPreview ? (
          /* Snapshot Preview */
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            <img
              src={capturedPreview}
              alt="Captured leaf snapshot"
              className="w-full h-full object-contain"
            />
            <div className="absolute top-3 left-3">
              <Badge variant="healthy">Snapshot Captured</Badge>
            </div>
          </div>
        ) : (
          /* Active Camera Video */
          <div className="relative w-full h-full flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* High-Tech Leaf Alignment Reticle Overlay */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              {/* Corner Framing Brackets */}
              <div className="w-64 h-64 border-2 border-emerald-400/40 rounded-3xl relative flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                {/* Top-Left Reticle */}
                <div className="absolute -top-1 -left-1 w-5 h-5 border-t-2 border-l-2 border-sprout-400" />
                {/* Top-Right Reticle */}
                <div className="absolute -top-1 -right-1 w-5 h-5 border-t-2 border-r-2 border-sprout-400" />
                {/* Bottom-Left Reticle */}
                <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-2 border-l-2 border-sprout-400" />
                {/* Bottom-Right Reticle */}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-2 border-r-2 border-sprout-400" />

                {/* Leaf Guide Silhouette SVG */}
                <svg
                  className="w-32 h-32 text-emerald-400/30 animate-pulse-slow"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                >
                  <path
                    d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"
                    strokeDasharray="4 2"
                  />
                  <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                </svg>

                <div className="absolute bottom-3 text-[10px] text-emerald-300 font-semibold bg-forest-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  Align diseased leaf here
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hidden Canvas for Frame Capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Camera Action Controls Footer */}
      <div className="w-full p-4 bg-forest-900/80 border-t border-emerald-500/15 flex items-center justify-center gap-4">
        {capturedPreview ? (
          <>
            <Button variant="outline" size="md" onClick={handleRetake} leftIcon={<RefreshCw className="w-4 h-4" />}>
              Retake
            </Button>
            <Button variant="primary" size="md" onClick={handleConfirm} leftIcon={<Check className="w-4 h-4" />}>
              Analyze Photo
            </Button>
          </>
        ) : (
          <Button
            variant="primary"
            size="lg"
            disabled={isInitializing || !!cameraError}
            onClick={handleSnap}
            leftIcon={<Camera className="w-5 h-5" />}
            className="!rounded-full px-8 shadow-glow-sprout"
          >
            Capture Leaf Photo
          </Button>
        )}
      </div>
    </div>
  );
};
