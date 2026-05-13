import React from 'react';
import { Layers, AlertTriangle, TrendingUp, CheckCircle2 } from 'lucide-react';

const AnalyticsCards = ({ bins }) => {
  const total    = bins.length;
  const critical = bins.filter(b => (b.fill_percentage || 0) > 80).length;
  const avg      = total > 0
    ? Math.round(bins.reduce((a, b) => a + (b.fill_percentage || 0), 0) / total)
    : 0;
  const healthy  = critical === 0;

  const cards = [
    {
      id: 'total',
      label: 'Total Monitored Nodes',
      value: total,
      unit: 'IoT Hubs',
      sub: 'All streams active',
      subOk: true,
      icon: Layers,
      accent: '#0d9488',
      bg: 'rgba(13,148,136,0.10)',
      border: 'rgba(13,148,136,0.22)',
    },
    {
      id: 'critical',
      label: critical > 0 ? `${critical} Bins Need Attention` : 'Fleet Status',
      value: critical,
      unit: 'Needs Dispatch',
      sub: healthy ? 'All bins optimal' : 'Immediate dispatch required',
      subOk: healthy,
      icon: healthy ? CheckCircle2 : AlertTriangle,
      accent: healthy ? '#16a34a' : '#dc2626',
      bg: healthy ? 'rgba(22,163,74,0.10)' : 'rgba(220,38,38,0.09)',
      border: healthy ? 'rgba(22,163,74,0.22)' : 'rgba(220,38,38,0.22)',
      pulse: !healthy,
    },
    {
      id: 'avg',
      label: 'City-Wide Avg Fill Rate',
      value: `${avg}%`,
      unit: 'Volume Used',
      icon: TrendingUp,
      accent: '#d97706',
      bg: 'rgba(217,119,6,0.09)',
      border: 'rgba(217,119,6,0.22)',
      progress: avg,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {cards.map(c => {
        const Icon = c.icon;
        return (
          <div key={c.id} id={`card-${c.id}`}
               className="glass-card p-5 rounded-2xl relative overflow-hidden text-left">
            {/* Blob glow */}
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full pointer-events-none opacity-50"
                 style={{ background: `radial-gradient(circle, ${c.bg.replace('0.09','0.25').replace('0.10','0.25')} 0%, transparent 70%)` }} />

            <div className="flex items-center justify-between mb-3.5">
              <span className="text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: 'rgba(13,74,47,0.50)' }}>{c.label}</span>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${c.pulse ? 'animate-pulse' : ''}`}
                   style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                <Icon className="w-4 h-4" style={{ color: c.accent }} />
              </div>
            </div>

            <div className="flex items-baseline gap-1.5 mb-2">
              <span className="text-3xl font-black tracking-tight" style={{ color: '#0d4a2f' }}>{c.value}</span>
              <span className="text-xs font-medium" style={{ color: 'rgba(13,74,47,0.45)' }}>{c.unit}</span>
            </div>

            {c.progress !== undefined ? (
              <>
                <div className="w-full h-1.5 rounded-full overflow-hidden mb-1"
                     style={{ background: 'rgba(13,74,47,0.10)' }}>
                  <div className="h-full rounded-full transition-all duration-700"
                       style={{ width: `${Math.min(c.progress,100)}%`, background: c.progress > 75 ? 'linear-gradient(90deg,#f59e0b,#dc2626)' : 'linear-gradient(90deg,#16a34a,#0d9488)' }} />
                </div>
                <p className="text-[11px]" style={{ color: 'rgba(13,74,47,0.45)' }}>
                  {c.progress < 50 ? 'Well managed' : c.progress < 75 ? 'Moderate load' : 'High — dispatch soon'}
                </p>
              </>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c.accent }} />
                <span className="text-[11px] font-semibold" style={{ color: c.accent }}>{c.sub}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AnalyticsCards;
