import React, { useState } from 'react';
import { Route, Sparkles, RefreshCw, AlertCircle, CheckCircle, Truck, Fuel, DollarSign } from 'lucide-react';
import { fetchOptimalRoute } from '../services/api';

const RoutePanel = ({ optimalRoute, setOptimalRoute, bins = [] }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerateRoute = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchOptimalRoute();
      // Backend now handles all VRP clustering and OSRM geometry fetching
      setOptimalRoute(data);
    } catch (err) {
      setError('Failed to compute VRP optimization route. Ensure backend microservice is operational.');
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
            Multi-Vehicle Routing Problem (VRP) &amp; Geographic K-Means Clustering
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
                <span>Generate Fleet Routes</span>
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
      {optimalRoute && optimalRoute.fleet_totals && (
        <div className="space-y-4 animate-fade-in">
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold flex items-center gap-1"><Truck className="w-3 h-3"/> Active Vans</span>
              <span className="font-bold text-white text-sm">{optimalRoute.fleet_totals.total_vans}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold flex items-center gap-1"><Route className="w-3 h-3"/> Total Distance</span>
              <span className="font-bold text-cyan-400 text-sm">{optimalRoute.fleet_totals.total_distance} km</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold flex items-center gap-1"><Fuel className="w-3 h-3"/> Total Fuel</span>
              <span className="font-bold text-rose-400 text-sm">{optimalRoute.fleet_totals.total_fuel} L</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold flex items-center gap-1"><DollarSign className="w-3 h-3"/> Est. Cost</span>
              <span className="font-bold text-emerald-400 text-sm">₹{optimalRoute.fleet_totals.total_cost}</span>
            </div>
            <div className="col-span-2 sm:col-span-4 mt-1 border-t border-slate-800/60 pt-2">
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Engine Message</span>
              <span className="font-medium text-emerald-400 text-[11px] block">
                {optimalRoute.message || 'VRP Tour Solved'}
              </span>
            </div>
          </div>

          {/* Sequential Timeline Sequence List per Van */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Fleet Dispatch Manifest
            </h3>
            
            {(!optimalRoute.fleet_routes || optimalRoute.fleet_routes.length === 0) ? (
              <div className="p-4 rounded-xl text-center text-xs text-slate-500 bg-slate-900/40 border border-slate-800/80">
                <CheckCircle className="w-5 h-5 mx-auto mb-1 text-emerald-500/80" />
                No bins qualify under target fill levels. Active smart bin fleet is completely balanced.
              </div>
            ) : (
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                {optimalRoute.fleet_routes.map((vanRoute) => (
                  <div key={`van-${vanRoute.van_id}`} className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80">
                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-800/50">
                       <span className="text-sm font-bold text-white flex items-center gap-2">
                         <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs">{vanRoute.van_id}</span>
                         Van Alpha-{vanRoute.van_id}
                       </span>
                       <span className="text-[10px] text-slate-400 text-right">
                         <span className="text-emerald-400 font-bold">{vanRoute.total_volume}L Load</span><br/>
                         {vanRoute.distance_km}km | {vanRoute.fuel_liters}L | ₹{vanRoute.cost_inr}
                       </span>
                    </div>
                    
                    <div className="space-y-2">
                      {vanRoute.details.map((step, idx) => (
                        <div 
                          key={`${step.bin_id}-${idx}`}
                          className="flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3.5">
                            <span className="w-5 h-5 rounded-lg bg-blue-500/10 border border-blue-500/20 font-mono text-[9px] font-bold text-blue-400 flex items-center justify-center shrink-0">
                              {step.step_order}
                            </span>
                            <div>
                              <p className="text-xs font-bold text-slate-200">{step.location || step.bin_id}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-right shrink-0">
                            <div>
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                step.priority === 3 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : step.priority === 2 ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-400'
                              }`}>
                                P{step.priority}
                              </span>
                            </div>
                            <div className="w-8">
                              <span className="text-xs font-bold text-slate-300">{step.fill_percentage}%</span>
                            </div>
                          </div>
                        </div>
                      ))}
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
