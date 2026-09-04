'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import {
  Flame,
  Maximize2,
  Minimize2,
  Sliders,
  Columns,
  SplitSquareVertical,
  Info,
} from 'lucide-react';

interface HeatmapViewerProps {
  originalImageUrl: string;
  heatmapBase64?: string;
  diseaseName: string;
}

export const HeatmapViewer: React.FC<HeatmapViewerProps> = ({
  originalImageUrl,
  heatmapBase64,
  diseaseName,
}) => {
  const [viewMode, setViewMode] = useState<'split' | 'side' | 'opacity'>('split');
  const [sliderPosition, setSliderPosition] = useState<number>(50); // 0 to 100%
  const [opacity, setOpacity] = useState<number>(65); // 0 to 100%
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Handle slider drag (mouse + touch)
  const handleMove = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSliderPosition(percentage);
    },
    []
  );

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) handleMove(e.clientX);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches[0]) handleMove(e.touches[0].clientX);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMove]);

  if (!heatmapBase64) {
    return (
      <div className="p-6 text-center text-xs text-slate-400">
        Grad-CAM visual heatmap not available for this scan.
      </div>
    );
  }

  return (
    <div
      className={`relative w-full rounded-2xl bg-forest-950 border border-emerald-500/20 overflow-hidden ${
        isFullscreen
          ? 'fixed inset-4 z-50 flex flex-col justify-between shadow-2xl bg-forest-950/98 backdrop-blur-2xl'
          : ''
      }`}
    >
      {/* Viewer Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between p-4 bg-forest-900/80 border-b border-emerald-500/15 gap-3">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-slate-200">
            Explainable AI (Grad-CAM) Visual Heatmap
          </span>
          <Badge variant="sprout" className="hidden sm:inline-flex">
            XAI Feature Activation
          </Badge>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex p-1 rounded-xl bg-forest-950 border border-emerald-500/15 text-xs">
            <button
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition ${
                viewMode === 'split'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <SplitSquareVertical className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Split Slider</span>
            </button>
            <button
              onClick={() => setViewMode('side')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition ${
                viewMode === 'side'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Side-by-Side</span>
            </button>
            <button
              onClick={() => setViewMode('opacity')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition ${
                viewMode === 'opacity'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Opacity Blend</span>
            </button>
          </div>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-xl bg-forest-800 text-slate-400 hover:text-emerald-300 border border-emerald-500/15 transition"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Viewport */}
      <div className="p-4 sm:p-6 flex flex-col items-center justify-center">
        {/* 1. Split Slider Mode */}
        {viewMode === 'split' && (
          <div className="w-full max-w-xl flex flex-col items-center">
            <div
              ref={containerRef}
              onMouseDown={handleMouseDown}
              onTouchStart={handleMouseDown}
              className="relative w-full aspect-square max-h-[440px] rounded-2xl overflow-hidden border border-emerald-500/30 shadow-2xl select-none cursor-ew-resize bg-black"
            >
              {/* Bottom Image: Original Leaf */}
              <img
                src={originalImageUrl}
                alt="Original leaf"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              />

              {/* Top Image: Grad-CAM Heatmap with Dynamic Clip-Path */}
              <div
                className="absolute inset-0 overflow-hidden pointer-events-none"
                style={{
                  clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
                }}
              >
                <img
                  src={heatmapBase64}
                  alt="Grad-CAM Heatmap overlay"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                />
              </div>

              {/* Slider Divider Handle Line */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-sprout-400 shadow-[0_0_12px_rgba(74,222,128,0.8)] pointer-events-none"
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-forest-900 border-2 border-sprout-400 flex items-center justify-center shadow-glow-sprout">
                  <SplitSquareVertical className="w-4 h-4 text-sprout-400" />
                </div>
              </div>

              {/* Labels on sides */}
              <div className="absolute top-3 left-3 pointer-events-none">
                <span className="px-2.5 py-1 rounded-lg bg-forest-950/80 border border-emerald-500/20 text-[10px] font-bold text-emerald-300">
                  Grad-CAM Heatmap
                </span>
              </div>
              <div className="absolute top-3 right-3 pointer-events-none">
                <span className="px-2.5 py-1 rounded-lg bg-forest-950/80 border border-emerald-500/20 text-[10px] font-bold text-slate-300">
                  Original Photo
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 mt-3 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-emerald-400" />
              <span>Drag the center line left or right to compare diseased spots</span>
            </p>
          </div>
        )}

        {/* 2. Side-by-Side Mode */}
        {viewMode === 'side' && (
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 items-center max-w-4xl">
            <div className="flex flex-col items-center">
              <span className="text-xs font-semibold text-slate-300 mb-2">Original Uploaded Leaf</span>
              <div className="rounded-xl overflow-hidden border border-emerald-500/20 bg-black max-h-[380px] shadow-lg">
                <img
                  src={originalImageUrl}
                  alt="Original leaf"
                  className="max-h-[380px] object-contain"
                />
              </div>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs font-semibold text-amber-400 mb-2">
                Grad-CAM Activation Heatmap
              </span>
              <div className="rounded-xl overflow-hidden border border-amber-500/30 bg-black max-h-[380px] shadow-glow-emerald">
                <img
                  src={heatmapBase64}
                  alt="Grad-CAM Disease Heatmap"
                  className="max-h-[380px] object-contain"
                />
              </div>
            </div>
          </div>
        )}

        {/* 3. Opacity Blend Mode */}
        {viewMode === 'opacity' && (
          <div className="w-full max-w-xl flex flex-col items-center space-y-4">
            <div className="relative w-full aspect-square max-h-[400px] rounded-2xl overflow-hidden border border-emerald-500/30 shadow-2xl bg-black">
              {/* Bottom Image: Original */}
              <img
                src={originalImageUrl}
                alt="Original leaf"
                className="absolute inset-0 w-full h-full object-contain"
              />
              {/* Top Image: Heatmap with Dynamic Opacity */}
              <img
                src={heatmapBase64}
                alt="Grad-CAM Heatmap overlay"
                className="absolute inset-0 w-full h-full object-contain transition-opacity duration-75"
                style={{ opacity: opacity / 100 }}
              />
            </div>

            {/* Opacity Range Slider */}
            <div className="w-full max-w-sm flex items-center gap-3">
              <span className="text-xs text-slate-400 font-medium">Heatmap Alpha:</span>
              <input
                type="range"
                min="0"
                max="100"
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="flex-1 accent-emerald-400 cursor-pointer"
              />
              <span className="text-xs font-mono font-bold text-emerald-300 w-9 text-right">
                {opacity}%
              </span>
            </div>
          </div>
        )}

        {/* Heatmap Colormap Activation Legend */}
        <div className="w-full max-w-md mt-6 pt-4 border-t border-emerald-500/15 flex flex-col items-center space-y-2">
          <div className="flex items-center justify-between w-full text-[10px] font-bold text-slate-400">
            <span>0.0 Normal Tissue (Blue)</span>
            <span>0.5 Moderate Activation</span>
            <span className="text-rose-400">1.0 Primary Infection Lesion (Red)</span>
          </div>
          {/* Colormap bar gradient */}
          <div className="w-full h-2 rounded-full bg-gradient-to-r from-blue-600 via-emerald-400 via-amber-400 to-red-600 shadow-sm" />
          <p className="text-[10px] text-slate-500 text-center">
            Neural network gradient activations highlight the exact botanical features driving the AI diagnosis.
          </p>
        </div>
      </div>
    </div>
  );
};
