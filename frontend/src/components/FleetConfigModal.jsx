import React, { useState, useEffect } from 'react';
import { Settings, X, Save, RefreshCw } from 'lucide-react';
import { updateConfig } from '../services/api';

const FleetConfigModal = ({ isOpen, onClose, config, setConfig, onSaveSuccess }) => {
  const [formData, setFormData] = useState({
    van_capacity: 500.0,
    mileage_kmpl: 5.5,
    fuel_price: 95.0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (config) {
      setFormData({
        van_capacity: config.van_capacity ?? 500.0,
        mileage_kmpl: config.mileage_kmpl ?? 5.5,
        fuel_price: config.fuel_price ?? 95.0,
      });
    }
  }, [config]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: parseFloat(value) || 0,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const updated = await updateConfig(formData);
      setConfig(updated);
      onSaveSuccess();
      onClose();
    } catch (err) {
      setError('Failed to persist dynamic constraints. Verify network connectivity.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in text-left">
      <div className="glass-panel w-full max-w-md rounded-2xl overflow-hidden border border-slate-700 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-sm text-white">Dynamic Fleet Configuration</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4">
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Max Van Capacity (Liters)
            </label>
            <input
              type="number"
              step="0.1"
              name="van_capacity"
              value={formData.van_capacity}
              onChange={handleChange}
              required
              className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-cyan-500/50 transition-colors"
            />
            <span className="text-[10px] text-slate-500 block mt-1">
              Limits total volume calculated dynamically per route cluster.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Vehicle Mileage (km/L)
            </label>
            <input
              type="number"
              step="0.1"
              name="mileage_kmpl"
              value={formData.mileage_kmpl}
              onChange={handleChange}
              required
              className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-cyan-500/50 transition-colors"
            />
            <span className="text-[10px] text-slate-500 block mt-1">
              Used to calculate expected fuel burn metrics per route segment.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Fuel Price (₹/L)
            </label>
            <input
              type="number"
              step="0.1"
              name="fuel_price"
              value={formData.fuel_price}
              onChange={handleChange}
              required
              className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-cyan-500/50 transition-colors"
            />
            <span className="text-[10px] text-slate-500 block mt-1">
              Establishes aggregate cost minimization weights inside the CVRP optimizer.
            </span>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Applying...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Config</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FleetConfigModal;
