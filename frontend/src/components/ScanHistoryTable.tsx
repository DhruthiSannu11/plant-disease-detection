'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/authContext';
import { GlassCard } from './ui/GlassCard';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import {
  Activity,
  Search,
  Filter,
  Trash2,
  Eye,
  RefreshCw,
  Calendar,
  Sparkles,
  Sprout,
  ShieldCheck,
  AlertCircle,
  FileText,
  X,
  User as UserIcon,
  LogIn,
} from 'lucide-react';

export interface DiagnosticDetails {
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

export interface ScanItem {
  id: number;
  user_id?: number | null;
  crop: string;
  disease_name: string;
  common_name?: string | null;
  scientific_name?: string | null;
  confidence: number;
  severity: string;
  image_path?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  location_name?: string | null;
  notes?: string | null;
  created_at: string;
  details?: DiagnosticDetails | null;
}

interface ScanHistoryTableProps {
  onStartNewScan?: () => void;
  onOpenAuth?: () => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const ScanHistoryTable: React.FC<ScanHistoryTableProps> = ({
  onStartNewScan,
  onOpenAuth,
}) => {
  const { user, token, stats } = useAuth();
  const [scans, setScans] = useState<ScanItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedCrop, setSelectedCrop] = useState<string>('all');
  const [page, setPage] = useState<number>(0);
  const pageSize = 10;

  // Selected scan for full prescription modal
  const [viewingScan, setViewingScan] = useState<ScanItem | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchScans = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('skip', (page * pageSize).toString());
      params.append('limit', pageSize.toString());

