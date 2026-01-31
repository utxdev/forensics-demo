import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useTimeStore } from '../../store/timeStore';
import L from 'leaflet';
import { useMemo, useState } from 'react';

// Fix Leaflet Default Icon
import iconMarker from 'leaflet/dist/images/marker-icon.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: iconMarker,
    iconRetinaUrl: iconRetina,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const DELHI_POS: [number, number] = [28.6139, 77.2090];

const MapView = () => {
    const events = useTimeStore(s => s.events);
    const [geoFenceRadius, setGeoFenceRadius] = useState<number | null>(null);

    // Filter events with location
    const locationEvents = useMemo(() =>
        events.filter(e => e.latitude && e.longitude),
        [events]
    );

    return (
        <div className="w-full h-full relative bg-cosmic-dark z-0">
            <MapContainer
                center={DELHI_POS}
                zoom={13}
                scrollWheelZoom={true}
                className="w-full h-full"
                style={{ background: '#0B0B1A' }}
            >
                {/* Dark Matter / CartoDB Dark Matter Tile Layer works best for Cyber/Cosmic look */}
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                {locationEvents.map(event => (
                    <Marker
                        key={event.id}
                        position={[event.latitude!, event.longitude!]}
                    >
                        <Popup className="glass-popup">
                            <div className="text-xs font-inter p-1">
                                <strong className="text-vedic-gold font-orbitron">{event.eventType.toUpperCase()}</strong><br />
                                <div className="text-gray-400 my-1">{new Date(event.timestamp).toLocaleString()}</div>
                                <div className="text-white border-l-2 border-neon-cyan pl-2">{event.contentPreview}</div>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {/* Example Geo-Fence Circle (Static for now, will make interactive) */}
                {geoFenceRadius && (
                    <Circle
                        center={DELHI_POS}
                        radius={geoFenceRadius}
                        pathOptions={{ color: '#FFD700', fillColor: '#FFD700', fillOpacity: 0.1, className: 'animate-pulse' }}
                    />
                )}
            </MapContainer>

            {/* Map Controls Overlay */}
            <div className="absolute top-6 right-6 z-[1000] glass-panel p-4 flex flex-col gap-2 w-64">
                <h3 className="text-vedic-gold text-xs font-bold font-orbitron uppercase tracking-widest border-b border-white/10 pb-2 mb-2">Geo-Fencing Controls</h3>
                <div className="flex gap-2">
                    <button
                        onClick={() => setGeoFenceRadius(5000)}
                        className="flex-1 px-3 py-2 bg-white/5 text-xs rounded hover:bg-vedic-gold hover:text-black transition-colors border border-white/10 font-bold"
                    >
                        5KM RADIUS
                    </button>
                    <button
                        onClick={() => setGeoFenceRadius(null)}
                        className="px-3 py-2 bg-red-500/20 text-red-400 text-xs rounded hover:bg-red-500 hover:text-white transition-colors border border-red-500/30"
                    >
                        X
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MapView;
