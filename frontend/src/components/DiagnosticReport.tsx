'use client';

import React, { useState } from 'react';
import { HeatmapViewer } from './HeatmapViewer';
import { GlassCard } from './ui/GlassCard';
import { Badge, BadgeVariant } from './ui/Badge';
import { Button } from './ui/Button';
import {
  CheckCircle2,
  AlertTriangle,
  Printer,
  Save,
  RotateCcw,
  Sparkles,
  BarChart3,
  ShieldAlert,
  Leaf,
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

interface DiagnosticReportProps {
  result: PredictionResponse;
  originalImageUrl: string;
  onScanAnother?: () => void;
  onSaveScan?: () => Promise<boolean> | boolean;
}

export const DiagnosticReport: React.FC<DiagnosticReportProps> = ({
  result,
  originalImageUrl,
  onScanAnother,
  onSaveScan,
}) => {
  const [activeTab, setActiveTab] = useState<
    'remedies' | 'chemical' | 'symptoms' | 'prevention'
  >('remedies');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const { prediction, top_k, inference_time_ms, heatmap_base64 } = result;
  const details = prediction.details;

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

  const handlePrint = () => {
    window.print();
  };

  const handleSave = async () => {
    if (!onSaveScan) return;
    setIsSaving(true);
    setSaveStatus(null);
    try {
      const ok = await onSaveScan();
      if (ok) {
        setSaveStatus('✅ Scan successfully archived to database!');
      } else {
        setSaveStatus('⚠️ Unable to archive scan to database.');
      }
    } catch {
      setSaveStatus('❌ Error connecting to database API.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full space-y-8 animate-fade-in print:space-y-4 print:text-black">
      {/* 1. Main Diagnosis Summary Banner */}
      <GlassCard className="border-emerald-500/30 print:border-none print:shadow-none print:bg-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="healthy">{details?.crop || 'Crop'}</Badge>
              <Badge variant={mapSeverityToBadge(details?.severity)}>
                Severity: {details?.severity || 'Moderate'}
              </Badge>
              <Badge variant="neutral">{details?.pathogen_type || 'Pathogen'}</Badge>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-slate-100 print:text-slate-900 mt-2">
              {details?.common_name || prediction.disease_name}
            </h2>
            <p className="text-xs text-emerald-400/80 italic mt-1 print:text-emerald-700">
              Scientific Name: {details?.scientific_name}
            </p>
          </div>

          <div className="flex items-center gap-4 bg-forest-950/80 print:bg-slate-100 px-6 py-4 rounded-2xl border border-emerald-500/20 text-right">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-400 print:text-slate-600 font-bold">
                AI Confidence
              </div>
              <div
                className={`text-3xl font-black ${
                  prediction.confidence < 0.6 ? 'text-amber-400' : 'text-sprout-400 print:text-emerald-700'
                }`}
              >
                {(prediction.confidence * 100).toFixed(1)}%
              </div>
              <div className="text-[10px] text-slate-400 print:text-slate-600 mt-0.5">
                Latency: {inference_time_ms} ms (ONNX INT8)
              </div>
            </div>
          </div>
        </div>

        {/* Marginal Confidence Warning Banner */}
        {prediction.confidence < 0.6 && (
          <div className="mt-4 p-3.5 rounded-xl bg-amber-950/70 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2.5 print:bg-amber-100 print:text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Low Confidence Warning ({(prediction.confidence * 100).toFixed(1)}%):</strong>{' '}
              The model is uncertain about this leaf image. Please ensure a single plant leaf is
              well-lit, centered, and free of glare.
            </span>
          </div>
        )}
      </GlassCard>

      {/* 2. Top-3 Differential Diagnosis Probability Bars */}
      {top_k && top_k.length > 1 && (
        <GlassCard className="print:border-none print:shadow-none print:bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-200 print:text-slate-900">
                Top-3 Differential Diagnosis Probabilities
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">Softmax Distribution</span>
          </div>

          <div className="space-y-3">
            {top_k.map((item, idx) => {
              const pct = (item.confidence * 100).toFixed(1);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-300 print:text-slate-800">
                      {idx + 1}. {item.details?.common_name || item.disease_name}
                    </span>
                    <span className="text-emerald-400 print:text-emerald-700 font-mono">{pct}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-forest-900 print:bg-slate-200 overflow-hidden border border-emerald-500/10">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        idx === 0
                          ? 'bg-gradient-to-r from-emerald-500 to-sprout-400 shadow-[0_0_8px_rgba(34,197,94,0.4)]'
                          : 'bg-slate-600'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}

      {/* 3. Grad-CAM Explainable AI Heatmap Viewer */}
      {heatmap_base64 && (
        <div className="print:break-inside-avoid">
          <HeatmapViewer
            originalImageUrl={originalImageUrl}
            heatmapBase64={heatmap_base64}
            diseaseName={prediction.disease_name}
          />
        </div>
      )}

      {/* 4. Botanical Treatment Guidance Tabs */}
      {details && (
        <GlassCard className="print:border-none print:shadow-none print:bg-white">
          <div className="flex border-b border-emerald-500/15 mb-6 space-x-2 overflow-x-auto print:hidden">
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
              🔍 Diagnostic Symptoms
            </button>
            <button
              onClick={() => setActiveTab('prevention')}
              className={`pb-3 px-4 text-xs font-bold border-b-2 transition ${
                activeTab === 'prevention'
                  ? 'border-emerald-400 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              🛡️ Preventive Care
            </button>
          </div>

          <div className="text-sm">
            {activeTab === 'remedies' && (
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-300 print:text-emerald-800">
                  Recommended Biological Controls
                </div>
                <ul className="space-y-2.5">
                  {details.organic_remedies.map((remedy, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-slate-300 print:text-slate-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{remedy}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {activeTab === 'chemical' && (
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-300 print:text-amber-800">
                  Fungicides & Pesticides Guidelines
                </div>
                <ul className="space-y-2.5">
                  {details.chemical_treatments.map((treatment, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-slate-300 print:text-slate-800">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{treatment}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {activeTab === 'symptoms' && (
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-rose-300 print:text-rose-800">
                  Characteristic Lesion Morphology
                </div>
                <ul className="space-y-2.5">
                  {details.symptoms.map((symptom, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-slate-300 print:text-slate-800">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <span>{symptom}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {activeTab === 'prevention' && (
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-sprout-300 print:text-sprout-800">
                  Seasonal & Cultural Hygiene
                </div>
                <ul className="space-y-2.5">
                  {details.preventive_protocols.map((protocol, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-slate-300 print:text-slate-800">
                      <CheckCircle2 className="w-4 h-4 text-sprout-400 shrink-0 mt-0.5" />
                      <span>{protocol}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </GlassCard>
      )}

      {/* 5. Report Action Controls (Hidden during print) */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-emerald-500/15 print:hidden">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="md"
            onClick={handlePrint}
            leftIcon={<Printer className="w-4 h-4" />}
          >
            Export PDF / Print Report
          </Button>

          {onSaveScan && (
            <Button
              variant="secondary"
              size="md"
              disabled={isSaving}
              isLoading={isSaving}
              onClick={handleSave}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Scan to History
            </Button>
          )}
        </div>

        {onScanAnother && (
          <Button
            variant="primary"
            size="md"
            onClick={onScanAnother}
            leftIcon={<RotateCcw className="w-4 h-4" />}
          >
            Scan Another Leaf
          </Button>
        )}
      </div>

      {saveStatus && (
        <div className="p-3 rounded-xl bg-forest-900/80 border border-emerald-500/20 text-xs text-emerald-300">
          {saveStatus}
        </div>
      )}
    </div>
  );
};
