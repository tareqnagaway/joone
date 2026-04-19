import React, { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { useLanguage } from '../contexts/LanguageContext';
import { useRide } from '../contexts/RideContext';
import { Navigation } from 'lucide-react';
import { cn } from '../lib/utils';
import L from 'leaflet';
import {
  DEFAULT_MAP_TILE_ID,
  MAP_TILE_PRESETS,
  getMapTilePresetById,
} from '../mapTiles';

const STORAGE_KEY = 'jo-one-map-tile-id';

function readStoredTileId(): string {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s && MAP_TILE_PRESETS.some((p) => p.id === s)) return s;
  } catch {
    /* ignore */
  }
  return DEFAULT_MAP_TILE_ID;
}

export default function MapView() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const pickupMarker = useRef<L.Marker | null>(null);
  const userLocationMarker = useRef<L.CircleMarker | null>(null);
  const driverMarker = useRef<L.Marker | null>(null);
  const routePolyline = useRef<L.Polyline | null>(null);
  
  const { isRTL } = useLanguage();
  const { pickup, currentRide } = useRide();
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [tileId, setTileId] = useState(readStoredTileId);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = L.map(mapContainer.current, {
      center: [31.9442, 35.9103],
      zoom: 7,
      zoomControl: false,
      attributionControl: false,
      maxBounds: L.latLngBounds([29.0, 34.0], [33.5, 39.5]),
      minZoom: 7
    });

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        const pos: [number, number] = [position.coords.latitude, position.coords.longitude];
        setUserLocation(pos);
        map.current?.setView(pos, 16);
      });
    }

    return () => {
      tileLayerRef.current = null;
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!map.current) return;
    const preset = getMapTilePresetById(tileId);
    if (tileLayerRef.current) {
      map.current.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }
    tileLayerRef.current = L.tileLayer(preset.url, {
      maxZoom: preset.maxZoom ?? 19,
    }).addTo(map.current);
  }, [tileId]);

  // Update user location marker
  useEffect(() => {
    if (!map.current || !userLocation) return;

    if (!userLocationMarker.current) {
      userLocationMarker.current = L.circleMarker(userLocation, {
        radius: 8,
        fillColor: "#3b82f6",
        color: "white",
        weight: 3,
        fillOpacity: 1,
      }).addTo(map.current);
    } else {
      userLocationMarker.current.setLatLng(userLocation);
    }
  }, [userLocation]);

  // Handle Pickup Marker
  useEffect(() => {
    if (!map.current) return;

    if (pickup) {
      if (!pickupMarker.current) {
        pickupMarker.current = L.marker([pickup.lat, pickup.lng], {
          icon: L.icon({
            iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
            iconSize: [32, 32],
            iconAnchor: [16, 32]
          })
        }).addTo(map.current);
      } else {
        pickupMarker.current.setLatLng([pickup.lat, pickup.lng]);
      }
    } else {
      pickupMarker.current?.remove();
      pickupMarker.current = null;
    }
  }, [pickup]);

  const getPreciseLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        const pos: [number, number] = [position.coords.latitude, position.coords.longitude];
        setUserLocation(pos);
        map.current?.setView(pos, 18);
      }, () => {
        alert("يرجى تفعيل GPS للحصول على موقع دقيق.");
      });
    }
  };

  return (
    <div className="relative w-full h-[100vh] bg-slate-900">
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
      
      {/* Precise Location Button */}
      <button 
        onClick={getPreciseLocation}
        className={cn(
          "absolute top-1/2 bg-primary text-white p-4 rounded-full shadow-2xl z-[1000] font-bold",
          isRTL ? "right-6" : "left-6"
        )}
      >
        <Navigation size={20} />
      </button>

      <div
        className={cn(
          'absolute bottom-8 z-[1000] max-w-[min(100%,20rem)] px-3',
          'left-1/2 -translate-x-1/2'
        )}
      >
        <label className="sr-only" htmlFor="map-tile-select">
          نوع الخريطة
        </label>
        <select
          id="map-tile-select"
          value={tileId}
          onChange={(e) => {
            const id = e.target.value;
            setTileId(id);
            try {
              localStorage.setItem(STORAGE_KEY, id);
            } catch {
              /* ignore */
            }
          }}
          className={cn(
            'w-full rounded-xl border border-white/20 bg-slate-900/90 px-3 py-2.5 text-sm text-white shadow-lg backdrop-blur-sm',
            'focus:outline-none focus:ring-2 focus:ring-primary'
          )}
        >
          {MAP_TILE_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {/* Map Overlay Shadow */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.2)] z-10" />
    </div>
  );
}
