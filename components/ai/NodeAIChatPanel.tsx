"use client";

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, User, Bot, Trash2 } from 'lucide-react';
import { NODE_CHAT_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { ChatMessage } from '@/types';
import { clsx } from 'clsx';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface NodeAIChatPanelProps {
    nodeId: string;
    nodeTitle: string;
    nodeDescription?: string;
    nodeNotes?: string;
    chatHistory: ChatMessage[];
    onUpdateHistory: (history: ChatMessage[]) => void;
}

export default function NodeAIChatPanel({
    nodeId,
    nodeTitle,
    nodeDescription = '',
    nodeNotes = '',
    chatHistory,
    onUpdateHistory
}: NodeAIChatPanelProps) {
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatHistory]);

    // Focus input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSend = async () => {
        if (!input.trim() || isSending) return;

        const userMessage: ChatMessage = {
            role: 'user',
            content: input,
            timestamp: Date.now()
        };

        const newHistory = [...chatHistory, userMessage];
        onUpdateHistory(newHistory);
        setInput('');
        setIsSending(true);

        try {
            // Construct context-aware prompt
            const systemPrompt = NODE_CHAT_SYSTEM_PROMPT
                .replace('{TITLE}', nodeTitle)
                .replace('{DESCRIPTION}', nodeDescription)
                .replace('{NOTES}', nodeNotes);

            // Simple history formatting for context
            const conversationContext = chatHistory.slice(-5).map(msg =>
                `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}`
            ).join('\n');

            const fullPrompt = `${systemPrompt}\n\nRecent Conversation:\n${conversationContext}\nUser: ${input}\nAI:`;

            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: fullPrompt,
                    history: chatHistory.map(msg => ({
                        role: msg.role,
                        parts: msg.content
                    })),
                    context: { nodeTitle, nodeDescription, nodeNotes }
                })
            });

            if (!response.ok) throw new Error('Chat failed');

            const { response: responseText } = await response.json();

            const aiMessage: ChatMessage = {
                role: 'assistant',
                content: responseText,
                timestamp: Date.now()
            };

            onUpdateHistory([...newHistory, aiMessage]);
        } catch (error) {
            console.error('Chat error:', error);
            // Optional: Add error message to chat
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleClearChat = () => {
        onUpdateHistory([]);
    };

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                {chatHistory.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50 space-y-2">
                        <Bot size={32} />
                        <p className="text-sm">Start a conversation about this node...</p>
                    </div>
                )}

                {chatHistory.map((msg, idx) => (
                    <div
                        key={idx}
                        className={clsx(
                            "flex gap-3 max-w-[85%]",
                            msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                        )}
                    >
                        <div className={clsx(
                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                            msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        )}>
                            {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                        </div>
                        <div className={clsx(
                            "p-3 rounded-lg text-sm shadow-sm",
                            msg.role === 'user'
                                ? "bg-primary text-primary-foreground rounded-tr-none whitespace-pre-wrap"
                                : "bg-muted/50 text-foreground rounded-tl-none border border-border"
                        )}>
                            {msg.role === 'user' ? (
                                <div className="whitespace-pre-wrap">{msg.content}</div>
                            ) : (
                                <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            p: ({ ...props }) => <p {...props} className="my-1 leading-relaxed" />,
                                            h1: ({ ...props }) => <h1 {...props} className="text-lg font-bold mt-2 mb-1" />,
                                            h2: ({ ...props }) => <h2 {...props} className="text-base font-bold mt-2 mb-1" />,
                                            h3: ({ ...props }) => <h3 {...props} className="text-sm font-semibold mt-1.5 mb-0.5" />,
                                            ul: ({ ...props }) => <ul {...props} className="list-disc pl-4 my-1 space-y-0.5" />,
                                            ol: ({ ...props }) => <ol {...props} className="list-decimal pl-4 my-1 space-y-0.5" />,
                                            li: ({ ...props }) => <li {...props} className="my-0.5" />,
                                            strong: ({ ...props }) => <strong {...props} className="font-semibold" />,
                                            em: ({ ...props }) => <em {...props} className="italic" />,
                                            code: ({ ...props }) => <code {...props} className="bg-muted-foreground/20 px-1 py-0.5 rounded text-xs font-mono" />,
                                            pre: ({ ...props }) => <pre {...props} className="bg-muted-foreground/20 p-2 rounded my-1 overflow-x-auto" />,
                                            blockquote: ({ ...props }) => <blockquote {...props} className="border-l-2 border-primary/50 pl-2 italic opacity-80 my-1" />,
                                            a: ({ ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline" />,
                                        }}
                                    >
                                        {msg.content}
                                    </ReactMarkdown>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {isSending && (
                    <div className="flex gap-3 max-w-[85%] mr-auto">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5 text-muted-foreground">
                            <Bot size={14} />
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50 rounded-tl-none border border-border flex items-center shadow-sm">
                            <Loader2 className="w-4 h-4 animate-spin opacity-50" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-border bg-muted/10 space-y-2">
                {chatHistory.length > 0 && (
                    <div className="flex justify-end">
                        <button
                            onClick={handleClearChat}
                            className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
                        >
                            <Trash2 size={10} /> Clear Chat
                        </button>
                    </div>
                )}
                <div className="relative">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask AI about this node..."
                        className="w-full bg-background border border-input rounded-lg pl-3 pr-10 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none h-20 scrollbar-thin text-foreground placeholder:text-muted-foreground/70 shadow-sm"
                        disabled={isSending}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isSending}
                        className="absolute right-2 bottom-2 p-1.5 bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                        {isSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    </button>
                </div>
                <p className="text-[10px] text-muted-foreground text-center">
                    AI generated content may be inaccurate.
                </p>
            </div>
        </div>
    );
}
