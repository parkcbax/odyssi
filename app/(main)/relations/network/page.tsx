"use client"

import { useEffect, useState } from "react"
import { getNetworkData } from "@/app/lib/relations-actions"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ZoomIn, ZoomOut, Maximize } from "lucide-react"
import Link from "next/link"
import { Card } from "@/components/ui/card"

export default function NetworkPage() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getNetworkData().then(d => {
            setData(d)
            setLoading(false)
        })
    }, [])

    if (loading) return <div className="flex items-center justify-center h-[600px]">Loading network...</div>

    return (
        <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/relations">
                        <Button variant="ghost" size="icon">
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight">Network Visualizer</h1>
                </div>
            </div>

            <Card className="flex-1 overflow-hidden relative bg-muted/10 border-2">
                <NetworkGraph data={data} />
                
                <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                    <Button variant="secondary" size="icon" className="shadow-md"><ZoomIn className="h-4 w-4" /></Button>
                    <Button variant="secondary" size="icon" className="shadow-md"><ZoomOut className="h-4 w-4" /></Button>
                    <Button variant="secondary" size="icon" className="shadow-md"><Maximize className="h-4 w-4" /></Button>
                </div>

                <div className="absolute top-4 left-4 bg-background/80 backdrop-blur p-3 rounded-lg border shadow-sm max-w-xs">
                    <h3 className="font-semibold text-sm mb-1">How to use</h3>
                    <p className="text-xs text-muted-foreground">
                        Nodes represent your contacts. Lines represent their connections. 
                        Click on a node to view their profile.
                    </p>
                </div>
            </Card>
        </div>
    )
}

function NetworkGraph({ data }: { data: any }) {
    // Simple force-directed-ish layout simulation (random for now but with basic clustering)
    const [nodes, setNodes] = useState<any[]>([])
    
    useEffect(() => {
        const { contacts, connections } = data
        const width = 800
        const height = 600
        
        // Initial positions
        const initialNodes = contacts.map((c: any, i: number) => ({
            ...c,
            x: Math.random() * (width - 100) + 50,
            y: Math.random() * (height - 100) + 50,
        }))
        
        setNodes(initialNodes)
    }, [data])

    const edges = data.connections.map((conn: any) => {
        const source = nodes.find(n => n.id === conn.sourceContactId)
        const target = nodes.find(n => n.id === conn.targetContactId)
        return { source, target, type: conn.connectionType }
    }).filter((e: any) => e.source && e.target)

    return (
        <svg viewBox="0 0 800 600" className="w-full h-full cursor-move">
            <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="20" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
                </marker>
            </defs>

            {/* Edges */}
            {edges.map((edge: any, i: number) => (
                <g key={i}>
                    <line 
                        x1={edge.source.x} 
                        y1={edge.source.y} 
                        x2={edge.target.x} 
                        y2={edge.target.y} 
                        stroke="#94a3b8" 
                        strokeWidth="1"
                        strokeDasharray={edge.type === "Introduced by" ? "4 2" : "none"}
                        markerEnd="url(#arrowhead)"
                    />
                    <text 
                        x={(edge.source.x + edge.target.x) / 2} 
                        y={(edge.source.y + edge.target.y) / 2 - 5} 
                        textAnchor="middle" 
                        className="text-[8px] fill-muted-foreground font-medium"
                    >
                        {edge.type}
                    </text>
                </g>
            ))}

            {/* Nodes */}
            {nodes.map((node: any) => (
                <Link key={node.id} href={`/relations/${node.id}`}>
                    <g className="cursor-pointer group">
                        <circle 
                            cx={node.x} 
                            cy={node.y} 
                            r="25" 
                            className="fill-background stroke-primary stroke-2 group-hover:fill-accent transition-colors shadow-sm" 
                        />
                        {node.profilePicture ? (
                             <clipPath id={`clip-${node.id}`}>
                                <circle cx={node.x} cy={node.y} r="25" />
                            </clipPath>
                        ) : null}
                        
                        <text 
                            x={node.x} 
                            y={node.y + 40} 
                            textAnchor="middle" 
                            className="text-[10px] font-semibold fill-foreground"
                        >
                            {node.fullName}
                        </text>
                        <text 
                            x={node.x} 
                            y={node.y + 52} 
                            textAnchor="middle" 
                            className="text-[8px] fill-muted-foreground"
                        >
                            {node.group?.name || ""}
                        </text>

                        {/* Avatar placeholder icon */}
                        {!node.profilePicture && (
                            <path 
                                d={`M ${node.x-8} ${node.y+5} a 8 8 0 0 1 16 0 M ${node.x} ${node.y-10} a 5 5 0 1 1 0 10`} 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="1.5"
                                className="text-muted-foreground opacity-40"
                            />
                        )}
                    </g>
                </Link>
            ))}
        </svg>
    )
}
