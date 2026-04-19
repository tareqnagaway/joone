/**
 * مصادر طبقات الخريطة (Leaflet tileLayer).
 * غيّر DEFAULT_MAP_TILE_ID للافتراضي عند فتح التطبيق.
 */
export type MapTilePreset = {
  id: string;
  /** وصف قصير يظهر في قائمة التبديل */
  label: string;
  url: string;
  maxZoom?: number;
};

/** المعرف الافتراضي: osm | carto-dark | carto-voyager | esri-sat */
export const DEFAULT_MAP_TILE_ID = 'carto-dark';

export const MAP_TILE_PRESETS: MapTilePreset[] = [
  {
    id: 'osm',
    label: 'طرق (OSM)',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    maxZoom: 19,
  },
  {
    id: 'carto-dark',
    label: 'داكنة',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    maxZoom: 20,
  },
  {
    id: 'carto-voyager',
    label: 'Voyager',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    maxZoom: 20,
  },
  {
    id: 'esri-sat',
    label: 'قمر صناعي',
    url:
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 19,
  },
];

export function getMapTilePresetById(id: string): MapTilePreset {
  return MAP_TILE_PRESETS.find((p) => p.id === id) ?? MAP_TILE_PRESETS[0];
}
