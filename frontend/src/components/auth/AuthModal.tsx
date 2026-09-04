'use client';

import React, { useState } from 'react';
import { useAuth } from '../../lib/authContext';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { X, Mail, Lock, User as UserIcon, AlertCircle, CheckCircle2, Leaf, Sparkles } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'login',
}) => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email || !password) {
      setErrorMessage('Please provide both email and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    if (mode === 'login') {
      const res = await login(email, password);
      setLoading(false);
      if (res.success) {
        setSuccessMessage('Successfully signed in!');
        setTimeout(() => {
          onClose();
        }, 800);
      } else {
        setErrorMessage(res.error || 'Login failed.');
      }
    } else {
      const res = await register(email, password, fullName);
      setLoading(false);
      if (res.success) {
        setSuccessMessage('Account created successfully!');
        setTimeout(() => {
          onClose();
        }, 800);
      } else {
        setErrorMessage(res.error || 'Registration failed.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md">
        <GlassCard className="border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.15)] relative overflow-hidden">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-xl bg-forest-900/60 hover:bg-forest-800 text-slate-400 hover:text-slate-200 border border-emerald-500/20 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-sprout-500 flex items-center justify-center mx-auto mb-3 shadow-glow-emerald text-2xl">
              🌿
            </div>
            <h2 className="text-xl font-extrabold text-slate-100">
              {mode === 'login' ? 'Welcome to Plant Health AI' : 'Create Agronomist Account'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {mode === 'login'
                ? 'Sign in to access your secure scan history and outbreak alerts'
                : 'Join our plant pathology diagnostic and surveillance network'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex rounded-xl bg-forest-900/90 p-1 border border-emerald-500/15 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                mode === 'login'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                mode === 'register'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Register New Account
            </button>
          </div>

          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Full Name (Optional)
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="e.g. Dr. Jane Smith"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-forest-900/80 border border-emerald-500/20 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400/30 text-sm text-slate-100 placeholder-slate-500 transition"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-forest-900/80 border border-emerald-500/20 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400/30 text-sm text-slate-100 placeholder-slate-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-forest-900/80 border border-emerald-500/20 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400/30 text-sm text-slate-100 placeholder-slate-500 transition"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Minimum 6 characters with secure bcrypt encryption
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={loading}
              isLoading={loading}
              className="w-full shadow-glow-emerald mt-2"
            >
              {mode === 'login' ? 'Sign In to Account' : 'Create Account'}
            </Button>
          </form>

          {/* Quick Demo Credentials Info */}
          <div className="mt-6 pt-4 border-t border-emerald-500/15 text-center">
            <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sprout-400" />
              <span>Tip: You can register any demo email to test JWT authentication!</span>
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