      if (searchTerm.trim()) {
        params.append('disease_name', searchTerm.trim());
      }
      if (selectedSeverity !== 'all') {
        params.append('severity', selectedSeverity);
      }
      if (selectedCrop !== 'all') {
        params.append('crop', selectedCrop);
      }

      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE_URL}/api/v1/scans?${params.toString()}`, {
        headers,
      });

      if (!res.ok) {
        throw new Error('Failed to load scan records.');
      }

      const data = await res.json();
      setScans(data.items || []);
      setTotalCount(data.total || 0);
    } catch (err: any) {
      setError(err.message || 'Error fetching scan history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScans();
  }, [page, selectedSeverity, selectedCrop, token]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchScans();
  };

  const handleDeleteScan = async (id: number) => {
    if (!confirm('Are you sure you want to remove this scan from your history?')) return;

    setDeletingId(id);
    try {
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE_URL}/api/v1/scans/${id}`, {
        method: 'DELETE',
        headers,
      });

      if (res.ok) {
        setScans((prev) => prev.filter((s) => s.id !== id));
        setTotalCount((prev) => Math.max(0, prev - 1));
      } else {
        const data = await res.json();
        alert(data.detail || 'Failed to delete scan record.');
      }
    } catch {
      alert('Error connecting to server to delete record.');
    } finally {
      setDeletingId(null);
    }
  };

  const getSeverityBadgeVariant = (severity: string) => {
    const s = severity?.toLowerCase();
    if (s === 'low' || s === 'healthy') return 'healthy';
    if (s === 'moderate') return 'moderate';
    if (s === 'high') return 'high';
    if (s === 'severe' || s === 'critical') return 'critical';
    return 'sprout';
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const cropOptions = [
    'all',
    'Apple',
    'Corn',
    'Grape',
    'Potato',
    'Tomato',
    'Pepper',
    'Strawberry',
    'Peach',
    'Cherry',
    'Soybean',
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header & KPI Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Badge variant="sprout" className="mb-2">
            <Activity className="w-3 h-3" />
            <span>Database Scan Records</span>
          </Badge>
          <h2 className="text-2xl md:text-3xl font-black text-slate-100">
            Plant Diagnostic &{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-sprout-400 to-leaf-300 bg-clip-text text-transparent">
              Scan History
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {user
              ? `Showing logged-in scan records for ${user.full_name || user.email}`
              : 'Showing recent public diagnostic scans. Sign in to save and sync your personal field scans.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!user && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenAuth}
              className="border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"
            >
              <LogIn className="w-3.5 h-3.5 mr-1.5" />
              <span>Sign In to Sync</span>
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={onStartNewScan}
            className="shadow-glow-emerald"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            <span>New Leaf Scan</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard className="!p-4 border-emerald-500/20">
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
            Total Scans Logged
          </span>
          <div className="text-2xl font-black text-emerald-400 mt-1">{totalCount}</div>
          <p className="text-[10px] text-slate-500 mt-0.5">Stored in PostgreSQL 16 database</p>
        </GlassCard>

        <GlassCard className="!p-4 border-emerald-500/20">
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
            User Account Status
          </span>
          <div className="text-sm font-bold text-sprout-400 mt-2 flex items-center gap-1.5">
            <UserIcon className="w-4 h-4" />
            <span>{user ? user.email : 'Guest Mode (Public Scans)'}</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {user ? 'Cloud sync enabled' : 'Sign in to access personal history'}
          </p>
        </GlassCard>

        <GlassCard className="!p-4 border-emerald-500/20">
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
            Most Detected Pathogen
          </span>
          <div className="text-sm font-bold text-amber-300 mt-2 truncate">
            {stats?.most_frequent_disease || (scans.length > 0 ? scans[0].disease_name : 'None')}
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Based on historical diagnosis logs</p>
        </GlassCard>
      </div>

      {/* Search & Filter Toolbar */}
      <GlassCard className="!p-4 border-emerald-500/20">
        <form
          onSubmit={handleSearchSubmit}
          className="flex flex-col md:flex-row items-center gap-3"
        >
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by disease or crop (e.g. Early Blight, Tomato, Corn)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-forest-900/80 border border-emerald-500/20 focus:border-emerald-400 focus:outline-none text-xs text-slate-100 placeholder-slate-500 transition"
            />
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedSeverity}
              onChange={(e) => {
                setSelectedSeverity(e.target.value);
                setPage(0);
              }}
              className="w-full md:w-auto px-3 py-2 rounded-xl bg-forest-900/80 border border-emerald-500/20 text-xs text-slate-200 focus:outline-none focus:border-emerald-400 cursor-pointer"
            >
              <option value="all">All Severities</option>
              <option value="Low">Low / Healthy</option>
              <option value="Moderate">Moderate</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>

            {/* Crop Filter */}
            <select
              value={selectedCrop}
              onChange={(e) => {
                setSelectedCrop(e.target.value);
                setPage(0);
              }}
              className="w-full md:w-auto px-3 py-2 rounded-xl bg-forest-900/80 border border-emerald-500/20 text-xs text-slate-200 focus:outline-none focus:border-emerald-400 cursor-pointer"
            >
              {cropOptions.map((c) => (
                <option key={c} value={c}>
                  {c === 'all' ? 'All Crops' : c}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={fetchScans}
              className="p-2 rounded-xl bg-forest-800/80 hover:bg-forest-700 text-slate-300 border border-emerald-500/20 transition cursor-pointer"
              title="Refresh records"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </form>
      </GlassCard>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Scans Table / Cards */}
      {loading ? (
        <div className="py-16 text-center">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Loading scan history from database...</p>
        </div>
      ) : scans.length === 0 ? (
        <GlassCard className="py-16 text-center">
          <Sprout className="w-12 h-12 text-emerald-400/60 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-200">No Scan Records Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchTerm || selectedSeverity !== 'all' || selectedCrop !== 'all'
              ? 'No scans match your filter criteria. Try clearing search filters.'
              : 'You have not recorded any plant leaf scans yet. Take a photo of a leaf to start!'}
          </p>
          <div className="mt-5">
            <Button variant="primary" size="sm" onClick={onStartNewScan}>
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              <span>Scan a Leaf Now</span>
            </Button>
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {/* Table Container */}
          <div className="overflow-x-auto rounded-2xl border border-emerald-500/20 bg-forest-950/60">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-forest-900/90 text-slate-400 font-semibold border-b border-emerald-500/15">
                <tr>
                  <th className="py-3.5 px-4">Crop & Disease</th>
                  <th className="py-3.5 px-4 hidden sm:table-cell">Scientific Classification</th>
                  <th className="py-3.5 px-4">Severity</th>
                  <th className="py-3.5 px-4">AI Confidence</th>
                  <th className="py-3.5 px-4 hidden md:table-cell">Date Logged</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-500/10">
                {scans.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-forest-900/40 transition duration-150"
                  >
                    {/* Crop & Disease */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-300 shrink-0 font-bold">
                          🌿
                        </div>
                        <div>
                          <div className="font-bold text-slate-100">{item.disease_name}</div>
                          <div className="text-[11px] text-emerald-400/80 font-medium">
                            {item.crop}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Scientific Name */}
                    <td className="py-3.5 px-4 hidden sm:table-cell">
                      <span className="italic text-slate-400">
                        {item.scientific_name || item.common_name || 'Standard Cultivar'}
                      </span>
                    </td>

                    {/* Severity Badge */}
                    <td className="py-3.5 px-4">
                      <Badge variant={getSeverityBadgeVariant(item.severity)}>
                        {item.severity}
                      </Badge>
                    </td>

                    {/* Confidence */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-forest-900 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-sprout-400 rounded-full"
                            style={{ width: `${Math.min(100, Math.round(item.confidence * 100))}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-slate-200">
                          {(item.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 hidden md:table-cell text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-emerald-500/70" />
                        <span>{formatDate(item.created_at)}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingScan(item)}
                          className="p-1.5 rounded-lg bg-forest-800/80 hover:bg-forest-700 text-emerald-300 hover:text-emerald-200 border border-emerald-500/20 transition cursor-pointer"
                          title="View botanical treatment & symptoms"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteScan(item.id)}
                          disabled={deletingId === item.id}
                          className="p-1.5 rounded-lg bg-forest-800/80 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 border border-rose-500/20 transition cursor-pointer"
                          title="Delete scan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between px-2 pt-3">
            <div className="text-xs text-slate-400">
              Showing <span className="font-semibold text-emerald-400">{page * pageSize + 1}</span> to{' '}
              <span className="font-semibold text-emerald-400">
                {Math.min(totalCount, (page + 1) * pageSize)}
              </span>{' '}
              of <span className="font-semibold text-emerald-400">{totalCount}</span> scans
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Previous
              </Button>
              <span className="text-xs text-slate-400 px-2">
                Page {page + 1} of {Math.max(1, Math.ceil(totalCount / pageSize))}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={(page + 1) * pageSize >= totalCount}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Historical Diagnosis Prescription Modal */}
      {viewingScan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-950/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <GlassCard className="border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.2)] relative">
              {/* Close Button */}
              <button
                onClick={() => setViewingScan(null)}
                className="absolute top-4 right-4 p-1.5 rounded-xl bg-forest-900/60 hover:bg-forest-800 text-slate-400 hover:text-slate-200 border border-emerald-500/20 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Header */}
              <div className="flex items-start gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-sprout-500 flex items-center justify-center shadow-glow-emerald text-2xl shrink-0">
                  🌿
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-100">
                      {viewingScan.disease_name}
                    </h3>
                    <Badge variant={getSeverityBadgeVariant(viewingScan.severity)}>
                      {viewingScan.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-emerald-400/80 font-medium">
                    {viewingScan.crop} •{' '}
                    <span className="italic">{viewingScan.scientific_name || 'Botanical specimen'}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Recorded on {formatDate(viewingScan.created_at)} with{' '}
                    <span className="font-bold text-emerald-300">
                      {(viewingScan.confidence * 100).toFixed(1)}% AI confidence
                    </span>
                  </p>
                </div>
              </div>

              {/* Botanical Details Sections */}
              <div className="space-y-4 text-xs">
                {/* Symptoms */}
                {viewingScan.details?.symptoms && viewingScan.details.symptoms.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-forest-900/60 border border-emerald-500/15">
                    <h4 className="font-bold text-slate-200 mb-2 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-amber-400" />
                      <span>Characteristic Symptoms & Morphology</span>
                    </h4>
                    <ul className="list-disc pl-5 space-y-1 text-slate-300">
                      {viewingScan.details.symptoms.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Organic Remedies */}
                {viewingScan.details?.organic_remedies &&
                  viewingScan.details.organic_remedies.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/20">
                      <h4 className="font-bold text-emerald-300 mb-2 flex items-center gap-1.5">
                        <Sprout className="w-4 h-4 text-emerald-400" />
                        <span>Biological & Organic Remedies</span>
                      </h4>
                      <ul className="list-disc pl-5 space-y-1 text-slate-300">
                        {viewingScan.details.organic_remedies.map((r, idx) => (
                          <li key={idx}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                {/* Chemical Treatments */}
                {viewingScan.details?.chemical_treatments &&
                  viewingScan.details.chemical_treatments.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-forest-900/60 border border-emerald-500/15">
                      <h4 className="font-bold text-rose-300 mb-2 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-rose-400" />
                        <span>Chemical Fungicides / Pesticides</span>
                      </h4>
                      <ul className="list-disc pl-5 space-y-1 text-slate-300">
                        {viewingScan.details.chemical_treatments.map((c, idx) => (
                          <li key={idx}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                {/* Notes */}
                {viewingScan.notes && (
                  <div className="p-3 rounded-xl bg-forest-900/40 border border-emerald-500/10 text-slate-400">
                    <span className="font-semibold text-slate-300">Scan Notes: </span>
                    {viewingScan.notes}
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <Button variant="primary" size="sm" onClick={() => setViewingScan(null)}>
                  Close Diagnostic View
                </Button>
              </div>
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  );
};
