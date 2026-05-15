"use client"

import { useEffect, useState } from "react"
import { getNetworkData } from "@/app/lib/relations-actions"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ZoomIn, ZoomOut, Maximize } from "lucide-react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Network, ChevronDown, ChevronRight, Share2, Users, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ConnectionDialog } from "@/components/relations/connection-dialog"

export default function NetworkPage() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [view, setView] = useState<"map" | "tree">("map")
    const [zoom, setZoom] = useState(0.6) // Initial zoom out to fit larger space
    const [offset, setOffset] = useState({ x: 0, y: 0 })

    useEffect(() => {
        getNetworkData().then(d => {
            setData(d)
            setLoading(false)
        })
    }, [])

    const handleZoomIn = () => setZoom(z => Math.min(z + 0.1, 4))
    const handleZoomOut = () => setZoom(z => Math.max(z - 0.1, 0.2))
    const handleReset = () => {
        setZoom(1)
        setOffset({ x: 0, y: 0 })
    }

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
                    <h1 className="text-3xl font-bold tracking-tight">Network Insights</h1>
                </div>
                <Tabs value={view} onValueChange={(v: any) => setView(v)} className="w-auto">
                    <TabsList>
                        <TabsTrigger value="map" className="gap-2">
                            <Share2 className="h-4 w-4" />
                            Map View
                        </TabsTrigger>
                        <TabsTrigger value="tree" className="gap-2">
                            <Users className="h-4 w-4" />
                            Hierarchy Tree
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <Card className="flex-1 overflow-hidden relative bg-muted/10 border-2">
                {view === "map" ? (
                    <>
                        <NetworkGraph 
                            data={data} 
                            zoom={zoom} 
                            offset={offset} 
                            setOffset={setOffset} 
                            onZoom={setZoom}
                        />
                        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                            <Button variant="secondary" size="icon" className="shadow-md" onClick={handleZoomIn}><ZoomIn className="h-4 w-4" /></Button>
                            <Button variant="secondary" size="icon" className="shadow-md" onClick={handleZoomOut}><ZoomOut className="h-4 w-4" /></Button>
                            <Button variant="secondary" size="icon" className="shadow-md" onClick={handleReset}><Maximize className="h-4 w-4" /></Button>
                        </div>
                        <div className="absolute top-4 left-4 bg-background/80 backdrop-blur p-3 rounded-lg border shadow-sm max-w-xs">
                            <h3 className="font-semibold text-sm mb-1">Network Map</h3>
                            <p className="text-xs text-muted-foreground">
                                Visualizing paths between contacts. Drag to pan, scroll to zoom.
                            </p>
                        </div>
                    </>
                ) : (
                    <div className="h-full overflow-y-auto p-6 bg-background">
                        <RelationTree data={data} />
                    </div>
                )}
            </Card>
        </div>
    )
}

