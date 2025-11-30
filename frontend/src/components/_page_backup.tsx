"use client";
import { useEffect, useState } from "react";
import { apiGet } from "../lib/api";

export default function HomePage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    apiGet("/")
      .then(setData)
      .catch(err => console.error("Error:", err));
  }, []);

  return (
    <div style={{ padding: 40 }}>
      <h1>Frontend conectado 🎉</h1>

      {data ? (
        <pre>{JSON.stringify(data, null, 2)}</pre>
      ) : (
        <p>Cargando datos...</p>
      )}
    </div>
  );
}

