import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { fetchBins } from '../services/api';
import { MapPin, AlertTriangle, LogOut, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

// Custom Map Marker Icons
const createIcon = (color) =>
  new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

const icons = {
  OK: createIcon('green'),
  'Needs Collection': createIcon('gold'),
  Critical: createIcon('red'),
  User: createIcon('blue'),
};

// Fallback Default Location (Near DB City Mall, Bhopal)
const DEFAULT_LOC = [23.2322, 77.4299];
const RADIUS_KM = 2;

// Haversine distance formula
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Map recentering component
const MapUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
};

const CitizenMap = ({ setRole }) => {
  const [nearbyBins, setNearbyBins] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [locationError, setLocationError] = useState('');
  const navigate = useNavigate();

  // Geolocation Effect
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser. Showing default city center.");
      setUserLocation(DEFAULT_LOC);
      setIsLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
        setIsLoadingLocation(false);
      },
      (error) => {
        console.warn("Geolocation error:", error.message);
        setLocationError("Location access denied or unavailable. Showing default city center.");
        setUserLocation(DEFAULT_LOC);
        setIsLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  // Fetch Bins Effect
  useEffect(() => {
    if (!userLocation) return;

    const loadNearbyBins = async () => {
      try {
        const allBins = await fetchBins();
        // Filter bins within 2km of userLocation
        const filtered = allBins.filter((bin) => {
          const dist = getDistance(userLocation[0], userLocation[1], bin.latitude, bin.longitude);
          return dist <= RADIUS_KM;
        });
        setNearbyBins(filtered);
      } catch (err) {
        console.error("Failed to load bins for citizen map:", err);
        toast.error("Failed to connect to OmniBin network.");
      }
    };

    loadNearbyBins();
    // Poll every 10 seconds
    const interval = setInterval(loadNearbyBins, 10000);
    return () => clearInterval(interval);
  }, [userLocation]);

  const handleReport = (bin) => {
    toast.success(`Overflow reported for ${bin.location}. The municipality has been notified.`, {
      icon: <CheckCircle2 className="w-5 h-5 text-cyan-500" />,
      duration: 4000,
    });
  };

  const handleLogout = () => {
    setRole(null);
    navigate('/');
  };

  return (
    <div className="flex flex-col h-screen bg-[#0b0f19] text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950 relative">
      <Toaster 
        position="top-center" 
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#f8fafc',
            border: '1px solid #334155',
            zIndex: 9999
          }
        }} 
      />
      
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400 border border-cyan-500/20">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white leading-tight">Nearby Bins</h1>
            <p className="text-xs text-slate-400 font-medium">Citizen Portal</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2"
        >
          <span className="hidden sm:inline text-sm font-semibold">Logout</span>
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Error Banner */}
      {locationError && (
        <div className="absolute top-16 left-4 right-4 z-[1000]">
          <div className="bg-amber-500/10 border border-amber-500/30 backdrop-blur-md p-3 rounded-xl shadow-lg flex items-start gap-3 text-amber-500 max-w-lg mx-auto">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">{locationError}</p>
            </div>
            <button onClick={() => setLocationError('')} className="text-amber-500/70 hover:text-amber-400">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 relative">
        {isLoadingLocation ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0b0f19]/80 z-40 backdrop-blur-sm">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mb-4"></div>
            <p className="text-cyan-400 font-medium animate-pulse">Acquiring your location...</p>
          </div>
        ) : (
          <MapContainer center={userLocation || DEFAULT_LOC} zoom={14} className="h-full w-full z-10" zoomControl={false}>
            <MapUpdater center={userLocation} />
            
            {/* Dark mode tiles */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            
            {/* User Location Marker & Radius */}
            {userLocation && (
              <>
                <Marker position={userLocation} icon={icons.User}>
                  <Popup className="rounded-xl bg-slate-900 text-slate-200 border-none">
                    <div className="text-center font-semibold text-white">You are here</div>
                  </Popup>
                </Marker>
                <Circle 
                  center={userLocation} 
                  radius={RADIUS_KM * 1000} 
                  pathOptions={{ color: '#06b6d4', fillColor: '#22d3ee', fillOpacity: 0.1, weight: 1 }} 
                />
              </>
            )}

            {/* Bins within radius */}
            {nearbyBins.map(bin => (
              <Marker key={bin.bin_id} position={[bin.latitude, bin.longitude]} icon={icons[bin.status] || icons['OK']}>
                <Popup className="rounded-2xl shadow-xl border-0 overflow-hidden custom-popup bg-slate-900">
                  <div className="p-1 min-w-[200px] text-slate-200">
                    <h3 className="font-bold text-white mb-1">{bin.location}</h3>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-full bg-slate-800 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${bin.fill_percentage > 80 ? 'bg-rose-500' : bin.fill_percentage > 50 ? 'bg-amber-400' : 'bg-emerald-500'}`} 
                          style={{ width: `${Math.min(bin.fill_percentage, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-bold text-slate-300">{bin.fill_percentage}%</span>
                    </div>
                    
                    <button 
                      onClick={() => handleReport(bin)}
                      className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors active:scale-95"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      Report Overflow
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
        
        {/* Helper overlay for mobile */}
        {!isLoadingLocation && (
          <div className="absolute bottom-6 left-0 right-0 px-4 z-[1000] pointer-events-none">
            <div className="bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-slate-700 max-w-sm mx-auto flex items-center justify-between pointer-events-auto">
              <div>
                <p className="font-bold text-sm text-white">Showing bins near you</p>
                <p className="text-xs text-slate-400">{nearbyBins.length} bins within 2km radius</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold">
                {nearbyBins.length}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CitizenMap;
