'use client';

import { useEffect } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';

// Fix Leaflet marker icon paths for Next.js
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
});

// Custom icons
const pickupIcon = new L.Icon({
  iconUrl: '/leaflet/marker-icon.png',
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  shadowUrl: '/leaflet/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'hue-rotate-[120deg] saturate-150 brightness-110', // green tint
});

const dropIcon = new L.Icon({
  iconUrl: '/leaflet/marker-icon.png',
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  shadowUrl: '/leaflet/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'hue-rotate-[0deg] saturate-200 brightness-110', // red tint
});

const driverIcon = new L.Icon({
  iconUrl: '/leaflet/marker-icon.png',
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  shadowUrl: '/leaflet/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'hue-rotate-[40deg] saturate-200 brightness-125', // amber tint
});

export interface MapMarker {
  position: [number, number]; // [lat, lng] for Leaflet
  label?: string;
  type?: 'default' | 'pickup' | 'drop' | 'driver';
}

interface MapInnerProps {
  center: [number, number]; // [lat, lng]
  zoom?: number;
  markers?: MapMarker[];
  onClick?: (latlng: [number, number]) => void;
  className?: string;
}

function MapClickHandler({
  onClick,
}: {
  onClick?: (latlng: [number, number]) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (!onClick) return;

    const handler = (e: L.LeafletMouseEvent) => {
      onClick([e.latlng.lat, e.latlng.lng]);
    };
    map.on('click', handler);
    return () => {
      map.off('click', handler);
    };
  }, [map, onClick]);

  return null;
}

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [map, center]);

  return null;
}

const defaultIcon = new L.Icon({
  iconUrl: '/leaflet/marker-icon.png',
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  shadowUrl: '/leaflet/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function getIcon(type?: string) {
  switch (type) {
    case 'pickup':
      return pickupIcon;
    case 'drop':
      return dropIcon;
    case 'driver':
      return driverIcon;
    default:
      return defaultIcon;
  }
}

export default function MapInner({
  center,
  zoom = 14,
  markers = [],
  onClick,
  className = '',
}: MapInnerProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className={`h-full w-full ${className}`}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      <MapClickHandler onClick={onClick} />
      <RecenterMap center={center} />
      {markers.map((m, i) => (
        <Marker key={i} position={m.position} icon={getIcon(m.type)}>
          {m.label && <Popup>{m.label}</Popup>}
        </Marker>
      ))}
    </MapContainer>
  );
}
