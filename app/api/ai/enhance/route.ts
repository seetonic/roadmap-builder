import { NextRequest, NextResponse } from 'next/server';
import { enhanceNodeContent } from '@/lib/ai/nodeEnhancer';

export async function POST(request: NextRequest) {
    try {
        const { title, description, notes } = await request.json();

        if (!title || typeof title !== 'string') {
            return NextResponse.json(
                { error: 'Invalid title provided' },
                { status: 400 }
            );
        }

        const result = await enhanceNodeContent(title, description || '', notes || '');

        return NextResponse.json(result);
    } catch (error) {
        console.error('Node enhancement error:', error);
        return NextResponse.json(
            { error: 'Failed to enhance node content' },
            { status: 500 }
        );
    }
}
