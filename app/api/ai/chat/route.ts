import { NextRequest, NextResponse } from 'next/server';
import { startChat } from '@/lib/ai/gemini';

export async function POST(request: NextRequest) {
    try {
        const { message, history, context } = await request.json();

        if (!message || typeof message !== 'string') {
            return NextResponse.json(
                { error: 'Invalid message provided' },
                { status: 400 }
            );
        }

        const chat = await startChat(history || []);
        const result = await chat.sendMessage(message);
        const responseText = result.response.text();

        return NextResponse.json({ response: responseText });
    } catch (error) {
        console.error('Chat error:', error);
        return NextResponse.json(
            { error: 'Failed to process chat message' },
            { status: 500 }
        );
    }
}
