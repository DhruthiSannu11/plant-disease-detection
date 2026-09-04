import React from 'react';
import { ExternalLink, Heart, Sparkles, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full mt-20 border-t border-emerald-500/15 bg-forest-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🌿</span>
              <span className="font-extrabold text-lg bg-gradient-to-r from-emerald-400 to-sprout-400 bg-clip-text text-transparent">
                Plant Health AI
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              Enterprise-grade plant disease detection & epidemiological surveillance platform.
              Powered by PyTorch, INT8 Quantized ONNX Runtime, Explainable AI (Grad-CAM), and
              RFC 7946 GeoJSON outbreak mapping.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                ⚡ Sub-50ms Inference
              </span>
              <span className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                🎯 99.77% Val Accuracy
              </span>
              <span className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                🌱 38 Botanical Classes
              </span>
            </div>
          </div>

          {/* Developer & APIs */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              API & Integration
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li>
                <a
                  href="http://localhost:8000/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-300 flex items-center gap-1 transition"
                >
                  <span>Interactive Swagger Docs</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="http://localhost:8000/api/v1/outbreaks/geojson"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-300 flex items-center gap-1 transition"
                >
                  <span>GeoJSON Outbreak Feed</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="http://localhost:8000/api/v1/health"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-300 flex items-center gap-1 transition"
                >
                  <span>Healthcheck Microservice</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Legal & Open-Source */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              Agricultural Guidance
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              AI diagnoses serve as advisory guidance for farmers and agronomists. Severe crop
              infections should be confirmed with local agricultural extension officers before
              applying intensive chemical fungicides.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-emerald-500/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Plant Health AI Platform. 100% Free & Open-Source.</p>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-medium">All Microservices Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
