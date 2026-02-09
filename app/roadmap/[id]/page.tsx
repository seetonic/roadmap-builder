
"use client";

import dynamic from 'next/dynamic';
import { use, useEffect, useState } from 'react';

const FlowCanvas = dynamic(() => import('@/components/FlowCanvas'), { ssr: false });

export default function RoadmapPage({ params }: { params: Promise<{ id: string }> }) {
    // Unwrap params promise
    const { id } = use(params);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <main className="h-screen w-screen bg-background text-foreground overflow-hidden">
            <FlowCanvas projectId={id} />
        </main>
    );
}
