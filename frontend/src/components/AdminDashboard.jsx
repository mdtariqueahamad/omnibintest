import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import AnalyticsCards from './AnalyticsCards';
import MapView from './MapView';
import RoutePanel from './RoutePanel';
import AIChatWidget from './AIChatWidget';
import FleetConfigModal from './FleetConfigModal';
import { fetchBins, fetchBinHistory, seedBins, randomizeBins, fetchOptimalRoute, fetchConfig } from '../services/api';
import { Sparkles, X, Activity, Server, Dices, Filter, Settings, Leaf, Recycle } from 'lucide-react';

function AdminDashboard() {
  const [bins,              setBins]              = useState([]);
  const [optimalRoute,      setOptimalRoute]      = useState(null);
  const [selectedBin,       setSelectedBin]       = useState(null);
  const [binHistory,        setBinHistory]        = useState(null);
  const [historyLoading,    setHistoryLoading]    = useState(false);
  const [activeTab,         setActiveTab]         = useState('dashboard');
  const [isConnected,       setIsConnected]       = useState(true);
  const [seeding,           setSeeding]           = useState(false);
  const [randomizing,       setRandomizing]       = useState(false);
  const [selectedVan,       setSelectedVan]       = useState('ALL');
  const [config,            setConfig]            = useState(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // ── Polling ──────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try { setBins(await fetchBins()); setIsConnected(true); }
      catch { setIsConnected(false); }
    };
    load();
    fetchConfig().then(setConfig).catch(console.error);
    const iv = setInterval(load, 5000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (!selectedBin) { setBinHistory(null); return; }
    const load = async () => {
      setHistoryLoading(true);
      try { setBinHistory((await fetchBinHistory(selectedBin.bin_id))?.history || []); }
      catch { setBinHistory([]); }
      finally { setHistoryLoading(false); }
    };
    load();
  }, [selectedBin]);

  // ── Actions ──────────────────────────────────────────────────────
  const handleSeed = async () => {
    setSeeding(true);
    try { setBins(await seedBins()); }
    catch (e) { console.error(e); }
    finally { setSeeding(false); }
  };

  const handleRandomize = async () => {
    setRandomizing(true);
    try {
      await randomizeBins();
      setBins(await fetchBins());
      setOptimalRoute(await fetchOptimalRoute());
      setSelectedVan('ALL');
    } catch (e) { console.error(e); }
    finally { setRandomizing(false); }
  };

  const handleConfigSaved = async () => {
    try { setOptimalRoute(await fetchOptimalRoute()); setSelectedVan('ALL'); }
    catch (e) { console.error(e); }
  };

  // ── Status colour helpers ─────────────────────────────────────────
  const statusChip = s => {
    if (s === 'Critical')         return 'chip-critical';
    if (s === 'Needs Collection') return 'chip-warn';
    return 'chip-ok';
  };

  // ── Page title section ────────────────────────────────────────────
  const PageHeader = ({ title, sub }) => (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-1">
        <Leaf className="w-3.5 h-3.5" style={{ color: '#16a34a' }} />
        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#16a34a' }}>
          Live Intelligence
        </span>
      </div>
      <h1 className="text-2xl font-black" style={{ color: '#0d4a2f' }}>{title}</h1>
      <p className="text-xs mt-0.5" style={{ color: 'rgba(13,74,47,0.50)' }}>{sub}</p>
    </div>
  );

  return (
    <div className="flex min-h-screen relative">
      {/* Nature background fixed layer */}
      <div className="nature-bg" />

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isConnected={isConnected} />

      <main className="flex-1 p-5 lg:p-7 overflow-y-auto relative z-10">

        {/* ── Zero-bins banner ─────────────────────────────────── */}
        {bins.length === 0 && isConnected && (
          <div className="mb-5 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in glass-card">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                   style={{ background:'rgba(13,148,136,0.12)', border:'1px solid rgba(13,148,136,0.25)' }}>
                <Server className="w-5 h-5" style={{ color:'#0d9488' }} />
              </div>
              <div>
                <h3 className="font-bold text-sm" style={{ color:'#0d4a2f' }}>Zero Active Nodes</h3>
                <p className="text-xs mt-0.5" style={{ color:'rgba(13,74,47,0.50)' }}>
                  Seed the database to populate test bins and get started.
                </p>
              </div>
            </div>
            <button id="seed-database-btn" onClick={handleSeed} disabled={seeding}
                    className="btn-primary shrink-0 rounded-xl py-2.5 px-4 text-xs">
              <Sparkles className="w-3.5 h-3.5" />
              {seeding ? 'Seeding...' : 'Seed Testing Fleet'}
            </button>
          </div>
        )}

        {/* ── DASHBOARD tab ────────────────────────────────────── */}
        {activeTab === 'dashboard' && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <PageHeader
                title="Fleet Real-Time Core"
                sub="Live ESP32 telemetry streams — automated bin-level monitoring"
              />
              {/* Controls */}
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Van filter */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl glass-card">
                  <Filter className="w-3.5 h-3.5" style={{ color:'rgba(13,74,47,0.45)' }} />
                  <select
                    id="van-filter"
                    value={selectedVan}
                    onChange={e => setSelectedVan(e.target.value)}
                    className="bg-transparent text-xs font-bold outline-none cursor-pointer min-w-[110px]"
                    style={{ color:'#0d4a2f' }}
                  >
                    <option value="ALL">Show All Fleet</option>
                    {optimalRoute?.fleet_routes?.map(r => (
                      <option key={r.van_id} value={r.van_id.toString()}>Van {r.van_id}</option>
                    ))}
                  </select>
                </div>

                <button id="randomize-btn" onClick={handleRandomize} disabled={randomizing}
                        className="btn-glass rounded-xl text-xs">
                  <Dices className={`w-3.5 h-3.5 ${randomizing ? 'animate-spin' : ''}`}
                         style={{ color:'#d97706' }} />
                  {randomizing ? 'Simulating...' : 'Randomize Fill'}
                </button>

                <button id="fleet-config-btn"
                        onClick={() => setIsConfigModalOpen(true)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all glass-card hover:scale-105"
                        title="Fleet Configuration">
                  <Settings className="w-4 h-4" style={{ color:'#0d9488' }} />
                </button>
              </div>
            </div>

            <AnalyticsCards bins={bins} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2">
                <MapView bins={bins} optimalRoute={optimalRoute} setSelectedBin={setSelectedBin} selectedVan={selectedVan} />
              </div>
              <div className="lg:col-span-1 flex flex-col gap-5">
                <RoutePanel optimalRoute={optimalRoute} setOptimalRoute={setOptimalRoute} bins={bins} />

                {/* Critical hubs panel */}
                <div className="glass-panel rounded-2xl p-4 text-left flex flex-col">
                  <h3 className="text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2"
                      style={{ color:'rgba(13,74,47,0.50)' }}>
                    <Activity className="w-3.5 h-3.5 animate-pulse" style={{ color:'#dc2626' }} />
                    Urgent Outage Hubs
                  </h3>
                  {bins.filter(b => b.status === 'Critical').length === 0 ? (
                    <div className="flex-1 flex items-center justify-center py-5 rounded-xl text-center"
                         style={{ background:'rgba(22,163,74,0.06)', border:'1px solid rgba(22,163,74,0.16)' }}>
                      <p className="text-xs" style={{ color:'rgba(13,74,47,0.45)' }}>
                        ✓ No overflows detected
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                      {bins.filter(b => b.status === 'Critical').map(b => (
                        <div key={b.bin_id} onClick={() => setSelectedBin(b)}
                             className="p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01]"
                             style={{ background:'rgba(254,226,226,0.50)', border:'1px solid rgba(239,68,68,0.20)' }}>
                          <div className="truncate pr-2">
                            <p className="text-xs font-bold truncate" style={{ color:'#7f1d1d' }}>{b.location}</p>
                            <p className="text-[9px] font-mono" style={{ color:'rgba(127,29,29,0.60)' }}>{b.bin_id}</p>
                          </div>
                          <span className="chip-critical shrink-0">{b.fill_percentage}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── MAP tab ──────────────────────────────────────────── */}
        {activeTab === 'map' && (
          <div className="space-y-4 animate-fade-in">
            <PageHeader title="Expanded Cartography Matrix" sub="Click container markers to analyze volume properties" />
            <MapView bins={bins} optimalRoute={optimalRoute} setSelectedBin={setSelectedBin} selectedVan={selectedVan} />
          </div>
        )}

        {/* ── ROUTES tab ───────────────────────────────────────── */}
        {activeTab === 'routes' && (
          <div className="space-y-5 animate-fade-in max-w-2xl mx-auto">
            <PageHeader title="NetworkX Optimizer Sandbox" sub="Evaluate dynamic edge limits and shortest-path metrics from the depot" />
            <RoutePanel optimalRoute={optimalRoute} setOptimalRoute={setOptimalRoute} bins={bins} />
          </div>
        )}

        {/* ── HISTORY tab ─────────────────────────────────────── */}
        {activeTab === 'history' && (
          <div className="space-y-4 animate-fade-in">
            <PageHeader title="Telemetry Audit Logs" sub="Historical records asynchronously persisted to MongoDB" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {bins.map(b => (
                <div key={b.bin_id} onClick={() => setSelectedBin(b)}
                     className="glass-card p-4 rounded-xl cursor-pointer flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm" style={{ color:'#0d4a2f' }}>{b.location}</p>
                    <p className="text-xs font-mono mt-0.5" style={{ color:'rgba(13,74,47,0.45)' }}>Node: {b.bin_id}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={statusChip(b.status)}>{b.status}</span>
                    <span className="text-xs font-semibold" style={{ color:'#0d9488' }}>View →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ── Bin detail modal ──────────────────────────────────── */}
      {selectedBin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
             style={{ background:'rgba(13,74,47,0.30)', backdropFilter:'blur(10px)' }}>
          <div className="glass-panel w-full max-w-lg rounded-3xl overflow-hidden flex flex-col max-h-[85vh] animate-scale-in"
               style={{ boxShadow:'0 24px 80px rgba(13,74,47,0.20)' }}>
            {/* Modal header */}
            <div className="px-5 py-4 flex items-center justify-between shrink-0"
                 style={{ borderBottom:'1px solid rgba(255,255,255,0.45)', background:'rgba(255,255,255,0.20)' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                     style={{ background:'rgba(22,163,74,0.12)', border:'1px solid rgba(22,163,74,0.25)' }}>
                  <Recycle className="w-4 h-4" style={{ color:'#16a34a' }} />
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest" style={{ color:'#0d9488' }}>IoT Sensor Logbook</span>
                  <h3 className="font-bold text-sm" style={{ color:'#0d4a2f' }}>{selectedBin.location}</h3>
                </div>
              </div>
              <button id="close-bin-modal" onClick={() => setSelectedBin(null)}
                      className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/50 transition-colors"
                      style={{ color:'rgba(13,74,47,0.50)' }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-xl text-center"
                   style={{ background:'rgba(255,255,255,0.50)', border:'1px solid rgba(255,255,255,0.65)' }}>
                {[
                  { label:'Saturation',    value:`${selectedBin.fill_percentage}%`, color:'#0d4a2f' },
                  { label:'Priority Tier', value:`Tier ${selectedBin.priority}`,    color:'#0d9488' },
                  { label:'Status',        value:selectedBin.status, color: selectedBin.status==='Critical' ? '#dc2626' : '#16a34a' },
                ].map(m => (
                  <div key={m.label}>
                    <span className="text-[9px] block mb-1" style={{ color:'rgba(13,74,47,0.40)' }}>{m.label}</span>
                    <span className="font-black text-sm" style={{ color:m.color }}>{m.value}</span>
                  </div>
                ))}
              </div>

              {/* Fill bar */}
              <div className="w-full h-2 rounded-full overflow-hidden"
                   style={{ background:'rgba(13,74,47,0.10)' }}>
                <div className="h-full rounded-full transition-all duration-700"
                     style={{
                       width:`${Math.min(selectedBin.fill_percentage,100)}%`,
                       background: selectedBin.fill_percentage > 80
                         ? 'linear-gradient(90deg,#f59e0b,#dc2626)'
                         : 'linear-gradient(90deg,#16a34a,#0d9488)'
                     }} />
              </div>

              {/* Log timeline */}
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-1.5"
                    style={{ color:'rgba(13,74,47,0.50)' }}>
                  <Activity className="w-3.5 h-3.5" style={{ color:'#0d9488' }} />
                  Historical Storage Logs
                </h4>
                {historyLoading ? (
                  <p className="py-6 text-center text-xs italic" style={{ color:'rgba(13,74,47,0.40)' }}>
                    Loading time-series data...
                  </p>
                ) : binHistory?.length > 0 ? (
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {binHistory.map((item, i) => {
                      const d    = new Date(item.timestamp);
                      const time = isNaN(d.getTime()) ? item.timestamp : d.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit', second:'2-digit' });
                      const date = isNaN(d.getTime()) ? '' : d.toLocaleDateString([], { month:'short', day:'numeric' });
                      return (
                        <div key={i} className="p-2.5 rounded-xl flex items-center justify-between text-xs"
                             style={{ background:'rgba(255,255,255,0.48)', border:'1px solid rgba(255,255,255,0.65)' }}>
                          <div>
                            <span className="font-mono text-[10px] block" style={{ color:'#0d4a2f' }}>{time}</span>
                            <span className="text-[9px]" style={{ color:'rgba(13,74,47,0.45)' }}>{date}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="w-16 h-1.5 rounded-full overflow-hidden"
                                 style={{ background:'rgba(13,74,47,0.10)' }}>
                              <div className="h-full rounded-full"
                                   style={{ width:`${Math.min(item.fill_percentage,100)}%`,
                                            background: item.fill_percentage > 80 ? '#dc2626' : '#16a34a' }} />
                            </div>
                            <span className="font-bold w-8 text-right" style={{ color:'#0d4a2f' }}>
                              {item.fill_percentage}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs italic py-4 text-center" style={{ color:'rgba(13,74,47,0.35)' }}>
                    No archive records for this hardware token.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <AIChatWidget />
      <FleetConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        config={config}
        setConfig={setConfig}
        onSaveSuccess={handleConfigSaved}
      />
    </div>
  );
}

export default AdminDashboard;
