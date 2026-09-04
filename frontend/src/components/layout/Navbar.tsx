'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from '../ui/Badge';
import { Activity, ShieldCheck, MapPin, Sparkles, Menu, X, ExternalLink } from 'lucide-react';

interface NavbarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab = 'scanner',
  onTabChange,
}) => {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkApiHealth = async () => {
      const start = performance.now();
      try {
        const res = await fetch('http://localhost:8000/api/v1/health', {
          cache: 'no-store',
        });
        const duration = Math.round(performance.now() - start);
        if (isMounted) {
          if (res.ok) {
            setIsOnline(true);
            setLatencyMs(duration);
          } else {
            setIsOnline(false);
          }
        }
      } catch {
        if (isMounted) {
          setIsOnline(false);
          setLatencyMs(null);
        }
      }
    };

    checkApiHealth();
    const interval = setInterval(checkApiHealth, 15000); // Check every 15s
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const navItems = [
    { id: 'scanner', label: 'Leaf Scanner', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'outbreaks', label: 'Outbreak Map', icon: <MapPin className="w-4 h-4" /> },
    { id: 'history', label: 'Scan History', icon: <Activity className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-emerald-500/15">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-sprout-500 flex items-center justify-center shadow-glow-emerald text-xl">
              🌿
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-sprout-300 to-leaf-400 bg-clip-text text-transparent">
                  Plant Health AI
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-300">
                  ONNX INT8
                </span>
              </div>
              <p className="text-[11px] text-emerald-400/60 font-medium tracking-wide">
                Botanical Diagnostics & Disease Surveillance
              </p>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center space-x-1 bg-forest-900/60 p-1.5 rounded-2xl border border-emerald-500/10">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange?.(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-forest-800/40'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Status & Quick Links */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Live API Health Monitor */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-forest-900/80 border border-emerald-500/15 text-xs">
              <span className="relative flex h-2 w-2">
                {isOnline === true && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    isOnline === true
                      ? 'bg-emerald-400'
                      : isOnline === false
                      ? 'bg-rose-500'
                      : 'bg-amber-400'
                  }`}
                />
              </span>
              <span className="text-slate-400 text-[11px]">API:</span>
              <span
                className={`font-semibold text-[11px] ${
                  isOnline === true
                    ? 'text-emerald-300'
                    : isOnline === false
                    ? 'text-rose-400'
                    : 'text-amber-300'
                }`}
              >
                {isOnline === true
                  ? `Online (${latencyMs}ms)`
                  : isOnline === false
                  ? 'Offline'
                  : 'Checking...'}
              </span>
            </div>

            {/* API Docs Button */}
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 bg-forest-800/60 hover:bg-forest-700/60 border border-emerald-500/15 hover:border-emerald-400/30 transition"
            >
              <span>Swagger API</span>
              <ExternalLink className="w-3 h-3 text-emerald-400" />
            </a>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-forest-800/60 text-slate-200 border border-emerald-500/20"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pt-2 pb-4 space-y-2 bg-forest-950/95 border-b border-emerald-500/20 backdrop-blur-2xl">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onTabChange?.(item.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                activeTab === item.id
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                  : 'text-slate-300 hover:bg-forest-800/40'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
          <div className="pt-2 border-t border-emerald-500/15 flex items-center justify-between">
            <span className="text-xs text-slate-400">Backend API Status:</span>
            <Badge variant={isOnline ? 'healthy' : 'critical'}>
              {isOnline ? `Online (${latencyMs}ms)` : 'Offline'}
            </Badge>
          </div>
        </div>
      )}
    </header>
  );
};
