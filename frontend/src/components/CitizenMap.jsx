import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { fetchBins } from '../services/api';
import { MapPin, AlertTriangle, LogOut, CheckCircle2, AlertCircle, X, Leaf, Recycle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

/* ── Custom Icons ─────────────────────────────────────────────────── */
const createIcon = color =>
  new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25,41], iconAnchor: [12,41], popupAnchor: [1,-34], shadowSize: [41,41],
  });

const icons = {
  OK: createIcon('green'),
  'Needs Collection': createIcon('gold'),
  Critical: createIcon('red'),
  User: createIcon('blue'),
};

const DEFAULT_LOC = [23.2322, 77.4299];
const RADIUS_KM   = 2;

const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*(Math.PI/180)) * Math.cos(lat2*(Math.PI/180)) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

const MapUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => { if (center) map.setView(center, map.getZoom()); }, [center, map]);
  return null;
};

const CitizenMap = ({ setRole }) => {
  const [nearbyBins,     setNearbyBins]     = useState([]);
  const [userLocation,   setUserLocation]   = useState(null);
  const [isLoading,      setIsLoading]      = useState(true);
  const [locationError,  setLocationError]  = useState('');
  const navigate = useNavigate();

  /* Geolocation */
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported. Showing default city centre.');
      setUserLocation(DEFAULT_LOC); setIsLoading(false); return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => { setUserLocation([pos.coords.latitude, pos.coords.longitude]); setIsLoading(false); },
      err => {
        console.warn(err.message);
        setLocationError('Location access denied. Showing default city centre.');
        setUserLocation(DEFAULT_LOC); setIsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  /* Fetch nearby bins */
  useEffect(() => {
    if (!userLocation) return;
    const load = async () => {
      try {
        const all = await fetchBins();
        setNearbyBins(all.filter(b => getDistance(userLocation[0], userLocation[1], b.latitude, b.longitude) <= RADIUS_KM));
      } catch { toast.error('Failed to connect to OmniBin network.'); }
    };
    load();
    const iv = setInterval(load, 10000);
    return () => clearInterval(iv);
  }, [userLocation]);

  const handleReport = bin => {
    toast.success(`Overflow reported for ${bin.location}. Municipality notified.`, {
      icon: '♻️',
      duration: 4000,
      style: {
        background: 'rgba(255,255,255,0.88)',
        color: '#0d4a2f',
        border: '1px solid rgba(255,255,255,0.75)',
        backdropFilter: 'blur(16px)',
        borderRadius: 14,
        fontWeight: 600,
      },
    });
  };

  const handleLogout = () => { setRole(null); navigate('/'); };

  return (
    <div className="flex flex-col h-screen relative overflow-hidden">
      {/* Nature background */}
      <div className="nature-bg" />

      <Toaster position="top-center" />

      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="glass-panel sticky top-0 z-50 px-4 py-3 flex items-center justify-between"
              style={{ borderRadius:0, borderTop:'none', borderLeft:'none', borderRight:'none' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
               style={{ background:'linear-gradient(135deg,#16a34a,#059669)', boxShadow:'0 4px 12px rgba(22,163,74,0.30)' }}>
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-black text-base leading-tight" style={{ color:'#0d4a2f' }}>Nearby Bins</h1>
            <p className="text-[10px] font-semibold" style={{ color:'rgba(13,74,47,0.55)' }}>
              Citizen Portal · {nearbyBins.length} bins within {RADIUS_KM}km
            </p>
          </div>
        </div>

        <button id="citizen-logout" onClick={handleLogout} className="btn-glass text-xs rounded-xl">
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Exit Portal</span>
        </button>
      </header>

      {/* ── Location error banner ────────────────────────────────── */}
      {locationError && (
        <div className="absolute top-16 left-4 right-4 z-[1000]">
          <div className="glass-panel p-3 rounded-2xl flex items-start gap-3 max-w-lg mx-auto animate-fade-in"
               style={{ borderColor:'rgba(245,158,11,0.35)' }}>
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color:'#d97706' }} />
            <p className="text-sm flex-1 font-medium" style={{ color:'#92400e' }}>{locationError}</p>
            <button onClick={() => setLocationError('')} style={{ color:'rgba(146,64,14,0.55)' }}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Map ─────────────────────────────────────────────────── */}
      <main className="flex-1 relative z-10">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-40"
               style={{ background:'rgba(200,237,216,0.75)', backdropFilter:'blur(12px)' }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 animate-float"
                 style={{ background:'linear-gradient(135deg,#16a34a,#059669)', boxShadow:'0 8px 24px rgba(22,163,74,0.35)' }}>
              <Recycle className="w-8 h-8 text-white" />
            </div>
            <p className="text-base font-bold" style={{ color:'#0d4a2f' }}>Acquiring your location...</p>
            <p className="text-sm mt-1" style={{ color:'rgba(13,74,47,0.55)' }}>Please allow location access</p>
          </div>
        ) : (
          <MapContainer center={userLocation || DEFAULT_LOC} zoom={14} className="h-full w-full z-10" zoomControl={false}>
            <MapUpdater center={userLocation} />

            {/* Light map tiles for nature aesthetic */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />

            {userLocation && (
              <>
                <Marker position={userLocation} icon={icons.User}>
                  <Popup>
                    <div className="text-center font-bold" style={{ color:'#0d4a2f' }}>📍 You are here</div>
                  </Popup>
                </Marker>
                <Circle
                  center={userLocation}
                  radius={RADIUS_KM * 1000}
                  pathOptions={{ color:'#16a34a', fillColor:'#16a34a', fillOpacity:0.07, weight:2, dashArray:'8 6' }}
                />
              </>
            )}

            {nearbyBins.map(bin => (
              <Marker key={bin.bin_id} position={[bin.latitude, bin.longitude]} icon={icons[bin.status] || icons.OK}>
                <Popup className="custom-popup">
                  <div className="p-1 min-w-[200px]">
                    <h3 className="font-bold text-sm mb-2" style={{ color:'#0d4a2f' }}>{bin.location}</h3>
                    {/* Fill bar */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex-1 h-2 rounded-full overflow-hidden"
                           style={{ background:'rgba(13,74,47,0.10)' }}>
                        <div className="h-full rounded-full transition-all"
                             style={{
                               width:`${Math.min(bin.fill_percentage,100)}%`,
                               background: bin.fill_percentage > 80 ? '#dc2626' : bin.fill_percentage > 50 ? '#d97706' : '#16a34a'
                             }} />
                      </div>
                      <span className="text-xs font-bold" style={{ color:'#0d4a2f' }}>{bin.fill_percentage}%</span>
                    </div>
                    <button
                      onClick={() => handleReport(bin)}
                      className="w-full py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                      style={{ background:'rgba(254,226,226,0.60)', border:'1px solid rgba(239,68,68,0.25)', color:'#dc2626' }}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Report Overflow
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}

        {/* Bottom info card */}
        {!isLoading && (
          <div className="absolute bottom-5 left-0 right-0 px-4 z-[1000] pointer-events-none">
            <div className="glass-panel p-3.5 rounded-2xl max-w-sm mx-auto flex items-center justify-between pointer-events-auto"
                 style={{ boxShadow:'0 8px 32px rgba(13,74,47,0.15)' }}>
              <div>
                <p className="font-bold text-sm" style={{ color:'#0d4a2f' }}>Bins near you</p>
                <p className="text-xs" style={{ color:'rgba(13,74,47,0.55)' }}>
                  {nearbyBins.length} bins within {RADIUS_KM}km radius
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm"
                   style={{ background:'rgba(22,163,74,0.12)', border:'1px solid rgba(22,163,74,0.25)', color:'#16a34a' }}>
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
