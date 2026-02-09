import { generateContent } from './gemini';
import { NODE_ENHANCEMENT_PROMPT, NODE_EXPANSION_PROMPT } from './prompts';

export async function enhanceNodeContent(
    title: string,
    description: string = '',
    notes: string = ''
): Promise<{
    title: string;
    description: string;
    notes: string;
}> {
    try {
        const prompt = NODE_ENHANCEMENT_PROMPT
            .replace('{TITLE}', title)
            .replace('{DESCRIPTION}', description)
            .replace('{NOTES}', notes);

        const response = await generateContent(prompt);

        // Clean response
        const cleanedResponse = response
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

        const parsed = JSON.parse(cleanedResponse);

        return {
            title: parsed.title || title,
            description: parsed.description || '',
            notes: parsed.notes || ''
        };
    } catch (error) {
        console.error('Node enhancement error:', error);
        throw new Error('Failed to enhance node content');
    }
}

export async function generateChildNodes(
    title: string,
    description: string = '',
    notes: string = ''
): Promise<{ title: string; description: string; notes: string }[]> {
    try {
        const prompt = NODE_EXPANSION_PROMPT
            .replace('{TITLE}', title)
            .replace('{DESCRIPTION}', description)
            .replace('{NOTES}', notes);

        const response = await generateContent(prompt);

        // Clean response
        const cleanedResponse = response
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

        const parsed = JSON.parse(cleanedResponse);

        return parsed.childNodes || [];
    } catch (error) {
        console.error('Node expansion error:', error);
        throw new Error('Failed to generate child nodes');
    }
}
