import { useEffect, useState } from "react";
import { apiGet } from "../lib/api";

export default function HomePage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    apiGet("/").then(setData).catch(console.error);
  }, []);

  return (
    <main>
      <h1>Frontend</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </main>
  );
}

