# AI Roadmap - Copy-Paste Code Examples

## 🚀 Ready-to-Use Code Snippets

### 1. Gemini API Client (`lib/ai/gemini.ts`)

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

export const geminiFlash = genAI.getGenerativeModel({ 
  model: 'gemini-2.0-flash-exp',
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

export async function startChat(history: Array<{role: string, parts: string}> = []) {
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
```

---

### 2. Prompt Templates (`lib/ai/prompts.ts`)

```typescript
export const ROADMAP_GENERATION_PROMPT = `You are an expert roadmap architect. Generate a well-structured roadmap based on the user's description.

**Instructions:**
1. Analyze the user's input and identify key phases, milestones, or tasks
2. Create nodes with clear, concise titles (max 4 words)
3. Assign appropriate status: "todo", "in-progress", or "done"
4. Create logical connections (edges) between nodes
5. Position nodes in a hierarchical flow (left to right, top to bottom)
6. Start X positions at 250 and increment by 300 for each level
7. Start Y positions at 100 and increment by 150 for parallel nodes

**Output Format (JSON ONLY, NO MARKDOWN):**
{
  "nodes": [
    {
      "id": "unique-id",
      "type": "custom",
      "data": {
        "label": "Node Title",
        "status": "todo",
        "description": "Brief description",
        "notes": ""
      },
      "position": { "x": 250, "y": 100 }
    }
  ],
  "edges": [
    {
      "id": "edge-id",
      "source": "source-node-id",
      "target": "target-node-id",
      "type": "default"
    }
  ]
}

**User Input:**
{USER_INPUT}

**Generate the roadmap now (JSON only, no markdown code blocks):**`;

export const NODE_ENHANCEMENT_PROMPT = `You are a content enhancement specialist. Improve the following roadmap node with detailed, actionable content.

**Current Node:**
- Title: {TITLE}
- Description: {DESCRIPTION}
- Notes: {NOTES}

**Instructions:**
1. Suggest a clear, professional title (if current title is vague)
2. Write a comprehensive description (2-3 sentences)
3. Add structured notes with:
   - Key objectives
   - Best practices
   - Potential challenges
   - Resources or tools

**Output Format (JSON ONLY, NO MARKDOWN):**
{
  "title": "Enhanced Title",
  "description": "Detailed description...",
  "notes": "# Objectives\\n- ...\\n\\n# Best Practices\\n- ...\\n\\n# Challenges\\n- ...\\n\\n# Resources\\n- ..."
}

**Generate enhanced content (JSON only, no markdown code blocks):**`;

export const NODE_CHAT_SYSTEM_PROMPT = `You are an AI assistant helping users refine roadmap node content. 

**Context:**
- Node Title: {TITLE}
- Description: {DESCRIPTION}
- Notes: {NOTES}

**Your Role:**
- Answer questions about this node
- Suggest improvements
- Help brainstorm ideas
- Provide structured content when asked
- Be concise, actionable, and helpful

When suggesting content updates, format them clearly so users can easily copy them.`;
```

---

### 3. Roadmap Generator Logic (`lib/ai/roadmapGenerator.ts`)

```typescript
import { generateContent } from './gemini';
import { ROADMAP_GENERATION_PROMPT } from './prompts';
import { RoadmapNode, RoadmapEdge } from '@/types';

export async function generateRoadmapFromText(userInput: string): Promise<{
  nodes: RoadmapNode[];
  edges: RoadmapEdge[];
}> {
  if (!userInput.trim()) {
    throw new Error('Please provide a description');
  }

  try {
    const prompt = ROADMAP_GENERATION_PROMPT.replace('{USER_INPUT}', userInput);
    const response = await generateContent(prompt);
    
    // Clean response - remove markdown code blocks if present
    const cleanedResponse = response
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    // Parse JSON
    const parsed = JSON.parse(cleanedResponse);
    
    // Validate structure
    if (!parsed.nodes || !Array.isArray(parsed.nodes)) {
      throw new Error('Invalid response structure');
    }
    
    // Sanitize and validate nodes
    const nodes: RoadmapNode[] = parsed.nodes.map((node: any, index: number) => ({
      id: node.id || `ai-node-${Date.now()}-${index}`,
      type: node.type || 'custom',
      data: {
        label: node.data?.label || 'Untitled',
        status: ['todo', 'in-progress', 'done'].includes(node.data?.status) 
          ? node.data.status 
          : 'todo',
        description: node.data?.description || '',
        notes: node.data?.notes || '',
        aiGenerated: true
      },
      position: node.position || { 
        x: 250 + (index * 300), 
        y: 100 + (Math.floor(index / 3) * 150) 
      }
    }));
    
    // Sanitize and validate edges
    const edges: RoadmapEdge[] = (parsed.edges || []).map((edge: any, index: number) => ({
      id: edge.id || `ai-edge-${Date.now()}-${index}`,
      source: edge.source,
      target: edge.target,
      type: edge.type || 'default'
    }));
    
    return { nodes, edges };
  } catch (error) {
    console.error('Roadmap generation error:', error);
    if (error instanceof SyntaxError) {
      throw new Error('AI returned invalid format. Please try again.');
    }
    throw new Error('Failed to generate roadmap. Please try again.');
  }
}
```

---

### 4. Node Enhancer Logic (`lib/ai/nodeEnhancer.ts`)

```typescript
import { generateContent } from './gemini';
import { NODE_ENHANCEMENT_PROMPT } from './prompts';

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
```

---

### 5. Roadmap Generator Modal (`components/ai/RoadmapGeneratorModal.tsx`)

```typescript
"use client";

import { useState } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { generateRoadmapFromText } from '@/lib/ai/roadmapGenerator';
import { RoadmapNode, RoadmapEdge } from '@/types';

interface RoadmapGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (nodes: RoadmapNode[], edges: RoadmapEdge[]) => void;
}

export default function RoadmapGeneratorModal({
  isOpen,
  onClose,
  onGenerate
}: RoadmapGeneratorModalProps) {
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!input.trim()) {
      setError('Please enter a description');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const { nodes, edges } = await generateRoadmapFromText(input);
      onGenerate(nodes, edges);
      onClose();
      setInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleGenerate();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-gradient-to-r from-primary/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">AI Roadmap Generator</h2>
              <p className="text-sm text-muted-foreground">Describe your roadmap, AI will create it</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            disabled={isGenerating}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Describe your roadmap
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Example: Create a roadmap for launching a SaaS product with phases for research, development, testing, and launch..."
              className="w-full h-40 px-4 py-3 bg-muted border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              disabled={isGenerating}
              autoFocus
            />
            <p className="text-xs text-muted-foreground mt-2">
              Tip: Press Ctrl+Enter to generate
            </p>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive flex items-start gap-2">
              <span className="text-lg">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !input.trim()}
              className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Roadmap
                </>
              )}
            </button>
            <button
              onClick={onClose}
              disabled={isGenerating}
              className="px-6 py-3 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

