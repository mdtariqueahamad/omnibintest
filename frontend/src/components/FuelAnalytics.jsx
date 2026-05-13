import React, { useMemo } from 'react';
import { Fuel, Route, TrendingUp, Truck, Gauge } from 'lucide-react';

const FuelAnalytics = ({ optimalRoute, config }) => {
  const data = useMemo(() => {
    const dist  = optimalRoute?.fleet_totals?.total_distance || 0;
    const fuel  = optimalRoute?.fleet_totals?.total_fuel || 0;
    const cost  = optimalRoute?.fleet_totals?.total_cost || 0;
    const vans  = optimalRoute?.fleet_totals?.total_vans || 0;
    const price = config?.fuel_price || 95;
    const mile  = config?.mileage_kmpl || 5.5;
    const cap   = config?.van_capacity || 500;
    const fuelEff = dist > 0 ? +(dist / (fuel || 1)).toFixed(1) : mile;
    const savings = +(cost * 0.18).toFixed(0);
    return { dist, fuel, cost, vans, price, mile, cap, fuelEff, savings };
  }, [optimalRoute, config]);

  const rows = [
    { label: 'Total Distance',        value: `${data.dist} km`,      icon: Route,    color: '#0d9488' },
    { label: 'Fuel Consumed',         value: `${data.fuel} L`,       icon: Fuel,     color: '#d97706' },
    { label: 'Route Cost (INR)',       value: `₹${data.cost}`,        icon: TrendingUp,color:'#dc2626' },
    { label: 'Vans Dispatched',       value: data.vans,              icon: Truck,    color: '#7c3aed' },
    { label: 'Fuel Price Config',     value: `₹${data.price}/L`,     icon: Fuel,     color: '#d97706' },
    { label: 'Mileage Config',        value: `${data.mile} km/L`,    icon: Gauge,    color: '#0d9488' },
    { label: 'Van Capacity Config',   value: `${data.cap} L`,        icon: Truck,    color: '#16a34a' },
    { label: 'Fuel Efficiency (act)', value: `${data.fuelEff} km/L`, icon: Gauge,    color: '#059669' },
    { label: 'Govt. Cost Savings',    value: `₹${data.savings}`,     icon: TrendingUp,color:'#16a34a' },
  ];

  return (
    <div className="glass-panel rounded-2xl p-4 text-left">
      <p className="text-[10px] font-black uppercase tracking-widest mb-3"
         style={{ color: 'rgba(13,74,47,0.50)' }}>Vehicle & Fuel Analytics</p>
      {!optimalRoute ? (
        <p className="text-xs italic py-4 text-center" style={{ color: 'rgba(13,74,47,0.35)' }}>
          Generate routes first to see fuel analytics
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {rows.map(r => {
            const Icon = r.icon;
            return (
              <div key={r.label} className="flex items-center gap-2.5 p-2.5 rounded-xl"
                   style={{ background: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.60)' }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                     style={{ background: `${r.color}18`, border: `1px solid ${r.color}30` }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: r.color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-wide"
                     style={{ color: 'rgba(13,74,47,0.45)' }}>{r.label}</p>
                  <p className="text-sm font-black" style={{ color: '#0d4a2f' }}>{r.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FuelAnalytics;
