import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import * as maplibregl from 'maplibre-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MAPBOX_TOKEN, isMapboxTokenAvailable } from '../lib/mapbox';
import { UserProfile } from '../types';

interface MapCanvasProps {
  currentLocation: { lat: number; lng: number };
  targetFriend: UserProfile | null;
  isFlying: boolean;
  flightProgress: number; // 0 to 1
  isInboxMode: boolean;
  userProfile: UserProfile;
  friends: UserProfile[];
  onSelectFriend?: (friend: UserProfile) => void;
}

export const MapCanvas: React.FC<MapCanvasProps> = ({
  currentLocation,
  targetFriend,
  isFlying,
  flightProgress,
  isInboxMode,
  userProfile,
  friends,
  onSelectFriend
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});
  const [mapLoaded, setMapLoaded] = useState(false);
  const [usingMapbox, setUsingMapbox] = useState(false);

  // Initialize Mapbox GL instance when token is provided, or fall back to MapLibre with CartoDB Voyager tiles
  useEffect(() => {
    if (!mapContainerRef.current) return;

    let mapInstance: any = null;
    const hasToken = isMapboxTokenAvailable();

    if (hasToken) {
      try {
        mapboxgl.accessToken = MAPBOX_TOKEN;
        mapInstance = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [currentLocation.lng, currentLocation.lat],
          zoom: 13,
          pitch: 52,
          bearing: -15,
          attributionControl: false
        });
        setUsingMapbox(true);
      } catch (err) {
        console.warn('Mapbox initialization failed, falling back to MapLibre:', err);
        mapInstance = null;
      }
    }

    // Fallback to MapLibre GL with CartoDB Voyager tiles (CORS friendly, fast, and requires no API key)
    if (!mapInstance) {
      setUsingMapbox(false);
      mapInstance = new maplibregl.Map({
        container: mapContainerRef.current,
        style: {
          version: 8,
          sources: {
            'carto-tiles': {
              type: 'raster',
              tiles: [
                'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
                'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
                'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png'
              ],
              tileSize: 256,
              attribution: '© OpenStreetMap contributors © CARTO'
            }
          },
          layers: [
            {
              id: 'carto-layer',
              type: 'raster',
              source: 'carto-tiles',
              minzoom: 0,
              maxzoom: 20
            }
          ]
        },
        center: [currentLocation.lng, currentLocation.lat],
        zoom: 13,
        pitch: 52,
        bearing: -15,
        attributionControl: false
      });
    }

    mapInstance.on('load', () => {
      setMapLoaded(true);

      // Add 3D buildings if vector source is available (e.g. with Mapbox streets)
      try {
        const layers = mapInstance.getStyle()?.layers;
        const labelLayerId = layers?.find(
          (layer: any) => layer.type === 'symbol' && layer.layout && layer.layout['text-field']
        )?.id;

        if (!mapInstance.getLayer('3d-buildings') && mapInstance.getSource('composite')) {
          mapInstance.addLayer(
            {
              id: '3d-buildings',
              source: 'composite',
              'source-layer': 'building',
              filter: ['==', 'extrude', 'true'],
              type: 'fill-extrusion',
              minzoom: 14,
              paint: {
                'fill-extrusion-color': '#d1d5db',
                'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 14, 0, 14.05, ['get', 'height']],
                'fill-extrusion-base': ['interpolate', ['linear'], ['zoom'], 14, 0, 14.05, ['get', 'min_height']],
                'fill-extrusion-opacity': 0.6
              }
            },
            labelLayerId
          );
        }
      } catch {
        // Vector building layers not present in raster fallback
      }
    });

    mapRef.current = mapInstance;

    return () => {
      mapInstance.remove();
    };
  }, []);

  // Update or create markers for friends and user
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    // Clean up old markers that are no longer present
    const activeIds = new Set([userProfile.id, ...friends.map((f) => f.id)]);
    Object.keys(markersRef.current).forEach((id) => {
      if (!activeIds.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    // Helper to build custom 3D pin element with avatar representation
    const createPinElement = (profile: UserProfile, isUser: boolean, isSelected: boolean) => {
      const el = document.createElement('div');
      el.className = 'flex flex-col items-center group cursor-pointer transition-all duration-300';
      el.style.transform = isSelected ? 'scale(1.22) translateY(-6px)' : 'scale(1)';

      el.innerHTML = `
        <div class="relative flex flex-col items-center select-none">
          <!-- Floating 3D Avatar Marker Body -->
          <div class="relative flex flex-col items-center drop-shadow-[0_12px_24px_rgba(0,0,0,0.35)] transition-transform duration-300 group-hover:scale-110">
            <div class="w-13 h-13 sm:w-14 sm:h-14 rounded-full p-1 bg-white shadow-2xl flex items-center justify-center ${
              isSelected
                ? 'ring-4 ring-indigo-600 ring-offset-2 scale-105'
                : isUser
                ? 'ring-3 ring-emerald-500'
                : 'ring-2 ring-slate-800/20 hover:ring-indigo-400'
            } transition-all">
              <img
                src="${profile.avatar}"
                class="w-full h-full object-cover rounded-full pointer-events-none"
                alt="${profile.name}"
                loading="eager"
              />
              <!-- Indicator Dot -->
              ${
                isUser
                  ? '<span class="absolute -bottom-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-xs"></span>'
                  : isSelected
                  ? '<span class="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 text-white flex items-center justify-center rounded-full text-[9px] font-bold shadow-xs">★</span>'
                  : ''
              }
            </div>

            <!-- 3D Marker Stem & Needle -->
            <div class="w-3 h-3 bg-white transform rotate-45 -mt-1.5 shadow-md border-r border-b border-black/10"></div>
          </div>

          <!-- Ground Contact Shadow Disc -->
          <div class="w-6 h-2 bg-black/30 rounded-full blur-[2px] -mt-1"></div>

          <!-- Info Pill Tag -->
          <div class="mt-1 px-3 py-1 rounded-full ${
            isSelected
              ? 'bg-indigo-950 text-white ring-1 ring-indigo-400/50'
              : 'bg-white/95 text-slate-800'
          } backdrop-blur-md shadow-xl text-xs font-bold tracking-tight whitespace-nowrap pointer-events-none flex items-center gap-1 transition-colors">
            <span>${profile.name}</span>
            <span class="text-[10px] ${isSelected ? 'text-indigo-300' : 'text-slate-500'} font-medium">• ${profile.city.split(',')[0]}</span>
          </div>
        </div>
      `;

      el.onclick = () => {
        if (!isUser && onSelectFriend) {
          onSelectFriend(profile);
        }
      };

      return el;
    };

    // Current user marker
    const MarkerClass = usingMapbox ? mapboxgl.Marker : (maplibregl.Marker as any);

    if (markersRef.current[userProfile.id]) {
      markersRef.current[userProfile.id].setLngLat([userProfile.lng, userProfile.lat]);
    } else {
      const pinEl = createPinElement(userProfile, true, false);
      markersRef.current[userProfile.id] = new MarkerClass({ element: pinEl, anchor: 'bottom' })
        .setLngLat([userProfile.lng, userProfile.lat])
        .addTo(map);
    }

    // Friend markers
    friends.forEach((friend) => {
      const isSelected = targetFriend?.id === friend.id;
      if (markersRef.current[friend.id]) {
        markersRef.current[friend.id].remove();
      }
      const pinEl = createPinElement(friend, false, isSelected);
      markersRef.current[friend.id] = new MarkerClass({ element: pinEl, anchor: 'bottom' })
        .setLngLat([friend.lng, friend.lat])
        .addTo(map);
    });
  }, [mapLoaded, friends, targetFriend, userProfile, usingMapbox]);

  // Handle Camera Movement (Smooth FlyTo & Flight Tracking)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    if (isFlying && targetFriend) {
      // Interpolate camera position during flight
      const startLng = userProfile.lng;
      const startLat = userProfile.lat;
      const endLng = targetFriend.lng;
      const endLat = targetFriend.lat;

      const currentLng = startLng + (endLng - startLng) * flightProgress;
      const currentLat = startLat + (endLat - startLat) * flightProgress;

      map.setCenter([currentLng, currentLat]);

      // Dynamic cinematic camera: tilt up & back out mid-flight, zoom in upon arrival
      const midProgress = Math.sin(flightProgress * Math.PI);
      const zoom = 14 - midProgress * 6.5; // fly out to globe scale then back in
      const pitch = 50 + midProgress * 15;
      map.setZoom(Math.max(3.5, zoom));
      map.setPitch(pitch);
    } else if (isInboxMode) {
      // Focus on current user in Inbox mode
      map.flyTo({
        center: [userProfile.lng, userProfile.lat],
        zoom: 15,
        pitch: 58,
        bearing: 10,
        duration: 1200,
        essential: true
      });
    } else if (targetFriend) {
      // Focus on selected friend with realistic 3D perspective
      map.flyTo({
        center: [targetFriend.lng, targetFriend.lat],
        zoom: 13.5,
        pitch: 54,
        bearing: -20,
        duration: 1400,
        essential: true
      });
    }
  }, [targetFriend, isFlying, flightProgress, isInboxMode, mapLoaded, userProfile]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden select-none">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};
