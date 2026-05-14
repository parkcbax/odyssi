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
                        <NetworkGraph data={data} />
                        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                            <Button variant="secondary" size="icon" className="shadow-md"><ZoomIn className="h-4 w-4" /></Button>
                            <Button variant="secondary" size="icon" className="shadow-md"><ZoomOut className="h-4 w-4" /></Button>
                            <Button variant="secondary" size="icon" className="shadow-md"><Maximize className="h-4 w-4" /></Button>
                        </div>
                        <div className="absolute top-4 left-4 bg-background/80 backdrop-blur p-3 rounded-lg border shadow-sm max-w-xs">
                            <h3 className="font-semibold text-sm mb-1">Network Map</h3>
                            <p className="text-xs text-muted-foreground">
                                Visualizing paths between contacts. Click icons to explore connections.
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

function NetworkGraph({ data }: { data: any }) {
    const [nodes, setNodes] = useState<any[]>([])
    const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set())
    
    useEffect(() => {
        if (!data || !data.contacts.length) return
        
        const { contacts, connections } = data
        const centerX = 400
        const centerY = 300
        const radius = 160
        const processedNodes: any[] = []
        const usedIds = new Set<string>()

        // Find a "Root" (hub) to start from - either the first contact or one with many links
        const sortedByLinks = [...contacts].sort((a, b) => {
            const aLinks = connections.filter((c: any) => c.sourceContactId === a.id || c.targetContactId === a.id).length
            const bLinks = connections.filter((c: any) => c.sourceContactId === b.id || c.targetContactId === b.id).length
            return bLinks - aLinks
        })
        const root = sortedByLinks[0]

        const layoutNode = (contact: any, x: number, y: number, startAngle: number, endAngle: number, depth: number) => {
            if (usedIds.has(contact.id)) return
            usedIds.add(contact.id)
            processedNodes.push({ ...contact, x, y })

            const children = connections
                .filter((c: any) => c.sourceContactId === contact.id || c.targetContactId === contact.id)
                .map((c: any) => c.sourceContactId === contact.id ? c.targetContactId : c.sourceContactId)
                .filter((id: string) => !usedIds.has(id))

            if (children.length === 0) return

            const angleRange = endAngle - startAngle
            const angleStep = angleRange / children.length
            const nextRadius = radius * Math.pow(0.8, depth) // Slightly smaller radius as we go deeper

            children.forEach((childId: string, i: number) => {
                const childContact = contacts.find((c: any) => c.id === childId)
                if (childContact) {
                    const angle = startAngle + (angleStep * i) + (angleStep / 2)
                    const nx = x + Math.cos(angle) * nextRadius
                    const ny = y + Math.sin(angle) * nextRadius
                    layoutNode(childContact, nx, ny, angle - angleStep/2, angle + angleStep/2, depth + 1)
                }
            })
        }

        layoutNode(root, centerX, centerY, 0, Math.PI * 2, 0)
        
        // Add any disconnected islands
        contacts.forEach((c: any) => {
            if (!usedIds.has(c.id)) {
                processedNodes.push({ ...c, x: Math.random() * 800, y: Math.random() * 600 })
            }
        })

        setNodes(processedNodes)
    }, [data])

    const toggleCollapse = (id: string, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        
        const descendants = new Set<string>()
        const findDescendants = (nodeId: string) => {
            const children = data.connections
                .filter((c: any) => c.sourceContactId === nodeId)
                .map((c: any) => c.targetContactId)
            
            children.forEach((childId: string) => {
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
            
            const parents = data.connections
                .filter((c: any) => c.targetContactId === nodeId)
                .map((c: any) => c.sourceContactId)
                
            for (const parentId of parents) {
                if (collapsedNodes.has(parentId)) {
                    isHidden = true
                    return true
                }
                if (checkAncestorCollapsed(parentId, visited)) {
                    return true
                }
            }
            return false
        }
        
        checkAncestorCollapsed(n.id, new Set())
        return !isHidden
    })

    const visibleEdges = data.connections.filter((conn: any) => {
        const sourceVisible = visibleNodes.some(n => n.id === conn.sourceContactId)
        const targetVisible = visibleNodes.some(n => n.id === conn.targetContactId)
        return sourceVisible && targetVisible
    }).map((conn: any) => {
        const source = nodes.find(n => n.id === conn.sourceContactId)
        const target = nodes.find(n => n.id === conn.targetContactId)
        return { source, target, type: conn.connectionType }
    }).filter((e: any) => e.source && e.target && e.source.x !== undefined && e.target.x !== undefined)

    return (
        <svg viewBox="0 0 800 600" className="w-full h-full cursor-move" preserveAspectRatio="xMidYMid meet">
            <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="35" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
                </marker>
            </defs>

            {/* Edges */}
            {visibleEdges.map((edge: any, i: number) => (
                <g key={i}>
                    <line 
                        x1={edge.source.x} y1={edge.source.y} 
                        x2={edge.target.x} y2={edge.target.y} 
                        stroke="#94a3b8" strokeWidth="1.5"
                        strokeDasharray={edge.type === "Introduced by" ? "4 2" : "none"}
                        markerEnd="url(#arrowhead)"
                        className="opacity-40"
                    />
                </g>
            ))}

            {/* Nodes */}
            {visibleNodes.map((node: any) => {
                const isCollapsed = collapsedNodes.has(node.id)
                // A node is a "hub" if it has outgoing connections OR more than 1 incoming connection
                const outgoingCount = data.connections.filter((c: any) => c.sourceContactId === node.id).length
                const incomingCount = data.connections.filter((c: any) => c.targetContactId === node.id).length
                const hasConnections = outgoingCount > 0 || incomingCount > 1

                return (
                    <g key={node.id} className="cursor-pointer group">
                        <foreignObject x={node.x - 40} y={node.y - 40} width="80" height="80" className="overflow-visible">
                            <div className="w-full h-full flex items-center justify-center">
                                <div className={cn(
                                    "w-[56px] h-[56px] relative rounded-full transition-all duration-300",
                                    isCollapsed ? "scale-75 opacity-70" : "scale-100"
                                )}>
                                    <Link href={`/relations/${node.id}`} className="block w-full h-full">
                                        <div className="w-full h-full rounded-full border-2 border-primary bg-background shadow-lg overflow-hidden flex items-center justify-center hover:ring-4 hover:ring-primary/20">
                                            {node.profilePicture ? (
                                                <img src={node.profilePicture} className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="h-6 w-6 text-muted-foreground" />
                                            )}
                                        </div>
                                    </Link>
                                    {hasConnections && (
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
                        
                        <text x={node.x} y={node.y + 45} textAnchor="middle" className="text-[10px] font-bold fill-foreground">
                            {node.fullName}
                        </text>
                    </g>
                )
            })}
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
