import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';

// Generate dynamic custom colored HTML markers matching fill status thresholds
const getCustomIcon = (fillPercentage, isDepot = false) => {
  if (isDepot) {
    return L.divIcon({
      className: 'custom-div-icon',
      html: `<div class="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-700 border-2 border-white rounded-xl flex items-center justify-center shadow-xl shadow-blue-500/30">
               <span class="text-[9px] font-extrabold text-white tracking-tighter">DEPOT</span>
             </div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });
  }

  let colorClass = 'bg-emerald-500 shadow-emerald-500/40';
  let pulseClass = 'bg-emerald-400';
  
  if (fillPercentage > 80) {
    colorClass = 'bg-rose-500 shadow-rose-500/50 animate-pulse';
    pulseClass = 'bg-rose-400';
  } else if (fillPercentage >= 50) {
    colorClass = 'bg-amber-500 shadow-amber-500/40';
    pulseClass = 'bg-amber-400';
  }

  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="relative flex items-center justify-center">
             <span class="absolute inline-flex h-5 w-5 rounded-full ${pulseClass} opacity-50 animate-ping"></span>
             <div class="w-4 h-4 ${colorClass} border-[1.5px] border-white rounded-full shadow-md flex items-center justify-center">
               <span class="sr-only">${fillPercentage}%</span>
             </div>
           </div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
};

const MapView = ({ bins, optimalRoute, setSelectedBin }) => {
  // Center map focused around simulated fleet coordinates
  const centerPosition = [37.7749, -122.4194];

  // Map routing sequence string identifiers back to explicit latitude/longitude arrays for Leaflet polylines
  const polylinePositions = optimalRoute?.route?.map((id) => {
    if (id === 'depot') return [37.7700, -122.4100];
    const target = bins.find((b) => b.bin_id === id);
    if (target && target.latitude && target.longitude) {
      return [target.latitude, target.longitude];
    }
    return null;
  }).filter(Boolean);

  return (
    <div className="w-full h-[520px] rounded-2xl overflow-hidden glass-panel border border-slate-800 relative z-10 shadow-2xl">
      <MapContainer 
        center={centerPosition} 
        zoom={13} 
        scrollWheelZoom={true} 
        style={{ width: '100%', height: '100%', background: '#0b0f19' }}
      >
        {/* Beautiful high-contrast clean tiles optimal for dark background dashboards */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {/* Central Fleet Collection Depot Static Marker */}
        <Marker position={[37.7700, -122.4100]} icon={getCustomIcon(0, true)}>
          <Popup>
            <div className="p-1 text-slate-900 font-sans text-left">
              <p className="font-bold text-xs text-slate-900">Central Collection Depot</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Origin staging area for dispatch collection fleets</p>
            </div>
          </Popup>
        </Marker>

        {/* Real-time Dynamic IoT Dustbin Node Markers */}
        {bins.map((bin) => {
          const lat = bin.latitude;
          const lng = bin.longitude;
          if (!lat || !lng) return null;

          return (
            <Marker 
              key={bin.bin_id} 
              position={[lat, lng]} 
              icon={getCustomIcon(bin.fill_percentage || 0)}
              eventHandlers={{
                click: () => setSelectedBin(bin),
              }}
            >
              <Popup>
                <div className="p-1 text-slate-900 font-sans text-left min-w-[150px]">
                  <p className="font-bold text-xs border-b border-slate-100 pb-1 mb-1.5 flex items-center justify-between gap-2">
                    <span className="truncate">{bin.location}</span>
                    <span className="text-[8px] uppercase px-1 py-0.2 rounded bg-slate-100 text-slate-600 font-mono shrink-0">
                      {bin.bin_id}
                    </span>
                  </p>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Current Load:</span>
                      <span className="font-bold text-slate-900">{bin.fill_percentage}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Max Capacity:</span>
                      <span className="font-medium text-slate-700">{bin.capacity}L</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Priority Tier:</span>
                      <span className="font-medium text-slate-700">Level {bin.priority}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1.5 mt-1.5 border-t border-slate-100">
                      <span className="text-slate-500">Sensor State:</span>
                      <span className={`font-bold text-[10px] ${
                        bin.status === 'Critical' ? 'text-rose-600 animate-pulse' : bin.status === 'Needs Collection' ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                        {bin.status}
                      </span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Calculated OSRM Road-Snapped or Straight-Line TSP Path Overlay */}
        {optimalRoute?.roadGeometry && optimalRoute.roadGeometry.length > 1 ? (
          <Polyline 
            positions={optimalRoute.roadGeometry} 
            pathOptions={{ 
              color: '#2563eb', 
              weight: 6, 
              opacity: 0.75, 
              lineCap: 'round',
              lineJoin: 'round'
            }} 
          />
        ) : polylinePositions && polylinePositions.length > 1 && (
          <Polyline 
            positions={polylinePositions} 
            pathOptions={{ 
              color: '#0284c7', 
              weight: 4.5, 
              opacity: 0.9, 
              dashArray: '8, 8',
              lineCap: 'round',
              lineJoin: 'round'
            }} 
          />
        )}
      </MapContainer>
      
      {/* Aesthetic integrated Status Legend container */}
      <div className="absolute bottom-3 left-3 z-[400] glass-card p-2 rounded-xl border border-slate-700/60 text-[10px] flex items-center gap-2.5 bg-slate-900/90 text-slate-300">
        <span className="font-semibold text-slate-400">Map Fill Levels:</span>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
          <span>&lt;50%</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
          <span>50-80%</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-rose-500 inline-block animate-pulse"></span>
          <span>&gt;80% Critical</span>
        </div>
      </div>
    </div>
  );
};

export default MapView;
