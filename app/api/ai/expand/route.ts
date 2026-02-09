import { NextRequest, NextResponse } from 'next/server';
import { generateChildNodes } from '@/lib/ai/nodeEnhancer';

export async function POST(request: NextRequest) {
    try {
        const { title, description, notes } = await request.json();

        if (!title || typeof title !== 'string') {
            return NextResponse.json(
                { error: 'Invalid title provided' },
                { status: 400 }
            );
        }

        const result = await generateChildNodes(title, description || '', notes || '');

        return NextResponse.json({ childNodes: result });
    } catch (error) {
        console.error('Node expansion error:', error);
        return NextResponse.json(
            { error: 'Failed to generate child nodes' },
            { status: 500 }
        );
    }
}