function NetworkGraph({ data, zoom, offset, setOffset, onZoom }: { data: any, zoom: number, offset: { x: number, y: number }, setOffset: (o: any) => void, onZoom: (z: any) => void }) {
    const [nodes, setNodes] = useState<any[]>([])
    const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set())
    const [hoveredId, setHoveredId] = useState<string | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
    
    const getGroupColor = (name: string | null) => {
        if (!name) return 'var(--primary)'
        let hash = 0
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash)
        }
        const h = Math.abs(hash % 360)
        return `hsl(${h}, 65%, 45%)`
    }

    useEffect(() => {
        if (!data || !data.contacts.length) return
        
        const { contacts, connections } = data
        const centerX = 800
        const centerY = 600
        const stepDistance = 250 // Consistent distance from parent to child
        const processedNodes: any[] = []
        const usedIds = new Set<string>()

        // 1. Identify main root
        const roots = contacts
            .sort((a: any, b: any) => {
                const aCount = connections.filter((conn: any) => conn.sourceContactId === a.id || conn.targetContactId === a.id).length
                const bCount = connections.filter((conn: any) => conn.sourceContactId === b.id || conn.targetContactId === b.id).length
                return bCount - aCount
            })
            .slice(0, 1)

        const layoutNode = (entity: any, x: number, y: number, incomingAngle: number | null, depth: number) => {
            if (usedIds.has(entity.id)) return
            usedIds.add(entity.id)
            processedNodes.push({ ...entity, x, y })

            const children = connections
                .filter((c: any) => c.sourceContactId === entity.id || c.targetContactId === entity.id)
                .map((c: any) => c.sourceContactId === entity.id ? c.targetContactId : c.sourceContactId)
                .map((id: string) => contacts.find((c: any) => c.id === id))
                .filter((c: any) => c && !usedIds.has(c.id))

            if (children.length === 0) return

            // If we have an incoming angle, we fan out away from it. 
            // If no incoming angle (root), we fan out 360 degrees.
            const totalArc = incomingAngle === null ? Math.PI * 2 : Math.PI * 0.8 // 144 degrees for children
            const startAngle = incomingAngle === null ? 0 : incomingAngle - totalArc / 2
            const angleStep = children.length === 1 ? 0 : totalArc / (children.length - 1)

            children.forEach((child: any, i: number) => {
                const angle = incomingAngle === null 
                    ? (Math.PI * 2 / children.length) * i 
                    : startAngle + (i * angleStep)
                
                const nx = x + Math.cos(angle) * stepDistance
                const ny = y + Math.sin(angle) * stepDistance
                
                layoutNode(child, nx, ny, angle, depth + 1)
            })
        }

        if (roots.length > 0) {
            layoutNode(roots[0], centerX, centerY, null, 0)
        }

        // Handle stragglers
        contacts.forEach(c => {
            if (!usedIds.has(c.id)) {
                const angle = Math.random() * Math.PI * 2
                processedNodes.push({ ...c, x: centerX + Math.cos(angle) * 500, y: centerY + Math.sin(angle) * 500 })
                usedIds.add(c.id)
            }
        })

        // COLLISION PREVENTION: Push overlapping nodes apart (even from different parents)
        const minDistance = 140 
        for (let iter = 0; iter < 15; iter++) {
            for (let i = 0; i < processedNodes.length; i++) {
                for (let j = i + 1; j < processedNodes.length; j++) {
                    const n1 = processedNodes[i]
                    const n2 = processedNodes[j]
                    
                    const dx = n2.x - n1.x
                    const dy = n2.y - n1.y
                    const distance = Math.sqrt(dx * dx + dy * dy)
                    
                    if (distance < minDistance && distance > 0) {
                        const overlap = minDistance - distance
                        const force = (overlap / distance) * 0.5
                        const moveX = dx * force
                        const moveY = dy * force
                        
                        n1.x -= moveX
                        n1.y -= moveY
                        n2.x += moveX
                        n2.y += moveY
                    }
                }
            }
        }

        setNodes(processedNodes)
    }, [data])

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true)
        setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return
        setOffset({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        })
    }

    const handleMouseUp = () => setIsDragging(false)
    
    const handleWheel = (e: React.WheelEvent) => {
        const delta = e.deltaY > 0 ? -0.1 : 0.1
        onZoom((z: number) => Math.max(0.2, Math.min(4, z + delta)))
    }

    const toggleCollapse = (id: string, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        
        const descendants = new Set<string>()
        const findDescendants = (nodeId: string) => {
            const childIds = data.connections
                .filter((c: any) => c.sourceContactId === nodeId)
                .map((c: any) => c.targetContactId)
            
            if (nodeId.startsWith('group-')) {
                const groupName = nodeId.replace('group-', '')
                data.contacts.filter((c: any) => c.group?.name === groupName).forEach((c: any) => childIds.push(c.id))
            }

            childIds.forEach((childId: string) => {
                if (!descendants.has(childId)) {
                    descendants.add(childId)
                    findDescendants(childId)
                }
            })
        }
        findDescendants(id)

        setCollapsedNodes(prev => {
            const next = new Set(prev)
            const isCollapsing = !next.has(id)
            if (isCollapsing) {
                next.add(id)
                descendants.forEach(d => next.add(d))
            } else {
                next.delete(id)
                descendants.forEach(d => next.delete(d))
            }
            return next
        })
    }

    const visibleNodes = nodes.filter(n => {
        let isHidden = false
        const checkAncestorCollapsed = (nodeId: string, visited: Set<string>) => {
            if (visited.has(nodeId)) return false
            visited.add(nodeId)
            const ancestors: string[] = []
            data.connections.filter((c: any) => c.targetContactId === nodeId).forEach((c: any) => ancestors.push(c.sourceContactId))
            const contact = data.contacts.find((c: any) => c.id === nodeId)
            if (contact?.group?.name) {
                ancestors.push(`group-${contact.group.name}`)
            }
            for (const ancestorId of ancestors) {
                if (collapsedNodes.has(ancestorId)) {
                    isHidden = true
                    return true
                }
                if (checkAncestorCollapsed(ancestorId, visited)) {
                    return true
                }
            }
            return false
        }
        checkAncestorCollapsed(n.id, new Set())
        return !isHidden
    })

    const sortedVisibleNodes = [...visibleNodes].sort((a, b) => {
        if (a.id === hoveredId) return 1
        if (b.id === hoveredId) return -1
        return 0
    })

    const visibleEdges = [
        ...data.connections.filter((conn: any) => {
            const sourceVisible = visibleNodes.some(n => n.id === conn.sourceContactId)
            const targetVisible = visibleNodes.some(n => n.id === conn.targetContactId)
            return sourceVisible && targetVisible
        }).map((conn: any) => {
            const source = nodes.find(n => n.id === conn.sourceContactId)
            const target = nodes.find(n => n.id === conn.targetContactId)
            return { source, target, type: conn.connectionType, isGroupLink: false }
        }),
        ...nodes.filter(n => !n.isGroup && n.group?.name).map(n => {
            const source = nodes.find(group => group.id === `group-${n.group.name}`)
            const isSourceVisible = source && visibleNodes.some(vn => vn.id === source.id)
            const isTargetVisible = visibleNodes.some(vn => vn.id === n.id)
            if (isSourceVisible && isTargetVisible) {
                return { source, target: n, type: 'Member', isGroupLink: true }
            }
            return null
        }).filter(Boolean)
    ].filter((e: any) => e.source && e.target && e.source.x !== undefined && e.target.x !== undefined)

    return (
        <svg 
            viewBox="0 0 1600 1200" 
            className="w-full h-full cursor-move bg-transparent" 
            preserveAspectRatio="xMidYMid meet"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
        >
            <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="35" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
                </marker>
                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                    <feOffset dx="0" dy="2" result="offsetblur" />
                    <feComponentTransfer>
                        <feFuncA type="linear" slope="0.3" />
                    </feComponentTransfer>
                    <feMerge>
                        <feMergeNode />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            <g transform={`translate(${offset.x}, ${offset.y}) scale(${zoom})`} style={{ transformOrigin: '800px 600px' }}>
                {visibleEdges.map((edge: any, i: number) => (
                    <g key={i}>
                        <line 
                            x1={edge.source.x} y1={edge.source.y} 
                            x2={edge.target.x} y2={edge.target.y} 
                            stroke={edge.isGroupLink ? "var(--primary)" : "#94a3b8"} 
                            strokeWidth={edge.isGroupLink ? "1" : "1.5"}
                            strokeDasharray={edge.type === "Introduced by" || edge.isGroupLink ? "4 2" : "none"}
                            markerEnd={edge.isGroupLink ? "" : "url(#arrowhead)"}
                            className={cn(
                                "transition-all duration-300", 
                                edge.isGroupLink ? "opacity-10" : "opacity-30",
                                hoveredId && (edge.source.id === hoveredId || edge.target.id === hoveredId) ? "opacity-100 stroke-primary stroke-[2px]" : ""
                            )}
                        />
                    </g>
                ))}

                {sortedVisibleNodes.map((node: any) => {
                    const isCollapsed = collapsedNodes.has(node.id)
                    const isHovered = hoveredId === node.id
                    const outgoingCount = data.connections.filter((c: any) => c.sourceContactId === node.id).length
                    const hasChildren = outgoingCount > 0
                    const groupColor = getGroupColor(node.group?.name)

                    return (
                        <g 
                            key={node.id} 
                            className={cn(
                                "cursor-pointer transition-all duration-300",
                                hoveredId && !isHovered && "opacity-30 grayscale-[0.5]"
                            )}
                            onMouseEnter={() => setHoveredId(node.id)}
                            onMouseLeave={() => setHoveredId(null)}
                        >
                            <foreignObject x={node.x - 50} y={node.y - 50} width="100" height="100" className="overflow-visible">
                                <div className="w-full h-full flex items-center justify-center">
                                    <div className={cn(
                                        "relative rounded-full transition-all duration-500 shadow-lg",
                                        isCollapsed ? "scale-75" : "scale-100",
                                        isHovered ? "scale-125 z-50" : "",
                                        "w-[56px] h-[56px]"
                                    )} style={{ 
                                        filter: isHovered ? 'url(#shadow)' : 'none',
                                        border: `3px solid ${groupColor}`
                                    }}>
                                        <Link href={`/relations/${node.id}`} className="block w-full h-full rounded-full overflow-hidden">
                                            <div className="w-full h-full bg-background flex items-center justify-center hover:ring-4 hover:ring-primary/10">
                                                {node.profilePicture ? (
                                                    <img src={node.profilePicture} className="w-full h-full object-cover" />
                                                ) : (
                                                    <User className="h-6 w-6 text-muted-foreground" />
                                                )}
                                            </div>
                                        </Link>
                                        
                                        {hasChildren && (
                                            <button 
                                                onClick={(e) => toggleCollapse(node.id, e)}
                                                className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1 shadow-md hover:scale-110 transition-transform z-10"
                                            >
                                                {isCollapsed ? <Plus className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                            </button>
                                        )}
                                        
                                        <div className="absolute -bottom-2 -right-2 z-10">
                                            <ConnectionDialog sourceContactId={node.id} allContacts={data.contacts}>
                                                <button 
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="bg-green-600 text-white rounded-full p-1 shadow-md hover:scale-110 transition-transform"
                                                    title="Add Connection"
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </button>
                                            </ConnectionDialog>
                                        </div>
                                    </div>
                                </div>
                            </foreignObject>
                            
                            <text 
                                x={node.x} 
                                y={node.y + 48 + (isHovered ? 15 : 0)} 
                                textAnchor="middle" 
                                className={cn(
                                    "font-bold fill-foreground transition-all duration-300 text-[10px]",
                                    isHovered ? "text-[14px] fill-primary" : ""
                                )}
                            >
                                {node.fullName}
                            </text>
                            {node.group?.name && (
                                <text 
                                    x={node.x} 
                                    y={node.y + 58 + (isHovered ? 20 : 0)} 
                                    textAnchor="middle" 
                                    style={{ fill: groupColor }}
                                    className={cn(
                                        "text-[8px] font-semibold uppercase tracking-wider transition-all duration-300",
                                        isHovered ? "text-[10px] opacity-100" : "opacity-90"
                                    )}
                                >
                                    {node.group.name}
                                </text>
                            )}
                        </g>
                    )
                })}
            </g>
        </svg>
    )
}

