'use client';

import { useEffect, useState } from 'react';

export default function MapPage() {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((p) => {
        setCoords({ lat: p.coords.latitude, lon: p.coords.longitude });
      });
    }
  }, []);

  return (
    <div className="w-full h-screen p-6">
      <h2 className="text-2xl">Mapa (geolocalizaci�n)</h2>
      {coords ? (
        <iframe
          width="100%"
          height="80%"
          src={'https://www.google.com/maps?q=&z=15&output=embed'}
          title="Mapa"
        />
      ) : (
        <p>Cargando ubicaci�n...</p>
      )}
    </div>
  );
}
