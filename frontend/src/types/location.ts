// types.ts
export interface PartidoAMBA {
  id: string;
  nombre: string;
  coordenadas_centro: [number, number];
  poligono: [number, number][]; // array de coordenadas [lat, lng]
}

export interface Location {
  lat: number;
  lng: number;
  partido?: string;
  source: 'auto' | 'manual';
}

// constants.ts
export const PARTIDOS_AMBA: PartidoAMBA[] = [
  {
    id: 'buenos_aires',
    nombre: 'Buenos Aires',
    coordenadas_centro: [-34.6037, -58.3816],
    poligono: [
      [-34.5, -58.5],
      [-34.7, -58.5],
      [-34.7, -58.3],
      [-34.5, -58.3],
    ],
  },
  {
    id: 'la_matanza',
    nombre: 'La Matanza',
    coordenadas_centro: [-34.8228, -58.7024],
    poligono: [
      [-34.7, -58.8],
      [-34.9, -58.8],
      [-34.9, -58.6],
      [-34.7, -58.6],
    ],
  },
  // ... (agregar los 48 partidos completos con polígonos reales)
  // Por brevedad, mostramos solo 2 partidos. En producción incluir los 48
];