### 6. Integration into FlowCanvas (`components/FlowCanvas.tsx`)

**Add these imports:**
```typescript
import RoadmapGeneratorModal from './ai/RoadmapGeneratorModal';
```

**Add state:**
```typescript
const [showAIGenerator, setShowAIGenerator] = useState(false);
```

**Add modal before closing div:**
```typescript
<RoadmapGeneratorModal
  isOpen={showAIGenerator}
  onClose={() => setShowAIGenerator(false)}
  onGenerate={(nodes, edges) => {
    // Take snapshot for undo/redo
    takeSnapshot(nodes, edges);
    
    // Add new nodes and edges to canvas
    setNodes(prev => [...prev, ...nodes]);
    setEdges(prev => [...prev, ...edges]);
    
    // Optional: Show success toast
    console.log(`Generated ${nodes.length} nodes and ${edges.length} edges`);
  }}
/>
```

---

### 7. Add Button to EditorSidebar (`components/EditorSidebar.tsx`)

**Add this prop to interface:**
```typescript
interface EditorSidebarProps {
  // ... existing props
  onGenerateAI?: () => void;
}
```

**Add button in the sidebar:**
```typescript
{!readOnly && (
  <button
    onClick={onGenerateAI}
    className="w-full px-4 py-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
  >
    <Sparkles className="w-4 h-4" />
    Generate with AI
  </button>
)}
```

