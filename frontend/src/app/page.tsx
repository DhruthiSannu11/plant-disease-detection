'use client';

import React, { useState, useEffect, useRef } from 'react';

interface DiagnosticDetails {
  common_name: string;
  scientific_name: string;
  crop: string;
  pathogen_type: string;
  severity: string;
  symptoms: string[];
  organic_remedies: string[];
  chemical_treatments: string[];
  preventive_protocols: string[];
}

interface ClassPrediction {
  class_id: number;
  disease_name: string;
  confidence: number;
  details?: DiagnosticDetails;
}

interface PredictionResponse {
  success: boolean;
  prediction: ClassPrediction;
  top_k: ClassPrediction[];
  inference_time_ms: number;
  heatmap_base64?: string;
  timestamp: string;
}

export default function Home() {
  const [apiStatus, setApiStatus] = useState<string>('Checking...');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'remedies' | 'chemical' | 'symptoms' | 'prevention'>('remedies');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('http://localhost:8000/api/v1/health')
      .then((res) => res.json())
      .then((data) => {
        setApiStatus(data.status === 'healthy' ? 'Online 🟢' : 'Degraded 🟡');
      })
      .catch(() => {
        setApiStatus('Connecting... ⏳');
      });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setErrorMessage(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setErrorMessage(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('http://localhost:8000/api/v1/predict', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Analysis request failed.');
      }

      setResult(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error connecting to backend API.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8 bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="w-full max-w-6xl flex justify-between items-center py-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <span className="text-3xl">🌿</span>
          <div>
            <h1 className="text-xl font-bold text-emerald-400">Plant Health AI</h1>
            <p className="text-xs text-slate-400">Botanical Diagnostic & Grad-CAM Heatmap Platform</p>
          </div>
        </div>
        <div className="flex items-center space-x-3 text-xs bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full">
          <span className="text-slate-400">Backend API:</span>
          <span className="font-semibold text-emerald-400">{apiStatus}</span>
        </div>
      </header>

      {/* Hero Section */}
      <div className="w-full max-w-5xl my-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
            Leaf Disease Scanner & <span className="text-emerald-400">Botanical Guide</span>
          </h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Upload any plant leaf photo to receive real-time ONNX predictions, Grad-CAM visual heatmaps, and biological treatment plans.
          </p>
        </div>

        {/* Upload & Preview Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/60 border border-slate-800 p-6 rounded-2xl shadow-xl backdrop-blur-md">
          {/* Upload Zone */}
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-emerald-500/50 bg-slate-950/50 rounded-xl p-6 transition-colors">
            {previewUrl ? (
              <div className="flex flex-col items-center space-y-4 w-full">
                <img
                  src={previewUrl}
                  alt="Uploaded leaf preview"
                  className="max-h-64 object-contain rounded-lg border border-slate-700 shadow-md"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-slate-400 hover:text-emerald-400 underline"
                >
                  Choose a different photo
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-3 text-center py-8">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center text-2xl text-emerald-400">
                  📷
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">
                    Upload Plant Leaf Image
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Supports JPG, PNG, WebP up to 10MB
                  </p>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md transition"
                >
                  Select File
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Analyze Control & Status */}
          <div className="flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-200 mb-2">Diagnostic Control</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Click <strong>Analyze Leaf</strong> to execute PyTorch/ONNX INT8 quantized model inference and generate XAI Grad-CAM visual heatmaps.
              </p>
            </div>

            {errorMessage && (
              <div className="p-4 bg-red-950/80 border border-red-800/80 rounded-xl text-red-200 text-xs leading-relaxed">
                {errorMessage}
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={!selectedFile || loading}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-all shadow-lg flex items-center justify-center space-x-2 ${
                !selectedFile || loading
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50'
              }`}
            >
              {loading ? (
                <>
                  <span className="animate-spin text-base">⚙️</span>
                  <span>Running ONNX Inference...</span>
                </>
              ) : (
                <>
                  <span>🔍</span>
                  <span>Analyze Leaf & Get Treatments</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Diagnostic Results Section */}
        {result && (
          <div className="mt-8 space-y-6 animate-fade-in">
            {/* Main Diagnosis Summary Header */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full">
                    {result.prediction.details?.crop || 'Crop'}
                  </span>
                  <span className="px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold rounded-full">
                    {result.prediction.details?.pathogen_type || 'Disease'}
                  </span>
                  <span className="px-2.5 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold rounded-full">
                    Severity: {result.prediction.details?.severity || 'Moderate'}
                  </span>
                </div>

                <h3 className="text-2xl font-black text-slate-100 mt-2">
                  {result.prediction.details?.common_name || result.prediction.disease_name}
                </h3>
                <p className="text-xs text-slate-400 italic">
                  Scientific Name: {result.prediction.details?.scientific_name}
                </p>
              </div>

              {/* Confidence Gauge */}
              <div className="bg-slate-950 border border-slate-800 px-5 py-3 rounded-xl text-right w-full md:w-auto">
                <div className="text-xs text-slate-400">Confidence Score</div>
                <div className="text-3xl font-extrabold text-emerald-400">
                  {(result.prediction.confidence * 100).toFixed(1)}%
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Latency: {result.inference_time_ms} ms
                </div>
              </div>
            </div>

            {/* Grad-CAM Heatmap & Visual Overlay */}
            {result.heatmap_base64 && (
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
                <h4 className="text-sm font-bold text-slate-200 mb-4 flex items-center space-x-2">
                  <span>🔥</span>
                  <span>Explainable AI (XAI) Grad-CAM Visual Heatmap</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  <div className="text-center">
                    <p className="text-xs text-slate-400 mb-2">Original Uploaded Photo</p>
                    {previewUrl && (
                      <img
                        src={previewUrl}
                        alt="Original leaf"
                        className="max-h-56 mx-auto rounded-lg border border-slate-800"
                      />
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-emerald-400 font-semibold mb-2">Grad-CAM Disease Heatmap Overlay</p>
                    <img
                      src={result.heatmap_base64}
                      alt="Grad-CAM Heatmap"
                      className="max-h-56 mx-auto rounded-lg border border-emerald-500/40 shadow-lg"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Diagnostic Botanical Guide Tabs */}
            {result.prediction.details && (
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
                {/* Tab Navigation */}
                <div className="flex border-b border-slate-800 mb-6 space-x-2 overflow-x-auto">
                  <button
                    onClick={() => setActiveTab('remedies')}
                    className={`pb-3 px-4 text-xs font-bold border-b-2 transition ${
                      activeTab === 'remedies'
                        ? 'border-emerald-400 text-emerald-400'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    🌱 Organic Remedies
                  </button>
                  <button
                    onClick={() => setActiveTab('chemical')}
                    className={`pb-3 px-4 text-xs font-bold border-b-2 transition ${
                      activeTab === 'chemical'
                        ? 'border-emerald-400 text-emerald-400'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    🧪 Chemical Treatments
                  </button>
                  <button
                    onClick={() => setActiveTab('symptoms')}
                    className={`pb-3 px-4 text-xs font-bold border-b-2 transition ${
                      activeTab === 'symptoms'
                        ? 'border-emerald-400 text-emerald-400'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    🔍 Key Symptoms
                  </button>
                  <button
                    onClick={() => setActiveTab('prevention')}
                    className={`pb-3 px-4 text-xs font-bold border-b-2 transition ${
                      activeTab === 'prevention'
                        ? 'border-emerald-400 text-emerald-400'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    🛡️ Preventive Protocols
                  </button>
                </div>

                {/* Tab Contents */}
                <div className="space-y-3">
                  {activeTab === 'remedies' && (
                    <ul className="space-y-2">
                      {result.prediction.details.organic_remedies.map((item, idx) => (
                        <li key={idx} className="flex items-start space-x-3 text-xs text-slate-300 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                          <span className="text-emerald-400 font-bold">✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {activeTab === 'chemical' && (
                    <ul className="space-y-2">
                      {result.prediction.details.chemical_treatments.map((item, idx) => (
                        <li key={idx} className="flex items-start space-x-3 text-xs text-slate-300 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                          <span className="text-amber-400 font-bold">⚡</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {activeTab === 'symptoms' && (
                    <ul className="space-y-2">
                      {result.prediction.details.symptoms.map((item, idx) => (
                        <li key={idx} className="flex items-start space-x-3 text-xs text-slate-300 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                          <span className="text-sky-400 font-bold">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {activeTab === 'prevention' && (
                    <ul className="space-y-2">
                      {result.prediction.details.preventive_protocols.map((item, idx) => (
                        <li key={idx} className="flex items-start space-x-3 text-xs text-slate-300 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                          <span className="text-teal-400 font-bold">🛡️</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="w-full max-w-6xl text-center py-4 border-t border-slate-900 text-xs text-slate-500">
        Enterprise SDLC Edition • PyTorch & ONNX INT8 Engine
      </footer>
    </main>
  );
}
