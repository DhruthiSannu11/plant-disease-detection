'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Badge, BadgeVariant } from '../components/ui/Badge';
import {
  Sparkles,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Sprout,
  Activity,
  MapPin,
  RefreshCw,
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
  const [activeRemedyTab, setActiveRemedyTab] = useState<
    'remedies' | 'chemical' | 'symptoms' | 'prevention'
  >('remedies');

  // Outbreak stats
  const [outbreakStats, setOutbreakStats] = useState<OutbreakStats | null>(null);
  const [statsLoading, setStatsLoading] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const mapSeverityToBadge = (severity?: string): BadgeVariant => {
    if (!severity) return 'moderate';
    const s = severity.toLowerCase();
    if (s === 'low') return 'low';
    if (s === 'high') return 'high';
    if (s === 'severe') return 'severe';
    if (s === 'critical') return 'critical';
    if (s === 'healthy') return 'healthy';
    return 'moderate';
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
              {/* Dropzone */}
              <GlassCard
                hoverEffect
                className="flex flex-col items-center justify-center min-h-[340px] border-dashed border-2 border-emerald-500/20 hover:border-emerald-400/50 relative overflow-hidden"
              >
                {previewUrl ? (
                  <div className="flex flex-col items-center w-full space-y-4">
                    <div className="relative rounded-xl overflow-hidden border border-emerald-500/30 max-h-72 shadow-lg">
                      <img
                        src={previewUrl}
                        alt="Uploaded leaf preview"
                        className="max-h-72 object-contain"
                      />
                      {loading && (
                        <div className="absolute inset-0 bg-forest-950/70 backdrop-blur-sm flex flex-col items-center justify-center">
                          <div className="w-full h-1 scanner-laser absolute top-0 animate-scan" />
                          <div className="text-emerald-300 text-xs font-bold tracking-wide mt-2">
                            Analyzing Leaf Features...
                          </div>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Choose a different photo
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-8 space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-3xl text-emerald-400 shadow-glow-emerald">
                      <UploadCloud className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-200">
                        Upload Plant Leaf Photo
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 max-w-xs">
                        Supports high-resolution JPEG, PNG, or WebP files up to 10MB
                      </p>
                    </div>
                    <Button
                      variant="primary"
                      onClick={() => fileInputRef.current?.click()}
                      leftIcon={<Sparkles className="w-4 h-4" />}
                    >
                      Select Photo
                    </Button>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
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

            {/* Diagnostic Results Section */}
            {result && (
              <div className="mt-12 space-y-8 animate-fade-in">
                {/* Result Header */}
                <GlassCard className="border-emerald-500/30">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge variant="healthy">{result.prediction.details?.crop || 'Crop'}</Badge>
                        <Badge variant={mapSeverityToBadge(result.prediction.details?.severity)}>
                          Severity: {result.prediction.details?.severity || 'Moderate'}
                        </Badge>
                        <Badge variant="neutral">
                          {result.prediction.details?.pathogen_type || 'Pathogen'}
                        </Badge>
                      </div>
                      <h2 className="text-2xl md:text-3xl font-black text-slate-100 mt-2">
                        {result.prediction.details?.common_name || result.prediction.disease_name}
                      </h2>
                      <p className="text-xs text-emerald-400/80 italic mt-1">
                        Scientific Name: {result.prediction.details?.scientific_name}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 bg-forest-950/80 px-6 py-4 rounded-2xl border border-emerald-500/20 text-right">
                      <div>
                        <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                          Confidence
                        </div>
                        <div className="text-3xl font-black text-sprout-400">
                          {(result.prediction.confidence * 100).toFixed(1)}%
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Inference: {result.inference_time_ms} ms
                        </div>
                      </div>
                    </div>
                  </div>
                </GlassCard>

                {/* Grad-CAM Visual Heatmap */}
                {result.heatmap_base64 && (
                  <GlassCard>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Flame className="w-5 h-5 text-amber-400" />
                        <h3 className="text-base font-bold text-slate-200">
                          Explainable AI (Grad-CAM) Visual Heatmap
                        </h3>
                      </div>
                      <Badge variant="sprout">Feature Focus Overlay</Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                      <div className="text-center">
                        <p className="text-xs text-slate-400 mb-2 font-medium">Original Leaf Photo</p>
                        {previewUrl && (
                          <img
                            src={previewUrl}
                            alt="Original leaf photo"
                            className="max-h-64 mx-auto rounded-xl border border-emerald-500/20 shadow-md"
                          />
                        )}
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-emerald-400 mb-2 font-medium">
                          Infected Spot Activation Heatmap
                        </p>
                        <img
                          src={result.heatmap_base64}
                          alt="Grad-CAM Disease Heatmap"
                          className="max-h-64 mx-auto rounded-xl border border-amber-500/40 shadow-glow-emerald"
                        />
                      </div>
                    </div>
                  </GlassCard>
                )}

                {/* Treatment Guidance Tabs */}
                {result.prediction.details && (
                  <GlassCard>
                    <div className="flex border-b border-emerald-500/15 mb-6 space-x-2 overflow-x-auto">
                      <button
                        onClick={() => setActiveRemedyTab('remedies')}
                        className={`pb-3 px-4 text-xs font-bold border-b-2 transition ${
                          activeRemedyTab === 'remedies'
                            ? 'border-emerald-400 text-emerald-400'
                            : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        🌱 Organic Remedies
                      </button>
                      <button
                        onClick={() => setActiveRemedyTab('chemical')}
                        className={`pb-3 px-4 text-xs font-bold border-b-2 transition ${
                          activeRemedyTab === 'chemical'
                            ? 'border-emerald-400 text-emerald-400'
                            : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        🧪 Chemical Treatments
                      </button>
                      <button
                        onClick={() => setActiveRemedyTab('symptoms')}
                        className={`pb-3 px-4 text-xs font-bold border-b-2 transition ${
                          activeRemedyTab === 'symptoms'
                            ? 'border-emerald-400 text-emerald-400'
                            : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        🔍 Diagnostic Symptoms
                      </button>
                      <button
                        onClick={() => setActiveRemedyTab('prevention')}
                        className={`pb-3 px-4 text-xs font-bold border-b-2 transition ${
                          activeRemedyTab === 'prevention'
                            ? 'border-emerald-400 text-emerald-400'
                            : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        🛡️ Preventive Care
                      </button>
                    </div>

                    <div className="text-sm">
                      {activeRemedyTab === 'remedies' && (
                        <ul className="space-y-2.5">
                          {result.prediction.details.organic_remedies.map((remedy, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-slate-300">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                              <span>{remedy}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {activeRemedyTab === 'chemical' && (
                        <ul className="space-y-2.5">
                          {result.prediction.details.chemical_treatments.map((treatment, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-slate-300">
                              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                              <span>{treatment}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {activeRemedyTab === 'symptoms' && (
                        <ul className="space-y-2.5">
                          {result.prediction.details.symptoms.map((symptom, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-slate-300">
                              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                              <span>{symptom}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {activeRemedyTab === 'prevention' && (
                        <ul className="space-y-2.5">
                          {result.prediction.details.preventive_protocols.map((protocol, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-slate-300">
                              <CheckCircle2 className="w-4 h-4 text-sprout-400 shrink-0 mt-0.5" />
                              <span>{protocol}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </GlassCard>
                )}
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
