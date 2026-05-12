import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

// Dynamic auto-bounds updater adjusting viewports perfectly around valid generated itineraries
const BoundsUpdater = ({ optimalRoute }) => {
  const map = useMap();

  useEffect(() => {
    if (optimalRoute?.roadGeometry && optimalRoute.roadGeometry.length > 1) {
      map.fitBounds(optimalRoute.roadGeometry, { padding: [40, 40], maxZoom: 15 });
    } else {
      // Default bounds focusing cleanly over Bhopal municipal boundaries
      map.fitBounds([
        [23.2244, 77.4027],
        [23.2524, 77.5404]
      ], { padding: [50, 50], maxZoom: 14 });
    }
  }, [map, optimalRoute]);

  return null;
};

// Permanent distinct icon styling for the Starting Municipal Building Depot
const getStartIcon = () => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="px-2.5 py-1 bg-blue-600 border-2 border-white rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/40">
             <span class="text-[10px] font-extrabold text-white whitespace-nowrap">Start: Nagar Nigam</span>
           </div>`,
    iconSize: [110, 26],
    iconAnchor: [55, 13],
  });
};

// Permanent distinct icon styling for the Ending Solid Waste Dump Site
const getEndIcon = () => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="px-2.5 py-1 bg-slate-950 border-2 border-white rounded-lg flex items-center justify-center shadow-lg shadow-slate-950/50">
             <span class="text-[10px] font-extrabold text-white whitespace-nowrap">End: Waste Facility</span>
           </div>`,
    iconSize: [110, 26],
    iconAnchor: [55, 13],
  });
};

// Generate dynamic custom colored HTML markers matching fill status thresholds
const getCustomIcon = (fillPercentage) => {
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
  // Center map focused around localized Bhopal coordinates initially
  const centerPosition = [23.2360, 77.4700];

  // Straight line segments fallback logic mapping active nodes
  const polylinePositions = optimalRoute?.route?.map((id) => {
    if (id === 'depot') return [23.2244, 77.4027];
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
        <BoundsUpdater optimalRoute={optimalRoute} />

        {/* Beautiful high-contrast clean tiles optimal for dark background dashboards */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {/* Permanent Starting Depot Marker: Bhopal Nagar Nigam Building */}
        <Marker position={[23.2244, 77.4027]} icon={getStartIcon()}>
          <Popup>
            <div className="p-1 text-slate-900 font-sans text-left">
              <p className="font-bold text-xs text-slate-900">Bhopal Nagar Nigam Building</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Municipal Corporation Headquarters &amp; Starting Dispatch Depot</p>
            </div>
          </Popup>
        </Marker>

        {/* Permanent Ending Dump Site Marker: Solid Waste Management Facility */}
        <Marker position={[23.2524, 77.5404]} icon={getEndIcon()}>
          <Popup>
            <div className="p-1 text-slate-900 font-sans text-left">
              <p className="font-bold text-xs text-slate-900">Solid Waste Management Facility</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Terminal dumping &amp; sorting grounds for dispatch fleet</p>
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
