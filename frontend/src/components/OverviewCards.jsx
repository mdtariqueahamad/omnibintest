import React, { useMemo } from 'react';
import {
  Trash2, AlertTriangle, CheckCircle2, Truck,
  Leaf, Fuel, DollarSign, Route, Zap, BarChart3
} from 'lucide-react';

const OverviewCards = ({ bins, optimalRoute, config }) => {
  const stats = useMemo(() => {
    const total      = bins.length;
    const critical   = bins.filter(b => b.status === 'Critical').length;
    const needsColl  = bins.filter(b => b.status === 'Needs Collection').length;
    const healthy    = bins.filter(b => b.status === 'OK').length;
    const avgFill    = total > 0 ? Math.round(bins.reduce((a, b) => a + (b.fill_percentage || 0), 0) / total) : 0;
    const vans       = optimalRoute?.fleet_totals?.total_vans || 0;
    const routes     = optimalRoute?.fleet_routes?.length || 0;
    const totalDist  = optimalRoute?.fleet_totals?.total_distance || 0;
    const totalFuel  = optimalRoute?.fleet_totals?.total_fuel || 0;
    const totalCost  = optimalRoute?.fleet_totals?.total_cost || 0;
    const wasteKg    = bins.reduce((a, b) => a + ((b.fill_percentage || 0) / 100) * (b.capacity || 100), 0);
    const co2Saved   = +(wasteKg * 0.0021).toFixed(2);
    const fuelSaved  = totalDist > 0 ? +(totalDist * 0.12).toFixed(1) : 0;
    const govSavings = totalCost > 0 ? Math.round(totalCost * 0.18) : 0;

    return [
      { id:'total-bins',    label:'Total Smart Bins',     value: total,           unit:'',       icon: Trash2,      color:'#0d9488', bg:'rgba(13,148,136,0.10)',  border:'rgba(13,148,136,0.22)' },
      { id:'healthy-bins',  label:'Healthy Bins',         value: healthy,         unit:'bins',   icon: CheckCircle2,color:'#16a34a', bg:'rgba(22,163,74,0.10)',   border:'rgba(22,163,74,0.22)'  },
      { id:'critical-bins', label:'Critical Alerts',      value: critical,        unit:'bins',   icon: AlertTriangle,color:critical>0?'#dc2626':'#16a34a', bg:critical>0?'rgba(220,38,38,0.10)':'rgba(22,163,74,0.10)', border:critical>0?'rgba(220,38,38,0.22)':'rgba(22,163,74,0.22)', pulse: critical>0 },
      { id:'overflow',      label:'Overflow Pending',     value: needsColl,       unit:'bins',   icon: Zap,         color:'#d97706', bg:'rgba(217,119,6,0.10)',   border:'rgba(217,119,6,0.22)'  },
      { id:'waste-coll',    label:'Waste Mapped',         value:`${wasteKg.toFixed(0)}L`,unit:'',icon:BarChart3,   color:'#0d9488', bg:'rgba(13,148,136,0.10)',  border:'rgba(13,148,136,0.22)' },
      { id:'co2',           label:'CO₂ Prevented',        value:`${co2Saved}T`,   unit:'',       icon: Leaf,        color:'#16a34a', bg:'rgba(22,163,74,0.10)',   border:'rgba(22,163,74,0.22)'  },
      { id:'fuel-saved',    label:'Fuel Efficiency',      value:`${fuelSaved}L`,  unit:'saved',  icon: Fuel,        color:'#d97706', bg:'rgba(217,119,6,0.10)',   border:'rgba(217,119,6,0.22)'  },
      { id:'gov-savings',   label:'Govt. Cost Savings',   value:`₹${govSavings}`, unit:'',       icon: DollarSign,  color:'#059669', bg:'rgba(5,150,105,0.10)',   border:'rgba(5,150,105,0.22)'  },
      { id:'active-routes', label:'Active Routes',        value: routes,          unit:'routes', icon: Route,       color:'#0d9488', bg:'rgba(13,148,136,0.10)',  border:'rgba(13,148,136,0.22)' },
      { id:'vans-duty',     label:'Vans on Duty',         value: vans,            unit:'vans',   icon: Truck,       color:'#d97706', bg:'rgba(217,119,6,0.10)',   border:'rgba(217,119,6,0.22)'  },
    ];
  }, [bins, optimalRoute, config]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
      {stats.map(s => {
        const Icon = s.icon;
        return (
          <div key={s.id} id={`stat-${s.id}`}
               className="glass-card p-4 rounded-2xl text-left relative overflow-hidden">
            <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full pointer-events-none opacity-40"
                 style={{ background: `radial-gradient(circle, ${s.bg.replace('0.10','0.40')} 0%, transparent 70%)` }} />
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-3 ${s.pulse ? 'animate-pulse' : ''}`}
                 style={{ background: s.bg, border: `1px solid ${s.border}` }}>
              <Icon className="w-4 h-4" style={{ color: s.color }} />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-1"
               style={{ color: 'rgba(13,74,47,0.50)' }}>{s.label}</p>
            <p className="text-xl font-black leading-none" style={{ color: '#0d4a2f' }}>
              {s.value}
              {s.unit && <span className="text-[11px] font-semibold ml-1" style={{ color: 'rgba(13,74,47,0.45)' }}>{s.unit}</span>}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default OverviewCards;
