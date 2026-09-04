'use client';

import React, { useState, useRef } from 'react';
import { CameraCapture } from './CameraCapture';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import {
  UploadCloud,
  Camera,
  Image as ImageIcon,
  AlertTriangle,
  Sparkles,
  RotateCcw,
} from 'lucide-react';

interface LeafScannerProps {
  onImageReady: (file: File) => void;
  isAnalyzing?: boolean;
  selectedFile?: File | null;
  onClear?: () => void;
}

export const LeafScanner: React.FC<LeafScannerProps> = ({
  onImageReady,
  isAnalyzing = false,
  selectedFile = null,
  onClear,
}) => {
  const [activeMode, setActiveMode] = useState<'upload' | 'camera'>('upload');
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    selectedFile ? URL.createObjectURL(selectedFile) : null
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate and emit file
  const processFile = (file: File) => {
    setValidationError(null);

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setValidationError('Please upload a valid image file (JPEG, PNG, or WebP).');
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setValidationError('Image size exceeds 10MB. Please choose a smaller photo.');
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));
    onImageReady(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleCameraCapture = (file: File) => {
    processFile(file);
    setActiveMode('upload'); // Switch back to preview container
  };

  const handleReset = () => {
    setPreviewUrl(null);
    setValidationError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClear?.();
  };

  return (
    <div className="w-full space-y-4">
      {/* Mode Switcher Tabs */}
      <div className="flex items-center justify-center">
        <div className="flex p-1 rounded-2xl bg-forest-900/80 border border-emerald-500/15 backdrop-blur-md">
          <button
            onClick={() => {
              setActiveMode('upload');
            }}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold transition ${
              activeMode === 'upload'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Photo</span>
          </button>
          <button
            onClick={() => {
              setActiveMode('camera');
            }}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold transition ${
              activeMode === 'camera'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Live Camera Scanner</span>
          </button>
        </div>
      </div>

      {/* Camera Mode */}
      {activeMode === 'camera' && (
        <div className="animate-fade-in">
          <CameraCapture
            onCapture={handleCameraCapture}
            onCancel={() => setActiveMode('upload')}
          />
        </div>
      )}

      {/* Upload & Preview Mode */}
      {activeMode === 'upload' && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center min-h-[340px] rounded-2xl p-6 transition-all duration-200 border-2 border-dashed ${
            isDragOver
              ? 'border-sprout-400 bg-forest-900/90 shadow-glow-sprout'
              : 'border-emerald-500/20 hover:border-emerald-400/40 bg-forest-950/60'
          }`}
        >
          {previewUrl ? (
            /* Selected Image Preview with Laser Overlay */
            <div className="flex flex-col items-center w-full space-y-4">
              <div className="relative rounded-xl overflow-hidden border border-emerald-500/30 max-h-72 shadow-2xl bg-black">
                <img
                  src={previewUrl}
                  alt="Target leaf preview"
                  className="max-h-72 object-contain"
                />

                {/* Animated Laser Scan Bar */}
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-forest-950/60 backdrop-blur-[1px] flex flex-col items-center justify-center">
                    <div className="w-full h-1 scanner-laser absolute top-0 animate-scan" />
                    <div className="px-3 py-1 rounded-full bg-forest-900/90 border border-emerald-400/40 text-emerald-300 text-xs font-bold shadow-glow-emerald">
                      🔍 Quantized ONNX Inference Active...
                    </div>
                  </div>
                )}
              </div>

              {!isAnalyzing && (
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Select Different Photo
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                    leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                  >
                    Clear
                  </Button>
                </div>
              )}
            </div>
          ) : (
            /* Empty Dropzone State */
            <div className="flex flex-col items-center justify-center text-center p-8 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-3xl text-emerald-400 shadow-glow-emerald">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-200">
                  Drag & Drop Plant Leaf Photo
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Or click below to browse JPEG, PNG, or WebP images up to 10MB
                </p>
              </div>
              <Button
                variant="primary"
                onClick={() => fileInputRef.current?.click()}
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                Choose Local File
              </Button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/jpg"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}

      {/* Validation Error Banner */}
      {validationError && (
        <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}
    </div>
  );
};
