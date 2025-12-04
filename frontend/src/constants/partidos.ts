import { PartidoAMBA } from '@/types/location';

export const PARTIDOS_AMBA: PartidoAMBA[] = [
  {
    id: 'avellaneda',
    nombre: 'Avellaneda',
    coordenadas_centro: [-34.678, -58.364],
    poligono: [
      [-34.678, -58.364],
      [-34.67, -58.35],
      [-34.66, -58.36],
      [-34.678, -58.364],
    ],
  },
  {
    id: 'lanus',
    nombre: 'Lanús',
    coordenadas_centro: [-34.7, -58.4],
    poligono: [
      [-34.7, -58.4],
      [-34.69, -58.39],
      [-34.695, -58.41],
      [-34.7, -58.4],
    ],
  },
  // … agrega más partidos con sus polígonos
];
