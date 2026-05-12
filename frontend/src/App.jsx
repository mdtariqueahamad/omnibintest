import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import AnalyticsCards from './components/AnalyticsCards';
import MapView from './components/MapView';
import RoutePanel from './components/RoutePanel';
import { fetchBins, fetchBinHistory, seedBins } from './services/api';
import { Sparkles, X, Activity, Server } from 'lucide-react';

function App() {
  const [bins, setBins] = useState([]);
  const [optimalRoute, setOptimalRoute] = useState(null);
  const [selectedBin, setSelectedBin] = useState(null);
  const [binHistory, setBinHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isConnected, setIsConnected] = useState(true);
  const [seeding, setSeeding] = useState(false);

  // Background polling interval checking /api/bins status every 5 seconds
  useEffect(() => {
    const loadBinsData = async () => {
      try {
        const data = await fetchBins();
        setBins(data);
        setIsConnected(true);
      } catch (err) {
        setIsConnected(false);
      }
    };

    // Execute first instant call
    loadBinsData();

    // Trigger interval loop
    const interval = setInterval(loadBinsData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Monitor selected node interactions to trigger secondary log loads
  useEffect(() => {
    if (!selectedBin) {
      setBinHistory(null);
      return;
    }

    const loadHistory = async () => {
      setHistoryLoading(true);
      try {
        const data = await fetchBinHistory(selectedBin.bin_id);
        setBinHistory(data?.history || []);
      } catch (err) {
        setBinHistory([]);
      } finally {
        setHistoryLoading(false);
      }
    };

    loadHistory();
  }, [selectedBin]);

  // Seed sample database nodes utility hook
  const handleSeedDatabase = async () => {
    setSeeding(true);
    try {
      const seeded = await seedBins();
      setBins(seeded);
    } catch (err) {
      console.error(err);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0b0f19] text-slate-100 selection:bg-cyan-500 selection:text-slate-950">
      {/* Decoupled Side Navigation Layout */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isConnected={isConnected} />

      {/* Main Orchestrator Canvas Workspace */}
      <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
        {/* Helper Banner for clean out-of-the-box demonstration deployment */}
        {bins.length === 0 && isConnected && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-blue-950/60 via-slate-900/80 to-slate-950 border border-blue-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 glass-card">
            <div className="flex items-center gap-3.5 text-left">
              <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400 shrink-0">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Zero Active Nodes Monitored</h3>
                <p className="text-xs text-slate-400 mt-0.5">Click below to automatically populate simulated SF smart container mock parameters.</p>
              </div>
            </div>
            <button
              onClick={handleSeedDatabase}
              disabled={seeding}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-blue-500/20 shrink-0 flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {seeding ? 'Seeding Gateway...' : 'Seed Testing Fleet'}
            </button>
          </div>
        )}

        {/* Live Active Overview Matrix Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header branding block */}
            <div className="text-left mb-2">
              <h1 className="text-2xl font-black text-white tracking-tight">Fleet Real-Time Core</h1>
              <p className="text-xs text-slate-400 mt-0.5">Automated telemetry streams mapping continuous live ESP32 status updates</p>
            </div>

            {/* Status Analytics summary layers */}
            <AnalyticsCards bins={bins} />

            {/* Split workspace view layout: Left canvas for Maps, Right panel for route management */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <MapView bins={bins} optimalRoute={optimalRoute} setSelectedBin={setSelectedBin} />
              </div>
              <div className="lg:col-span-1 flex flex-col gap-6">
                <RoutePanel optimalRoute={optimalRoute} setOptimalRoute={setOptimalRoute} bins={bins} />
                
                {/* Instant focus alert block mapping critical state hubs */}
                <div className="glass-panel rounded-2xl p-4 border border-slate-800 text-left flex-1 flex flex-col">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-rose-500 animate-pulse" /> Urgent Outage Hubs
                  </h3>
                  {bins.filter(b => b.status === 'Critical').length === 0 ? (
                    <div className="text-xs text-slate-500 italic p-4 bg-slate-900/40 rounded-xl border border-slate-800/50 text-center flex-1 flex items-center justify-center">
                      Zero hardware capacity overflows logged.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1.5">
                      {bins.filter(b => b.status === 'Critical').map(b => (
                        <div key={b.bin_id} onClick={() => setSelectedBin(b)} className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between cursor-pointer hover:bg-rose-500/15 transition-all">
                          <div className="truncate pr-2">
                            <p className="text-xs font-bold text-white truncate">{b.location}</p>
                            <p className="text-[9px] text-rose-400 font-mono">{b.bin_id}</p>
                          </div>
                          <span className="text-xs font-black text-rose-400 bg-rose-500/20 px-1.5 py-0.5 rounded shrink-0">
                            {b.fill_percentage}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Fullscreen interactive Map interface */}
        {activeTab === 'map' && (
          <div className="space-y-4 animate-fade-in text-left">
            <div>
              <h2 className="text-xl font-bold text-white">Expanded Cartography Matrix</h2>
              <p className="text-xs text-slate-400">Click container markers to analyze volume properties and active priority rules</p>
            </div>
            <MapView bins={bins} optimalRoute={optimalRoute} setSelectedBin={setSelectedBin} />
          </div>
        )}

        {/* Dedicated Combinatorial Routing view */}
        {activeTab === 'routes' && (
          <div className="space-y-6 animate-fade-in text-left max-w-2xl mx-auto">
            <div>
              <h2 className="text-xl font-bold text-white">NetworkX Optimizer Sandbox</h2>
              <p className="text-xs text-slate-400">Evaluate dynamic edge limits and shortest metrics calculated from the depot</p>
            </div>
            <RoutePanel optimalRoute={optimalRoute} setOptimalRoute={setOptimalRoute} bins={bins} />
          </div>
        )}

        {/* Central Analytics time-series list preview */}
        {activeTab === 'history' && (
          <div className="space-y-4 animate-fade-in text-left">
            <div>
              <h2 className="text-xl font-bold text-white">Telemetry Database Audit Logs</h2>
              <p className="text-xs text-slate-400">Historical records of device payload syncs persisted asynchronously into MongoDB</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bins.map((b) => (
                <div key={b.bin_id} onClick={() => setSelectedBin(b)} className="glass-card p-4 rounded-xl cursor-pointer hover:border-blue-500/40 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm text-white">{b.location}</p>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">Node: {b.bin_id}</p>
                  </div>
                  <span className="text-xs font-semibold text-blue-400 underline shrink-0">Inspect Timeline &rarr;</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Analytics Drilldown Interactive Overlays Modal */}
      {selectedBin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-lg rounded-2xl overflow-hidden border border-slate-700 shadow-2xl text-left flex flex-col max-h-[85vh]">
            {/* Modal header banner */}
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-wider block">IoT Sensor Logbook</span>
                <h3 className="font-bold text-sm text-white">{selectedBin.location}</h3>
              </div>
              <button onClick={() => setSelectedBin(null)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal internal metrics */}
            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-3 gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 text-center text-xs">
                <div>
                  <span className="text-[9px] text-slate-500 block">Current Saturation</span>
                  <span className="font-extrabold text-white">{selectedBin.fill_percentage}%</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 block">Dispatch Level</span>
                  <span className="font-extrabold text-white">Tier {selectedBin.priority}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 block">Status State</span>
                  <span className={`font-bold text-[11px] ${selectedBin.status === 'Critical' ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                    {selectedBin.status}
                  </span>
                </div>
              </div>

              {/* Log Timeline block */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 mb-2.5 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-blue-400" /> Historic Storage Logs
                </h4>
                
                {historyLoading ? (
                  <div className="p-8 text-center text-xs text-slate-500 italic">
                    Retrieving time-series bounds from database...
                  </div>
                ) : binHistory && binHistory.length > 0 ? (
                  <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1.5">
                    {binHistory.map((item, index) => {
                      const d = new Date(item.timestamp);
                      const timeFormatted = isNaN(d.getTime()) ? item.timestamp : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                      const dateFormatted = isNaN(d.getTime()) ? '' : d.toLocaleDateString([], { month: 'short', day: 'numeric' });

                      return (
                        <div key={index} className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/80 flex items-center justify-between text-xs">
                          <div className="text-left pr-2">
                            <span className="font-mono text-[10px] text-slate-300 block">{timeFormatted}</span>
                            <span className="text-[9px] text-slate-500 block">{dateFormatted}</span>
                          </div>
                          
                          {/* Progress volume indicator */}
                          <div className="flex items-center gap-2.5 w-32 justify-end shrink-0">
                            <div className="w-16 bg-slate-800 rounded-full h-1 overflow-hidden">
                              <div className={`h-full rounded-full ${item.fill_percentage > 80 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(item.fill_percentage, 100)}%` }}></div>
                            </div>
                            <span className="font-bold text-slate-100 text-right w-8">{item.fill_percentage}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-600 italic p-4 text-center bg-slate-900/30 rounded-xl">
                    Zero timeline archives saved for this hardware token.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
