import React, { useState } from 'react';
import { Route, Sparkles, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { fetchOptimalRoute } from '../services/api';

const RoutePanel = ({ optimalRoute, setOptimalRoute }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerateRoute = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchOptimalRoute();
      setOptimalRoute(data);
    } catch (err) {
      setError('Failed to compute TSP optimization route. Ensure backend microservice is operational.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 text-left">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Route className="w-5 h-5 text-blue-400" /> AI Fleet Dispatch Optimizer
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Powered by NetworkX graph-theoretic TSP approximations &amp; Numpy Haversine distance bounds
          </p>
        </div>

        {/* Action Trigger Button */}
        <button
          onClick={handleGenerateRoute}
          disabled={loading}
          className="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-xs font-bold rounded-xl group bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 group-hover:from-cyan-500 group-hover:to-blue-600 hover:text-white text-white focus:ring-2 focus:outline-none focus:ring-cyan-800 transition-all active:scale-95 shadow-lg shadow-cyan-500/20 shrink-0 cursor-pointer"
        >
          <span className="relative px-4 py-2.5 transition-all ease-in duration-75 bg-slate-950 rounded-[10px] group-hover:bg-opacity-0 flex items-center gap-2">
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                <span>Computing Topology...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-cyan-400 group-hover:text-white transition-colors" />
                <span>Generate Optimal Route</span>
              </>
            )}
          </span>
        </button>
      </div>

      {/* Error State Banner */}
      {error && (
        <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2.5 animate-pulse">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Calculated Optimization Results Header */}
      {optimalRoute && optimalRoute.details && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Total Hubs In Route</span>
              <span className="font-bold text-white text-sm">{optimalRoute.details.length} Hubs</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Haversine Traversal</span>
              <span className="font-bold text-cyan-400 text-sm">{optimalRoute.total_distance} km</span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Engine Message</span>
              <span className="font-medium text-emerald-400 text-[11px] truncate block">
                {optimalRoute.message || 'TSP Tour Solved'}
              </span>
            </div>
          </div>

          {/* Sequential Timeline Sequence List */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Optimized Sequence Dispatch Order
            </h3>
            
            {optimalRoute.details.length === 0 ? (
              <div className="p-4 rounded-xl text-center text-xs text-slate-500 bg-slate-900/40 border border-slate-800/80">
                <CheckCircle className="w-5 h-5 mx-auto mb-1 text-emerald-500/80" />
                No bins qualify under target fill levels. Active smart bin fleet is completely balanced.
              </div>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2">
                {optimalRoute.details.map((step, idx) => (
                  <div 
                    key={`${step.bin_id}-${idx}`}
                    className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 flex items-center justify-between gap-3 hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-center gap-3.5">
                      <span className="w-6 h-6 rounded-lg bg-blue-500/10 border border-blue-500/20 font-mono text-[11px] font-bold text-blue-400 flex items-center justify-center shrink-0">
                        {step.step_order}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-white">{step.location || step.bin_id}</p>
                        <p className="text-[10px] text-slate-500 font-mono">Node: {step.bin_id}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right shrink-0">
                      <div>
                        <span className="text-[9px] text-slate-500 block">Priority</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          step.priority === 3 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : step.priority === 2 ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-400'
                        }`}>
                          Tier {step.priority}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 block">Sensor Load</span>
                        <span className="text-xs font-bold text-slate-100">{step.fill_percentage}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoutePanel;