function RelationTree({ data }: { data: any }) {
    const usedIds = new Set<string>()
    const tree: any[] = []

    // Sort contacts to find true roots: prioritize nodes with 0 incoming connections and high outgoing connections.
    // If there's a tie, fall back to alphabetical order.
    const sortedContacts = [...data.contacts].sort((a, b) => {
        const aIn = data.connections.filter((c: any) => c.targetContactId === a.id).length
        const bIn = data.connections.filter((c: any) => c.targetContactId === b.id).length
        if (aIn !== bIn) return aIn - bIn // Lower incoming connections first

        const aOut = data.connections.filter((c: any) => c.sourceContactId === a.id).length
        const bOut = data.connections.filter((c: any) => c.sourceContactId === b.id).length
        if (aOut !== bOut) return bOut - aOut // Higher outgoing connections first

        return a.fullName.localeCompare(b.fullName, 'th')
    })

    const buildNode = (contact: any): any => {
        usedIds.add(contact.id)
        const node = { ...contact, children: [] as any[] }
        
        // Find ALL connected people (bi-directional)
        const links = data.connections.filter((c: any) => c.sourceContactId === contact.id || c.targetContactId === contact.id)
        
        links.forEach((conn: any) => {
            const neighborId = conn.sourceContactId === contact.id ? conn.targetContactId : conn.sourceContactId
            if (!usedIds.has(neighborId)) {
                const neighbor = data.contacts.find((c: any) => c.id === neighborId)
                if (neighbor) {
                    node.children.push({ ...buildNode(neighbor), connectionType: conn.connectionType })
                }
            }
        })
        return node
    }

    // Build the forest
    sortedContacts.forEach(contact => {
        if (!usedIds.has(contact.id)) {
            tree.push(buildNode(contact))
        }
    })

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-20">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 bg-muted/50 p-3 rounded-lg">
                <Share2 className="h-4 w-4" />
                <span>Smart Hierarchy: Bi-directional view of your social connections.</span>
            </div>
            
            <div className="space-y-4">
                {tree.map(node => (
                    <div key={node.id} className="border rounded-xl bg-background shadow-sm overflow-hidden">
                         <TreeNode node={node} allContacts={data.contacts} />
                    </div>
                ))}
            </div>
        </div>
    )
}

