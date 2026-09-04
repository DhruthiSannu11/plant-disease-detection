'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LeafScanner } from '../components/LeafScanner';
import { DiagnosticReport } from '../components/DiagnosticReport';
import {
  Sparkles,
  AlertTriangle,
  Sprout,
  Activity,
  MapPin,
  ExternalLink,
} from 'lucide-react';

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

interface OutbreakStats {
  total_outbreaks: number;
  total_crops_affected: number;
  total_diseases_detected: number;
  severity_breakdown: Record<string, number>;
  top_affected_crops: Array<{ crop: string; count: number }>;
  top_detected_diseases: Array<{ disease_name: string; count: number }>;
}

export default function Home() {
  const [currentTab, setCurrentTab] = useState<string>('scanner');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Outbreak stats
  const [outbreakStats, setOutbreakStats] = useState<OutbreakStats | null>(null);
  const [statsLoading, setStatsLoading] = useState<boolean>(false);

  // Fetch outbreak stats when switched to outbreak tab
  useEffect(() => {
    if (currentTab === 'outbreaks') {
      setStatsLoading(true);
      fetch('http://localhost:8000/api/v1/outbreaks/stats')
        .then((res) => res.json())
        .then((data) => setOutbreakStats(data))
        .catch(() => setOutbreakStats(null))
        .finally(() => setStatsLoading(false));
    }
  }, [currentTab]);

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
    <>
      <Navbar activeTab={currentTab} onTabChange={setCurrentTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Platform Banner */}
        <section className="mb-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <GlassCard className="!p-4 border-emerald-500/20 text-center flex flex-col items-center justify-center">
              <span className="text-2xl font-extrabold text-emerald-400">99.77%</span>
              <span className="text-[11px] text-slate-400 mt-0.5">Validation Accuracy</span>
            </GlassCard>
            <GlassCard className="!p-4 border-emerald-500/20 text-center flex flex-col items-center justify-center">
              <span className="text-2xl font-extrabold text-sprout-400">&lt; 50 ms</span>
              <span className="text-[11px] text-slate-400 mt-0.5">CPU Latency (ONNX INT8)</span>
            </GlassCard>
            <GlassCard className="!p-4 border-emerald-500/20 text-center flex flex-col items-center justify-center">
              <span className="text-2xl font-extrabold text-leaf-400">38 Classes</span>
              <span className="text-[11px] text-slate-400 mt-0.5">Botanical Diseases</span>
            </GlassCard>
            <GlassCard className="!p-4 border-emerald-500/20 text-center flex flex-col items-center justify-center">
              <span className="text-2xl font-extrabold text-amber-400">Grad-CAM</span>
              <span className="text-[11px] text-slate-400 mt-0.5">Explainable AI (XAI)</span>
            </GlassCard>
          </div>
        </section>

        {/* TAB 1: Leaf Scanner View */}
        {currentTab === 'scanner' && (
          <section className="space-y-8 animate-fade-in">
            <div className="text-center max-w-3xl mx-auto mb-8">
              <Badge variant="sprout" className="mb-3">
                <Sparkles className="w-3 h-3" />
                <span>Next-Gen Computer Vision Diagnostics</span>
              </Badge>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-100">
                AI Leaf Scanner &{' '}
                <span className="bg-gradient-to-r from-emerald-400 via-sprout-400 to-leaf-300 bg-clip-text text-transparent">
                  Botanical Cure Guide
                </span>
              </h1>
              <p className="mt-3 text-slate-400 text-sm md:text-base leading-relaxed">
                Upload or capture any crop leaf photo. Our INT8 quantized neural network analyzes necrotic
                spots, highlights infected tissue with Grad-CAM, and prepares organic and chemical remedies.
              </p>
            </div>

            {/* Upload & Scanner Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Modular Leaf Scanner */}
              <GlassCard className="p-4 sm:p-6 border-emerald-500/20 flex flex-col items-center justify-center">
                <LeafScanner
                  onImageReady={(file) => {
                    setSelectedFile(file);
                    setPreviewUrl(URL.createObjectURL(file));
                    setResult(null);
                    setErrorMessage(null);
                  }}
                  isAnalyzing={loading}
                  selectedFile={selectedFile}
                  onClear={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                    setResult(null);
                    setErrorMessage(null);
                  }}
                />
              </GlassCard>

              {/* Action & Status Card */}
              <GlassCard className="flex flex-col justify-between space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                    <Sprout className="w-5 h-5 text-emerald-400" />
                    <span>Diagnostics Control Panel</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Our model inspects 38 disease categories (Apple Scab, Black Rot, Cedar Rust,
                    Tomato Late Blight, Corn Common Rust, and more) with automated non-plant guardrails.
                  </p>

                  <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-forest-900/60 border border-emerald-500/10">
                      <span className="text-slate-400">Target Image Format:</span>
                      <span className="font-semibold text-emerald-300">224x224 RGB Normalized</span>
                    </div>
                    <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-forest-900/60 border border-emerald-500/10">
                      <span className="text-slate-400">Explainability Engine:</span>
                      <span className="font-semibold text-emerald-300">PyTorch Grad-CAM Hook</span>
                    </div>
                    <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-forest-900/60 border border-emerald-500/10">
                      <span className="text-slate-400">Model Quantization:</span>
                      <span className="font-semibold text-emerald-300">INT8 Dynamic CPU</span>
                    </div>
                  </div>
                </div>

                {errorMessage && (
                  <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
                    <div>{errorMessage}</div>
                  </div>
                )}

                <Button
                  variant="primary"
                  size="lg"
                  disabled={!selectedFile || loading}
                  isLoading={loading}
                  onClick={handleAnalyze}
                  className="w-full"
                >
                  Analyze Leaf & Generate Heatmap
                </Button>
              </GlassCard>
            </div>

            {/* Diagnostic Results Dashboard with Grad-CAM Heatmap Viewer & Botanical Cures */}
            {result && previewUrl && (
              <div className="mt-12">
                <DiagnosticReport
                  result={result}
                  originalImageUrl={previewUrl}
                  onScanAnother={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                    setResult(null);
                    setErrorMessage(null);
                  }}
                  onSaveScan={async () => {
                    try {
                      const res = await fetch('http://localhost:8000/api/v1/scans', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          crop: result.prediction.details?.crop || 'Unknown',
                          disease_name: result.prediction.disease_name,
                          common_name: result.prediction.details?.common_name,
                          scientific_name: result.prediction.details?.scientific_name,
                          confidence: result.prediction.confidence,
                          severity: result.prediction.details?.severity || 'Moderate',
                          notes: `Diagnostic scan generated by LeafScanner UI with ${(result.prediction.confidence * 100).toFixed(1)}% confidence`,
                        }),
                      });
                      return res.ok;
                    } catch {
                      return false;
                    }
                  }}
                />
              </div>
            )}
          </section>
        )}

        {/* TAB 2: Outbreak Surveillance View */}
        {currentTab === 'outbreaks' && (
          <section className="space-y-8 animate-fade-in">
            <div className="text-center max-w-3xl mx-auto mb-8">
              <Badge variant="sprout" className="mb-3">
                <MapPin className="w-3 h-3" />
                <span>RFC 7946 GeoJSON Surveillance Engine</span>
              </Badge>
              <h2 className="text-3xl md:text-4xl font-black text-slate-100">
                Crop Outbreak Surveillance &{' '}
                <span className="bg-gradient-to-r from-emerald-400 to-amber-400 bg-clip-text text-transparent">
                  Epidemic Intelligence
                </span>
              </h2>
              <p className="mt-3 text-slate-400 text-sm">
                Aggregates leaf scans with geospatial coordinates to identify high-density crop disease
                clusters and assist farm extension agents.
              </p>
            </div>

            {/* Outbreak Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <GlassCard>
                <div className="text-xs text-slate-400 uppercase font-bold">Total Reported Outbreaks</div>
                <div className="text-3xl font-black text-emerald-400 mt-2">
                  {statsLoading ? '...' : outbreakStats?.total_outbreaks ?? 0}
                </div>
                <p className="text-xs text-slate-500 mt-1">Logged geolocation coordinates</p>
              </GlassCard>
              <GlassCard>
                <div className="text-xs text-slate-400 uppercase font-bold">Affected Crops</div>
                <div className="text-3xl font-black text-sprout-400 mt-2">
                  {statsLoading ? '...' : outbreakStats?.total_crops_affected ?? 0}
                </div>
                <p className="text-xs text-slate-500 mt-1">Distinct crop varieties</p>
              </GlassCard>
              <GlassCard>
                <div className="text-xs text-slate-400 uppercase font-bold">Active Pathogens</div>
                <div className="text-3xl font-black text-amber-400 mt-2">
                  {statsLoading ? '...' : outbreakStats?.total_diseases_detected ?? 0}
                </div>
                <p className="text-xs text-slate-500 mt-1">Classified disease varieties</p>
              </GlassCard>
            </div>

            {/* Outbreak API Endpoints Card */}
            <GlassCard>
              <h3 className="text-base font-bold text-slate-200 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-400" />
                <span>Geospatial Data Feeds</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                Direct GeoJSON feeds are accessible for GIS visualization software, Leaflet, and Mapbox:
              </p>

              <div className="space-y-3">
                <a
                  href="http://localhost:8000/api/v1/outbreaks/geojson"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-forest-900/60 hover:bg-forest-800/60 border border-emerald-500/15 transition text-xs"
                >
                  <span className="font-mono text-emerald-300">GET /api/v1/outbreaks/geojson</span>
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                </a>
                <a
                  href="http://localhost:8000/api/v1/outbreaks/stats"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-forest-900/60 hover:bg-forest-800/60 border border-emerald-500/15 transition text-xs"
                >
                  <span className="font-mono text-emerald-300">GET /api/v1/outbreaks/stats</span>
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                </a>
                <a
                  href="http://localhost:8000/api/v1/outbreaks/clusters"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-forest-900/60 hover:bg-forest-800/60 border border-emerald-500/15 transition text-xs"
                >
                  <span className="font-mono text-emerald-300">GET /api/v1/outbreaks/clusters</span>
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                </a>
              </div>
            </GlassCard>
          </section>
        )}

        {/* TAB 3: History View */}
        {currentTab === 'history' && (
          <section className="space-y-8 animate-fade-in text-center py-12">
            <GlassCard className="max-w-xl mx-auto py-12">
              <Activity className="w-12 h-12 text-emerald-400 mx-auto mb-4 animate-bounce" />
              <h3 className="text-xl font-bold text-slate-200">Personal Scan History</h3>
              <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto">
                Scan history is synchronized with the FastAPI database. Sign in or connect your JWT account
                to review past leaf diagnoses and treatment progression.
              </p>
              <div className="mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentTab('scanner')}
                >
                  Start New Leaf Scan
                </Button>
              </div>
            </GlassCard>
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}
