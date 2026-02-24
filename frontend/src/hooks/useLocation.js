import { useState, useCallback } from 'react'

export function useLocation() {
  const [location, setLocation] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Tu dispositivo no soporta geolocalización')
      return
    }
    setLoading(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLoading(false)
      },
      (err) => {
        setError('No se pudo obtener tu ubicación. Permite el acceso en tu navegador.')
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  }, [])

  return { location, error, loading, requestLocation }
}
