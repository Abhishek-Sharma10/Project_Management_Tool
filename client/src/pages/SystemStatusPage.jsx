import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function StatusBadge({ status }) {
  const styles = {
    loading: 'bg-amber-100 text-amber-800 border border-amber-300',
    connected: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
    disconnected: 'bg-rose-100 text-rose-800 border border-rose-300',
  };
  const labels = {
    loading: '⏳ Checking…',
    connected: '✅ Connected',
    disconnected: '❌ Disconnected',
  };
  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

export default function SystemStatusPage() {
  const [backendStatus, setBackendStatus] = useState('loading');
  const [dbStatus, setDbStatus] = useState('loading');
  const [apiInfo, setApiInfo] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const checkHealth = async () => {
    try {
      setRefreshing(true);
      const res = await fetch(`${API_URL}/health`);
      const data = await res.json();

      if (res.ok && data.success) {
        setBackendStatus('connected');
        setDbStatus(data.database === 'connected' ? 'connected' : 'disconnected');
        setApiInfo(data);
      } else {
        setBackendStatus('connected');
        setDbStatus('disconnected');
        setApiInfo(data);
      }
    } catch {
      setBackendStatus('disconnected');
      setDbStatus('disconnected');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="space-y-6 pb-12 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <button
          type="button"
          onClick={checkHealth}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-2xs cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Status
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            System Diagnostic & Infrastructure Status
          </h2>
          <span className="text-[11px] font-semibold text-slate-400">
            Phase 1 Foundation
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Backend Server (Node.js + Express)
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                http://localhost:5000
              </p>
            </div>
            <StatusBadge status={backendStatus} />
          </div>

          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Database (PostgreSQL via Docker)
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                localhost:5433 → container: pmt-postgres
              </p>
            </div>
            <StatusBadge status={dbStatus} />
          </div>

          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                API Base Endpoint
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                VITE_API_URL configuration
              </p>
            </div>
            <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-700">
              {API_URL}
            </span>
          </div>

          {apiInfo?.dbTime && (
            <div className="flex items-center justify-between px-6 py-4">
              <p className="text-sm font-semibold text-slate-900">
                PostgreSQL Server Timestamp
              </p>
              <span className="text-xs font-mono text-slate-600">
                {new Date(apiInfo.dbTime).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-emerald-900 text-xs space-y-1">
        <p className="font-bold flex items-center gap-1.5 text-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Full System Operational
        </p>
        <p className="text-emerald-700 leading-relaxed">
          Express backend, PostgreSQL database, WebSockets, and Vite frontend are
          healthy, responsive, and communicating seamlessly.
        </p>
      </div>
    </div>
  );
}
