import React from 'react';
import { LayoutDashboard, MapPin, Route, History, Settings, Trash2, Sparkles } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, isConnected }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Live Overview', icon: LayoutDashboard },
    { id: 'map', label: 'Interactive Telemetry Map', icon: MapPin },
    { id: 'routes', label: 'TSP Optimal Routings', icon: Route },
    { id: 'history', label: 'Historical Audit Logs', icon: History },
  ];

  return (
    <aside className="w-64 glass-panel border-r border-slate-800 flex flex-col h-screen sticky top-0 z-30 shrink-0">
      {/* Premium Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3.5">
        <div className="p-2.5 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 rounded-xl shadow-lg shadow-emerald-500/10">
          <Trash2 className="w-5 h-5 text-slate-950 stroke-[2.5]" />
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            OmniBin
          </h1>
          <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
            <Sparkles className="w-3 h-3" /> AI Route Engine v1
          </p>
        </div>
      </div>

      {/* Navigation Buttons */}
      <nav className="flex-1 px-4 py-6 space-y-1.5">
        <p className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
          Main Views
        </p>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-left ${
                isActive
                  ? 'bg-slate-800/90 text-white shadow-sm border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Connection Indicator Footer */}
      <div className="p-3.5 m-4 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
          </span>
          <div className="text-left">
            <p className="text-xs font-semibold text-slate-300">FastAPI Gateway</p>
            <p className="text-[10px] text-slate-500">{isConnected ? 'Live Synchronized' : 'Polling Sync...'}</p>
          </div>
        </div>
        <Settings className="w-4 h-4 text-slate-500 cursor-pointer hover:text-slate-300 transition-colors shrink-0" />
      </div>
    </aside>
  );
};

export default Sidebar;
