import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import LocationComponent from './location-component'

export const LocationExtension = Node.create({
    name: 'locationMap',

    group: 'block',

    atom: true,

    addAttributes() {
        return {
            lat: {
                default: null,
            },
            lng: {
                default: null,
            },
            label: {
                default: null,
            },
        }
    },

    parseHTML() {
        return [
            {
                tag: 'location-map',
            },
        ]
    },

    renderHTML({ HTMLAttributes }) {
        return ['location-map', mergeAttributes(HTMLAttributes)]
    },

    addNodeView() {
        return ReactNodeViewRenderer(LocationComponent)
    },
})
