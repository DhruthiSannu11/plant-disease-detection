'use client';

import React, { useState, useEffect } from 'react';

export default function Home() {
  const [apiStatus, setApiStatus] = useState<string>('Checking...');
  const [environment, setEnvironment] = useState<string>('Development');

  useEffect(() => {
    fetch('http://localhost:8000/api/v1/health')
      .then((res) => res.json())
      .then((data) => {
        setApiStatus(data.status === 'healthy' ? 'Online 🟢' : 'Degraded 🟡');
        setEnvironment(data.environment || 'Development');
      })
      .catch(() => {
        setApiStatus('Connecting... ⏳');
      });
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-6 md:p-12 bg-slate-950 text-slate-100">
      {/* Header Bar */}
      <header className="w-full max-w-6xl flex justify-between items-center py-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <span className="text-3xl">🌿</span>
          <div>
            <h1 className="text-xl font-bold text-emerald-400">Plant Health AI</h1>
            <p className="text-xs text-slate-400">Explainable AI Botanical Diagnostic Platform</p>
          </div>
        </div>
        <div className="flex items-center space-x-3 text-xs bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full">
          <span className="text-slate-400">Backend API:</span>
          <span className="font-semibold text-emerald-400">{apiStatus}</span>
        </div>
      </header>

      {/* Main Hero Card */}
      <div className="w-full max-w-4xl my-auto text-center py-12">
        <div className="inline-block mb-4 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-semibold">
          2026 Enterprise SDLC Edition • PyTorch & ONNX INT8 Engine
        </div>
        
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
          Instant Crop Disease Diagnostics & <br />
          <span className="bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
            Explainable AI Heatmaps
          </span>
        </h2>
        
        <p className="text-slate-400 max-w-2xl mx-auto mb-8 text-sm md:text-base leading-relaxed">
          Upload a leaf image or stream live video to identify 38+ plant diseases, view Grad-CAM visual heatmaps highlighting affected spots, and receive biological and chemical remedy plans.
        </p>

        {/* Upload Dropzone Preview */}
        <div className="border-2 border-dashed border-slate-800 hover:border-emerald-500/50 transition-colors duration-200 bg-slate-900/50 rounded-2xl p-8 max-w-xl mx-auto cursor-pointer shadow-2xl">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-2xl text-emerald-400">
              📷
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">
                Drag & Drop leaf photo or click to scan
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Supports JPG, PNG, WebP up to 10MB
              </p>
            </div>
            <button className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition-all duration-200 shadow-lg shadow-emerald-900/20">
              Select Image File
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full max-w-6xl text-center py-4 border-t border-slate-900 text-xs text-slate-500">
        100% Free Open-Source Architecture • Environment: {environment} • Multi-Container Docker Stack
      </footer>
    </main>
  );
}
