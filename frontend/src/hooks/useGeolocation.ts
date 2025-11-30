import { useState, useEffect } from 'react'

export default function useGeolocation() {
  const [coords, setCoords] = useState<{lat:number,lon:number}|null>(null)

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition((p) => {
      setCoords({ lat: p.coords.latitude, lon: p.coords.longitude })
    })
  }, [])

  return coords
}