function TreeNode({ node, allContacts, depth = 0 }: { node: any, allContacts: any[], depth?: number }) {
    const [expanded, setExpanded] = useState(true)
    const hasChildren = node.children && node.children.length > 0

    return (
        <div className="flex flex-col">
            <div 
                className={cn(
                    "flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors group relative",
                    depth > 0 && "ml-12 border-l-2 border-primary/20 pl-8"
                )}
            >
                {/* Visual indicator for nesting */}
                {depth > 0 && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-[2px] bg-primary/20 -ml-8" />
                )}
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-background shadow-md bg-muted flex items-center justify-center shrink-0">
                    {node.profilePicture ? (
                        <img src={node.profilePicture} className="w-full h-full object-cover" />
                    ) : (
                        <User className="h-6 w-6 text-muted-foreground" />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <Link href={`/relations/${node.id}`} className="font-bold text-lg truncate hover:text-primary transition-colors">
                            {node.fullName}
                        </Link>
                        {node.group && (
                            <Badge variant="outline" className="text-[10px] h-4 font-normal uppercase opacity-70">
                                {node.group.name}
                            </Badge>
                        )}
                    </div>
                </div>
                
                <div className="flex items-center gap-1">
                    <ConnectionDialog sourceContactId={node.id} allContacts={allContacts}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-green-600 transition-colors" title="Add Connection">
                            <Plus className="h-4 w-4" />
                        </Button>
                    </ConnectionDialog>

                    {hasChildren && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 px-2 gap-1 text-xs"
                            onClick={() => setExpanded(!expanded)}
                        >
                            <Network className="h-3 w-3" />
                            {node.children.length} relations
                            {expanded ? <ChevronDown className="h-3 w-3 ml-1" /> : <ChevronRight className="h-3 w-3 ml-1" />}
                        </Button>
                    )}
                </div>
            </div>

            {expanded && hasChildren && (
                <div className={cn("bg-muted/5 pb-2", depth > 0 && "ml-12 border-l-2 border-primary/20")}>
                    {node.children.map((child: any) => (
                        <div key={child.id} className="flex flex-col">
                            <div className="ml-16 py-1 flex items-center gap-2">
                                <Badge variant="secondary" className="text-[9px] h-4 font-semibold px-2">
                                    {child.connectionType}
                                </Badge>
                            </div>
                            <TreeNode node={child} allContacts={allContacts} depth={depth + 1} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
