import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

export const geminiFlash = genAI.getGenerativeModel({
    model: 'gemini-flash-latest',
    generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
    }
});

export async function generateContent(prompt: string): Promise<string> {
    try {
        const result = await geminiFlash.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error('Gemini API Error:', error);
        throw new Error('Failed to generate content');
    }
}

export async function startChat(history: Array<{ role: string, parts: string }> = []) {
    return geminiFlash.startChat({
        history: history.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.parts }]
        })),
        generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 2048,
        }
    });
}
