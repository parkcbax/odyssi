"use client"

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for Leaflet icons
const fixLeafletIcon = () => {
    // Avoid re-patching if possible or just catch overwrite
    try {
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });
    } catch (e) {
        // ignore
    }
}

function FlyToLocation({ position }: { position: [number, number] }) {
    const map = useMap()
    useEffect(() => {
        if (position) {
            map.setView(position, map.getZoom())
        }
    }, [position, map])
    return null
}

interface EntryMapProps {
    lat: number
    lng: number
    locationName?: string
    className?: string
}

export default function EntryMap({ lat, lng, locationName, className }: EntryMapProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        fixLeafletIcon()
        setMounted(true)
    }, [])

    if (!mounted) return <div className="h-[200px] w-full bg-muted animate-pulse rounded-md" />

    const position: [number, number] = [lat, lng]

    return (
        <div className={className}>
            <div className="relative w-full h-[300px] min-h-[300px] rounded-md overflow-hidden border z-0">
                <MapContainer
                    center={position}
                    zoom={13}
                    scrollWheelZoom={false}
                    className="h-full w-full"
                    dragging={false}
                    zoomControl={false}
                    style={{ height: '300px', width: '100%', minHeight: '300px' }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={position}>
                        <Popup>{locationName || "Location"}</Popup>
                    </Marker>
                    <FlyToLocation position={position} />
                </MapContainer>
            </div>
        </div>
    )
}
