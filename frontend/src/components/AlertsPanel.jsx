import React, { useMemo } from 'react';
import { AlertTriangle, AlertOctagon, Info, CheckCircle2, Clock } from 'lucide-react';

const AlertsPanel = ({ bins }) => {
  const alerts = useMemo(() => {
    const list = [];
    bins.forEach(b => {
      if (b.status === 'Critical') {
        list.push({
          id: `crit-${b.bin_id}`,
          level: 'critical',
          title: `Overflow Alert — ${b.location}`,
          sub: `${b.bin_id} · ${b.fill_percentage}% capacity — immediate dispatch required`,
          time: 'Live',
          icon: AlertOctagon,
          color: '#dc2626',
          bg: 'rgba(220,38,38,0.09)',
          border: 'rgba(220,38,38,0.22)',
        });
      } else if (b.status === 'Needs Collection') {
        list.push({
          id: `warn-${b.bin_id}`,
          level: 'warn',
          title: `Collection Needed — ${b.location}`,
          sub: `${b.bin_id} · ${b.fill_percentage}% — schedule pickup soon`,
          time: 'Live',
          icon: AlertTriangle,
          color: '#d97706',
          bg: 'rgba(217,119,6,0.09)',
          border: 'rgba(217,119,6,0.22)',
        });
      }
    });
    if (list.length === 0) {
      list.push({
        id: 'all-ok',
        level: 'ok',
        title: 'All Systems Operational',
        sub: 'No critical bins or overflow alerts detected at this time.',
        time: 'Now',
        icon: CheckCircle2,
        color: '#16a34a',
        bg: 'rgba(22,163,74,0.09)',
        border: 'rgba(22,163,74,0.22)',
      });
    }
    return list.slice(0, 6);
  }, [bins]);

  return (
    <div className="glass-panel rounded-2xl p-4 text-left h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-black uppercase tracking-widest"
           style={{ color: 'rgba(13,74,47,0.50)' }}>Live Alerts</p>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: alerts[0]?.level === 'ok' ? 'rgba(22,163,74,0.12)' : 'rgba(220,38,38,0.12)',
                       color: alerts[0]?.level === 'ok' ? '#16a34a' : '#dc2626',
                       border: alerts[0]?.level === 'ok' ? '1px solid rgba(22,163,74,0.25)' : '1px solid rgba(220,38,38,0.25)' }}>
          {alerts.filter(a => a.level === 'critical').length} Critical
        </span>
      </div>
      <div className="space-y-2 overflow-y-auto flex-1">
        {alerts.map(a => {
          const Icon = a.icon;
          return (
            <div key={a.id} className="flex items-start gap-2.5 p-2.5 rounded-xl"
                 style={{ background: a.bg, border: `1px solid ${a.border}` }}>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${a.level === 'critical' ? 'animate-pulse' : ''}`}
                   style={{ background: a.bg }}>
                <Icon className="w-3.5 h-3.5" style={{ color: a.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate" style={{ color: '#0d4a2f' }}>{a.title}</p>
                <p className="text-[10px] mt-0.5 leading-snug" style={{ color: 'rgba(13,74,47,0.55)' }}>{a.sub}</p>
              </div>
              <span className="text-[9px] font-semibold shrink-0 flex items-center gap-0.5 mt-0.5"
                    style={{ color: 'rgba(13,74,47,0.40)' }}>
                <Clock className="w-2.5 h-2.5" />{a.time}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AlertsPanel;
