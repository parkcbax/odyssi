"use client"

import { useEffect, useState, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { Button } from './ui/button'
import { Loader2, MapPin, Navigation } from 'lucide-react'

// Helper validation for coords
function isValidCoords(lat?: number | null, lng?: number | null) {
    return typeof lat === 'number' && typeof lng === 'number'
}

function LocationMarker({ position, setPosition, onLocationSelect }: any) {
    const map = useMap()

    useEffect(() => {
        if (position) {
            map.flyTo(position, map.getZoom())
        }
    }, [position, map])

    useMapEvents({
        click(e) {
            setPosition(e.latlng)
            onLocationSelect(e.latlng.lat, e.latlng.lng)
        },
    })

    return position === null ? null : (
        <Marker position={position} draggable={true} eventHandlers={{
            dragend: (e) => {
                const marker = e.target
                const position = marker.getLatLng()
                setPosition(position)
                onLocationSelect(position.lat, position.lng)
            }
        }}>
            <Popup>You are here</Popup>
        </Marker>
    )
}

interface LocationPickerProps {
    lat?: number | null
    lng?: number | null
    onLocationSelect: (lat: number, lng: number) => void
    className?: string
}

export default function LocationPicker({ lat, lng, onLocationSelect, className }: LocationPickerProps) {
    const [position, setPosition] = useState<L.LatLng | null>(
        isValidCoords(lat, lng) ? new L.LatLng(lat!, lng!) : null
    )
    const [isLoading, setIsLoading] = useState(false)

    // Fix for icons not loading
    useEffect(() => {
        // We'll use CDN for icons to avoid issues with Next.js static file serving for now if local assets missing
        // or just rely on the L.icon defined above and ensure files exist in public if possible.
        // For standard setup:
        // By default leaflet looks for marker-icon.png. 
        // We can just use a hack to fix the default icon path.
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });
    }, [])

    const handleLocateMe = () => {
        setIsLoading(true)
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser")
            setIsLoading(false)
            return
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords
                const newPos = new L.LatLng(latitude, longitude)
                setPosition(newPos)
                onLocationSelect(latitude, longitude)
                setIsLoading(false)
            },
            () => {
                alert("Unable to retrieve your location")
                setIsLoading(false)
            }
        )
    }

    return (
        <div className={className}>
            <div className="relative w-full h-full min-h-[300px] rounded-md overflow-hidden border">
                <MapContainer
                    center={position || [51.505, -0.09]}
                    zoom={13}
                    scrollWheelZoom={false}
                    className="h-full w-full"
                    style={{ height: '300px', width: '100%' }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationMarker position={position} setPosition={setPosition} onLocationSelect={onLocationSelect} />
                </MapContainer>

                <Button
                    size="sm"
                    variant="secondary"
                    className="absolute top-2 right-2 z-[1000] shadow-md"
                    onClick={handleLocateMe}
                    disabled={isLoading}
                >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4 mr-1" />}
                    Locate Me
                </Button>
            </div>
        </div>
    )
}
