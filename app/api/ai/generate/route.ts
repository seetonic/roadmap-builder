import { NextRequest, NextResponse } from 'next/server';
import { generateRoadmapFromText } from '@/lib/ai/roadmapGenerator';

export async function POST(request: NextRequest) {
    try {
        const { prompt } = await request.json();

        if (!prompt || typeof prompt !== 'string') {
            return NextResponse.json(
                { error: 'Invalid prompt provided' },
                { status: 400 }
            );
        }

        const result = await generateRoadmapFromText(prompt);

        return NextResponse.json(result);
    } catch (error) {
        console.error('Roadmap generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate roadmap' },
            { status: 500 }
        );
    }
}
