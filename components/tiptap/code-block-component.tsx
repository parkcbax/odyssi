import { NodeViewContent, NodeViewWrapper } from '@tiptap/react'
import React, { useState } from 'react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Terminal, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const LANGUAGES = [
    { label: 'Plain Text', value: 'plaintext' },
    { label: 'Python', value: 'python' },
    { label: 'JavaScript', value: 'javascript' },
    { label: 'TypeScript', value: 'typescript' },
    { label: 'C', value: 'c' },
    { label: 'C++', value: 'cpp' },
    { label: 'Java', value: 'java' },
    { label: 'Rust', value: 'rust' },
    { label: 'Go', value: 'go' },
    { label: 'Docker', value: 'dockerfile' },
    { label: 'YAML', value: 'yaml' },
    { label: 'Shell/Bash', value: 'bash' },
    { label: 'XML/HTML', value: 'xml' },
    { label: 'JSON', value: 'json' },
]

export const CodeBlockComponent = ({ node, updateAttributes, extension, editor }: any) => {
    const { language } = node.attrs
    const isEditable = editor?.isEditable
    const selectedLanguage = LANGUAGES.find(l => l.value === (language || 'plaintext'))
    const [copied, setCopied] = useState(false)

    const handleCopy = () => {
        const text = node.textContent
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <NodeViewWrapper className="code-block my-6 border rounded-lg overflow-hidden group transition-all ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
            <div className="flex items-center justify-between bg-muted/50 px-3 py-1.5 border-b text-xs font-medium text-muted-foreground">
                <div className="flex items-center gap-2">
                    <Terminal className="h-3.5 w-3.5" />
                    {isEditable ? (
                        <Select
                            value={language || 'plaintext'}
                            onValueChange={(value) => updateAttributes({ language: value === 'plaintext' ? null : value })}
                        >
                            <SelectTrigger className="h-6 w-auto min-w-[100px] text-[10px] bg-transparent border-none shadow-none hover:bg-muted p-0 px-1 gap-1 focus:ring-0">
                                <SelectValue placeholder="Language" />
                            </SelectTrigger>
                            <SelectContent>
                                {LANGUAGES.map(lang => (
                                    <SelectItem key={lang.value} value={lang.value} className="text-[10px]">
                                        {lang.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ) : (
                        <span className="text-[10px]">
                            {selectedLanguage?.label || 'Plain Text'}
                        </span>
                    )}
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 hover:bg-muted-foreground/10"
                    onClick={handleCopy}
                >
                    {copied ? (
                        <Check className="h-3 w-3 text-green-500" />
                    ) : (
                        <Copy className="h-3 w-3" />
                    )}
                </Button>
            </div>
            <pre className="m-0 p-4 bg-transparent border-none rounded-none overflow-x-auto ring-0 focus:ring-0">
                <NodeViewContent as="div" className="font-mono text-sm leading-relaxed" />
            </pre>
        </NodeViewWrapper>
    )
}