**Update FlowCanvas to pass the prop:**
```typescript
<EditorSidebar
  // ... existing props
  onGenerateAI={() => setShowAIGenerator(true)}
/>
```

---

### 8. Environment Variables

**Add to `.env.local`:**
```env
NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here
```

**Get your API key:**
1. Go to https://makersuite.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the key
5. Paste into `.env.local`

---

### 9. Install Dependencies

```bash
npm install @google/generative-ai
```

---

### 10. Type Definitions (Add to `types/index.ts`)

```typescript
// Extend existing RoadmapNode interface
export interface RoadmapNode extends Node {
  id: string;
  type: 'custom' | 'section';
  data: {
    label: string;
    status?: 'todo' | 'in-progress' | 'done';
    description?: string;
    notes?: string;
    aiGenerated?: boolean;  // NEW: Flag for AI-created nodes
    aiEnhanced?: boolean;   // NEW: Flag for AI-enhanced nodes
  };
  position: { x: number; y: number };
}

// NEW: AI-specific types
export interface AIGeneratedRoadmap {
  nodes: RoadmapNode[];
  edges: RoadmapEdge[];
}

export interface EnhancedNodeContent {
  title: string;
  description: string;
  notes: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
}
```

---

## 🧪 Testing Examples

### Test Roadmap Generation

```typescript
// Test in browser console or create a test file
import { generateRoadmapFromText } from '@/lib/ai/roadmapGenerator';

const testInput = "Create a roadmap for building a mobile app: research, design, development, testing, launch";

generateRoadmapFromText(testInput)
  .then(result => {
    console.log('Generated nodes:', result.nodes);
    console.log('Generated edges:', result.edges);
  })
  .catch(error => {
    console.error('Error:', error);
  });
```

### Test Node Enhancement

```typescript
import { enhanceNodeContent } from '@/lib/ai/nodeEnhancer';

enhanceNodeContent('Research', '', '')
  .then(result => {
    console.log('Enhanced content:', result);
  })
  .catch(error => {
    console.error('Error:', error);
  });
```

---

## 🎨 Styling Utilities

**Add to your global CSS or Tailwind config:**

```css
/* AI-specific animations */
@keyframes ai-pulse {
  0%, 100% {
    opacity: 1;
    box-shadow: 0 0 0 0 rgba(var(--primary), 0.7);
  }
  50% {
    opacity: 0.8;
    box-shadow: 0 0 0 10px rgba(var(--primary), 0);
  }
}

.ai-generating {
  animation: ai-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* AI node highlight */
.ai-node {
  position: relative;
}

.ai-node::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: inherit;
  background: linear-gradient(45deg, var(--primary), var(--primary-foreground));
  opacity: 0.1;
  z-index: -1;
}
```

---

## 🚀 Quick Start Commands

```bash
# 1. Install dependencies
npm install @google/generative-ai

# 2. Create directory structure
mkdir -p lib/ai components/ai

# 3. Create files (copy code from above)
# - lib/ai/gemini.ts
# - lib/ai/prompts.ts
# - lib/ai/roadmapGenerator.ts
# - lib/ai/nodeEnhancer.ts
# - components/ai/RoadmapGeneratorModal.tsx

# 4. Add API key to .env.local
echo "NEXT_PUBLIC_GEMINI_API_KEY=your_key_here" >> .env.local

# 5. Restart dev server
npm run dev
```

---

## ✅ Implementation Checklist

- [ ] Install `@google/generative-ai`
- [ ] Create `lib/ai/gemini.ts`
- [ ] Create `lib/ai/prompts.ts`
- [ ] Create `lib/ai/roadmapGenerator.ts`
- [ ] Create `components/ai/RoadmapGeneratorModal.tsx`
- [ ] Add state to `FlowCanvas.tsx`
- [ ] Add modal to `FlowCanvas.tsx`
- [ ] Update `EditorSidebar.tsx` with button
- [ ] Add API key to `.env.local`
- [ ] Test generation with sample input
- [ ] Add error handling
- [ ] Add loading states
- [ ] Test on mobile
- [ ] Deploy with API key in production env

---

**You're ready to implement! Start with the Gemini client and work your way up. 🚀**
