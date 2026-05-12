import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

// Animated vehicle marker component to isolate rapid state updates
const AnimatedVehicle = ({ roadGeometry }) => {
  const [animatedPositionIndex, setAnimatedPositionIndex] = useState(0);

  useEffect(() => {
    let intervalId;
    if (roadGeometry && roadGeometry.length > 0) {
      intervalId = setInterval(() => {
        setAnimatedPositionIndex((prev) => {
          // Increment by a frame step of 1 to make movement slower and smoother over dense coordinates
          const nextIndex = prev + 1;
          if (nextIndex >= roadGeometry.length) {
            return 0; // Loop back to start
          }
          return nextIndex;
        });
      }, 50); // 50ms interval for slower animation (~20fps)
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [roadGeometry]);

  const getVehicleIcon = () => L.divIcon({
    className: 'custom-vehicle-icon',
    html: `<div class="w-3.5 h-3.5 bg-yellow-400 rounded-full shadow-[0_0_15px_rgba(250,204,21,0.9)] border-2 border-white"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });

  if (!roadGeometry || !roadGeometry[animatedPositionIndex]) return null;

  return (
    <Marker
      position={roadGeometry[animatedPositionIndex]}
      icon={getVehicleIcon()}
      zIndexOffset={1000}
    />
  );
};

// Dynamic auto-bounds updater adjusting viewports perfectly around valid generated itineraries
const BoundsUpdater = ({ optimalRoute }) => {
  const map = useMap();

  useEffect(() => {
    if (optimalRoute?.fleet_routes && optimalRoute.fleet_routes.length > 0) {
      const allCoords = [];
      optimalRoute.fleet_routes.forEach(r => {
        if (r.roadGeometry) allCoords.push(...r.roadGeometry);
      });
      if (allCoords.length > 1) {
        map.fitBounds(allCoords, { padding: [40, 40], maxZoom: 15 });
        return;
      }
    }
    // Default bounds focusing cleanly over Bhopal municipal boundaries
    map.fitBounds([
      [23.2244, 77.4027],
      [23.2524, 77.5404]
    ], { padding: [50, 50], maxZoom: 14 });
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

  // Array of distinct, high-contrast hex colors for different vans
  const vanColors = [
    '#3b82f6', // Blue (Van 1)
    '#f97316', // Orange (Van 2)
    '#a855f7', // Purple (Van 3)
    '#ec4899', // Pink (Van 4)
    '#10b981', // Emerald (Van 5)
    '#eab308'  // Yellow (Van 6)
  ];

  const getVanColor = (vanId) => {
    // Fallback to blue if vanId exceeds our array (vanId starts at 1)
    return vanColors[(vanId - 1) % vanColors.length] || vanColors[0];
  };

  // Build segments for distinct polyline for ALL vans
  const allRouteSegments = useMemo(() => {
    let allSegments = [];
    if (!optimalRoute?.fleet_routes) return allSegments;

    optimalRoute.fleet_routes.forEach((fleetRoute) => {
      if (fleetRoute.roadGeometry && fleetRoute.roadGeometry.length > 1) {
        allSegments.push({
          positions: fleetRoute.roadGeometry,
          color: getVanColor(fleetRoute.van_id),
          vanId: fleetRoute.van_id
        });
      }
    });
    return allSegments;
  }, [optimalRoute?.fleet_routes]);

  // Straight line segments fallback logic mapping active nodes
  const polylinePositions = useMemo(() => {
    if (!optimalRoute?.fleet_routes) return [];

    let allLines = [];
    optimalRoute.fleet_routes.forEach((fleetRoute) => {
      const positions = fleetRoute.route.map((id) => {
        if (id === 'depot') return [23.2244, 77.4027];
        if (id === 'dump_east') return [23.2524, 77.5404];
        if (id === 'dump_north') return [23.2800, 77.4000];

        const target = bins.find((b) => b.bin_id === id);
        if (target && target.latitude && target.longitude) {
          return [target.latitude, target.longitude];
        }
        return null;
      }).filter(Boolean);

      if (positions.length > 1) {
        allLines.push(positions);
      }
    });
    return allLines;
  }, [optimalRoute?.fleet_routes, bins]);

  return (
    <div className="w-full h-[520px] rounded-2xl overflow-hidden glass-panel border border-slate-800 relative z-10 shadow-2xl">
      <MapContainer
        center={centerPosition}
        zoom={13}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%', background: '#0b0f19' }}
      >
        <BoundsUpdater optimalRoute={optimalRoute} />

        {/* Dark mode tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Permanent Starting Depot Marker: Bhopal Nagar Nigam Building */}
        <Marker position={[23.2244, 77.4027]} icon={getStartIcon()}>
          <Popup className="rounded-xl bg-slate-900 text-slate-200 border-none">
            <div className="p-1 text-slate-200 font-sans text-left">
              <p className="font-bold text-xs text-white">Bhopal Nagar Nigam Building</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Municipal Corporation Headquarters &amp; Starting Dispatch Depot</p>
            </div>
          </Popup>
        </Marker>

        {/* Dynamic Ending Dump Site Markers Extracted from Final Route Coordinates */}
        {optimalRoute?.fleet_routes && optimalRoute.fleet_routes.map((route, idx) => {
          if (!route.roadGeometry || route.roadGeometry.length === 0) return null;
          const finalCoord = route.roadGeometry[route.roadGeometry.length - 1];
          return (
            <Marker key={`end-marker-${route.van_id}-${idx}`} position={finalCoord} icon={getEndIcon()}>
              <Popup className="rounded-xl bg-slate-900 text-slate-200 border-none">
                <div className="p-1 text-slate-200 font-sans text-left">
                  <p className="font-bold text-xs text-white flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: getVanColor(route.van_id) }}></span>
                    End: Waste Facility
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Terminal dumping grounds for Van {route.van_id}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}

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
              <Popup className="rounded-2xl shadow-xl border-0 overflow-hidden custom-popup bg-slate-900">
                <div className="p-1 text-slate-200 font-sans text-left min-w-[150px]">
                  <p className="font-bold text-xs border-b border-slate-700 pb-1 mb-1.5 flex items-center justify-between gap-2">
                    <span className="truncate text-white">{bin.location}</span>
                    <span className="text-[8px] uppercase px-1 py-0.2 rounded bg-slate-800 text-slate-400 font-mono shrink-0">
                      {bin.bin_id}
                    </span>
                  </p>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Current Load:</span>
                      <span className="font-bold text-white">{bin.fill_percentage}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Max Capacity:</span>
                      <span className="font-medium text-slate-300">{bin.capacity}L</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Priority Tier:</span>
                      <span className="font-medium text-slate-300">Level {bin.priority}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1.5 mt-1.5 border-t border-slate-700">
                      <span className="text-slate-400">Sensor State:</span>
                      <span className={`font-bold text-[10px] ${bin.status === 'Critical' ? 'text-rose-500 animate-pulse' : bin.status === 'Needs Collection' ? 'text-amber-500' : 'text-emerald-500'
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

        {/* Calculated OSRM Road-Snapped Route Overlay (Gradient) */}
        {allRouteSegments.length > 0 ? (
          <>
            {allRouteSegments.map((segment, index) => (
              <Polyline
                key={`segment-${segment.vanId}-${index}`}
                positions={segment.positions}
                pathOptions={{
                  color: segment.color,
                  weight: 6,
                  opacity: 0.85,
                  lineCap: 'round',
                  lineJoin: 'round'
                }}
              />
            ))}
            {/* Animated Vehicle Markers (One per van) */}
            {optimalRoute.fleet_routes.map(r => (
              r.roadGeometry && r.roadGeometry.length > 1 && (
                <AnimatedVehicle key={`van-${r.van_id}`} roadGeometry={r.roadGeometry} />
              )
            ))}
          </>
        ) : polylinePositions.length > 0 && (
          <>
            {polylinePositions.map((positions, index) => (
              <Polyline
                key={`fallback-${index}`}
                positions={positions}
                pathOptions={{
                  color: '#0284c7',
                  weight: 4.5,
                  opacity: 0.9,
                  dashArray: '8, 8',
                  lineCap: 'round',
                  lineJoin: 'round'
                }}
              />
            ))}
          </>
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
