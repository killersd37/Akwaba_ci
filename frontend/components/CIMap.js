'use client';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function CIMap() {
  return (
    <MapContainer center={[7.54, -5.55]} zoom={6} className="h-72 w-full rounded-xl z-0">
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[5.36, -4.01]}>
        <Popup>Abidjan</Popup>
      </Marker>
    </MapContainer>
  );
}
