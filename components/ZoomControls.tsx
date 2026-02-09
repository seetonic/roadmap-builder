"use client";

import { useReactFlow } from '@xyflow/react';
import { ZoomIn, ZoomOut } from 'lucide-react';

export default function ZoomControls() {
    const { zoomIn, zoomOut } = useReactFlow();

    return (
        <div className="fixed bottom-20 right-4 md:bottom-8 md:right-8 z-40 flex flex-col gap-2">
            {/* Zoom In Button */}
            <button
                onClick={() => zoomIn({ duration: 300 })}
                className="p-3 md:p-4 bg-card/80 backdrop-blur-md border border-border/50 rounded-xl transition-all hover:bg-muted hover:scale-105 text-muted-foreground hover:text-foreground shadow-xl group"
                title="Zoom In"
                aria-label="Zoom In"
            >
                <ZoomIn size={20} className="md:w-6 md:h-6" />
                <span className="hidden md:block absolute right-full top-1/2 -translate-y-1/2 mr-2 px-2 py-1 bg-popover text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-border pointer-events-none text-foreground shadow-md">
                    Zoom In
                </span>
            </button>

            {/* Zoom Out Button */}
            <button
                onClick={() => zoomOut({ duration: 300 })}
                className="p-3 md:p-4 bg-card/80 backdrop-blur-md border border-border/50 rounded-xl transition-all hover:bg-muted hover:scale-105 text-muted-foreground hover:text-foreground shadow-xl group"
                title="Zoom Out"
                aria-label="Zoom Out"
            >
                <ZoomOut size={20} className="md:w-6 md:h-6" />
                <span className="hidden md:block absolute right-full top-1/2 -translate-y-1/2 mr-2 px-2 py-1 bg-popover text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-border pointer-events-none text-foreground shadow-md">
                    Zoom Out
                </span>
            </button>
        </div>
    );
}
