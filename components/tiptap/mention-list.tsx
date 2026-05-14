"use client"

import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useState,
} from 'react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User } from "lucide-react"

export const MentionList = forwardRef((props: any, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)

    const selectItem = (index: number) => {
        const item = props.items[index]

        if (item) {
            props.command({ id: item.id, label: item.fullName })
        }
    }

    const upHandler = () => {
        setSelectedIndex(((selectedIndex + props.items.length) - 1) % props.items.length)
    }

    const downHandler = () => {
        setSelectedIndex((selectedIndex + 1) % props.items.length)
    }

    const enterHandler = () => {
        selectItem(selectedIndex)
    }

    useEffect(() => setSelectedIndex(0), [props.items])

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }: { event: KeyboardEvent }) => {
            if (event.key === 'ArrowUp') {
                upHandler()
                return true
            }

            if (event.key === 'ArrowDown') {
                downHandler()
                return true
            }

            if (event.key === 'Enter') {
                enterHandler()
                return true
            }

            return false
        },
    }))

    return (
        <div className="bg-background border rounded-lg shadow-lg overflow-hidden min-w-[150px] z-50">
            {props.items.length ? (
                <div className="flex flex-col p-1">
                    {props.items.map((item: any, index: number) => (
                        <button
                            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md text-left transition-colors ${index === selectedIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
                                }`}
                            key={index}
                            onClick={() => selectItem(index)}
                        >
                            <Avatar className="h-6 w-6">
                                <AvatarImage src={item.profilePicture || undefined} />
                                <AvatarFallback><User className="h-3 w-3" /></AvatarFallback>
                            </Avatar>
                            <span>{item.fullName}</span>
                        </button>
                    ))}
                </div>
            ) : (
                <div className="p-3 text-sm text-muted-foreground italic">No contacts found</div>
            )}
        </div>
    )
})

MentionList.displayName = 'MentionList'
