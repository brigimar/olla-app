// frontend/src/types/geo.ts

/**
 * Tipos reutilizables para geometrías PostGIS/Supabase
 * Basados en el estándar GeoJSON
 */

export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [lng, lat]
}

export interface GeoLineString {
  type: 'LineString';
  coordinates: [number, number][]; // array de puntos
}

export interface GeoPolygon {
  type: 'Polygon';
  coordinates: [[number, number][]];
  // array de anillos, cada anillo es un array de puntos
}

export interface GeoMultiPolygon {
  type: 'MultiPolygon';
  coordinates: [[[number, number][]]];
  // array de polígonos, cada polígono es un array de anillos
}

export type Geometry = GeoPoint | GeoLineString | GeoPolygon | GeoMultiPolygon;

/**
 * Feature genérico con propiedades opcionales
 */
export interface GeoFeature<T extends Geometry = Geometry> {
  type: 'Feature';
  geometry: T;
  properties?: Record<string, unknown>;
}

/**
 * Colección de features
 */
export interface GeoFeatureCollection<T extends Geometry = Geometry> {
  type: 'FeatureCollection';
  features: GeoFeature<T>[];
}
