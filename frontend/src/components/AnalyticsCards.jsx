import React from 'react';
import { Layers, AlertTriangle, TrendingUp, CheckCircle2 } from 'lucide-react';

const AnalyticsCards = ({ bins }) => {
  const totalBins = bins.length;
  const criticalBins = bins.filter((b) => (b.fill_percentage || 0) > 80).length;
  
  const avgFillRate = totalBins > 0 
    ? Math.round(bins.reduce((acc, curr) => acc + (curr.fill_percentage || 0), 0) / totalBins)
    : 0;

  const isHealthy = criticalBins === 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
      {/* Total Active Hubs Card */}
      <div className="glass-card p-5 rounded-2xl relative overflow-hidden group text-left">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-all"></div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Monitored Nodes
          </span>
          <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-white tracking-tight">
            {totalBins}
          </span>
          <span className="text-xs text-slate-500 font-medium">IoT Hubs</span>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
          <span>100% active telemetry feed</span>
        </div>
      </div>

      {/* Critical Hubs Count */}
      <div className="glass-card p-5 rounded-2xl relative overflow-hidden group text-left">
        <div className={`absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 rounded-full blur-xl transition-all ${criticalBins > 0 ? 'bg-rose-500/10 group-hover:bg-rose-500/20' : 'bg-emerald-500/10 group-hover:bg-emerald-500/20'}`}></div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Critical Hubs (&gt;80% Fill)
          </span>
          <div className={`p-2.5 border rounded-xl shrink-0 ${criticalBins > 0 ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 animate-pulse' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
            {criticalBins > 0 ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-extrabold tracking-tight ${criticalBins > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {criticalBins}
          </span>
          <span className="text-xs text-slate-500 font-medium">Pending Routing</span>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-[11px]">
          <span className={`font-semibold ${criticalBins > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {isHealthy ? 'Optimal Fleet Status' : 'Immediate dispatch prioritized'}
          </span>
        </div>
      </div>

      {/* Average Fleet Fill Rate */}
      <div className="glass-card p-5 rounded-2xl relative overflow-hidden group text-left">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-amber-500/10 rounded-full blur-xl group-hover:bg-amber-500/20 transition-all"></div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            City-Wide Avg Fill Rate
          </span>
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mb-2.5">
          <span className="text-3xl font-extrabold text-white tracking-tight">
            {avgFillRate}%
          </span>
          <span className="text-xs text-slate-500 font-medium">Volume Utilized</span>
        </div>
        {/* Animated Progress bar indicator */}
        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              avgFillRate > 75 ? 'bg-gradient-to-r from-amber-500 to-rose-500' : 'bg-gradient-to-r from-emerald-500 to-teal-400'
            }`}
            style={{ width: `${Math.min(avgFillRate, 100)}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsCards;
