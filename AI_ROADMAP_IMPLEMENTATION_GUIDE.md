# AI-Powered Roadmap Generation - Implementation Guide

## 🎯 Project Overview

This guide outlines the implementation of AI-powered roadmap generation for **Roadmap builder**, enabling users to:
1. **Generate roadmaps from text descriptions** using Gemini Flash (free tier)
2. **Create well-structured nodes and edges** automatically
3. **Enhance individual nodes with AI** for detailed content generation
4. **Chat with AI within nodes** to refine titles, descriptions, and notes

---

## 📋 Feature Requirements

### 1. Text-to-Roadmap Generation
**Goal:** Convert natural language descriptions into structured roadmaps with nodes and edges.

**Input Example:**
```
"Create a roadmap for building a mobile app: 
- Research phase
- Design UI/UX
- Develop frontend
- Develop backend
- Testing
- Launch"
```

**Expected Output:**
- Multiple nodes representing each phase
- Edges connecting nodes in logical sequence
- Proper positioning and layout
- Status indicators (todo, in-progress, done)

### 2. AI Node Enhancement
**Goal:** Allow users to click an "AI" button on any node to enhance its content.

**Features:**
- Generate detailed title suggestions
- Create comprehensive descriptions
- Add structured notes with best practices
- Suggest subtasks or milestones

### 3. AI Chat Interface within Nodes
**Goal:** Provide an interactive chat experience for iterative content refinement.

**Features:**
- Chat history per node
- Context-aware responses
- Ability to regenerate or modify content
- Save chat-generated content to node

---

## 🏗️ Architecture Design

### Component Structure

```
app/
├── roadmap/[id]/
│   └── page.tsx                    # Main roadmap page
components/
├── FlowCanvas.tsx                  # Main canvas (existing)
├── CustomNode.tsx                  # Node component (existing)
├── ai/
│   ├── RoadmapGeneratorModal.tsx   # Text-to-roadmap UI
│   ├── NodeAIEnhancer.tsx          # AI enhancement for nodes
│   ├── NodeAIChatPanel.tsx         # Chat interface for nodes
│   └── AILoadingIndicator.tsx      # Loading states
lib/
├── ai/
│   ├── gemini.ts                   # Gemini API client
│   ├── roadmapGenerator.ts         # Roadmap generation logic
│   ├── nodeEnhancer.ts             # Node enhancement logic
│   └── prompts.ts                  # AI prompt templates
types/
└── index.ts                        # Type definitions (existing)
```

---

## 🔧 Implementation Steps

### Step 1: Set Up Gemini Flash API

#### 1.1 Install Google Generative AI SDK
```bash
npm install @google/generative-ai
```

#### 1.2 Add API Key to Environment Variables
```env
# .env.local
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

#### 1.3 Create Gemini Client (`lib/ai/gemini.ts`)
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

export async function generateContent(prompt: string) {
  const result = await geminiFlash.generateContent(prompt);
  return result.response.text();
}

export async function startChat(history: Array<{role: string, parts: string}> = []) {
  return geminiFlash.startChat({
    history: history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.parts }]
    }))
  });
}
```

---

### Step 2: Implement Text-to-Roadmap Generation

#### 2.1 Create Prompt Template (`lib/ai/prompts.ts`)
```typescript
export const ROADMAP_GENERATION_PROMPT = `
You are an expert roadmap architect. Generate a well-structured roadmap based on the user's description.

**Instructions:**
1. Analyze the user's input and identify key phases, milestones, or tasks
2. Create nodes with clear, concise titles (max 4 words)
3. Assign appropriate status: "todo", "in-progress", or "done"
4. Create logical connections (edges) between nodes
5. Position nodes in a hierarchical flow (left to right, top to bottom)

**Output Format (JSON):**
{
  "nodes": [
    {
      "id": "unique-id",
      "type": "custom",
      "data": {
        "label": "Node Title",
        "status": "todo",
        "description": "Brief description",
        "notes": "Additional context"
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

**Generate the roadmap now (JSON only, no markdown):**
`;

export const NODE_ENHANCEMENT_PROMPT = `
You are a content enhancement specialist. Improve the following roadmap node with detailed, actionable content.

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

**Output Format (JSON):**
{
  "title": "Enhanced Title",
  "description": "Detailed description...",
  "notes": "# Objectives\n- ...\n\n# Best Practices\n- ...\n\n# Challenges\n- ...\n\n# Resources\n- ..."
}

**Generate enhanced content (JSON only):**
`;

export const NODE_CHAT_SYSTEM_PROMPT = `
You are an AI assistant helping users refine roadmap node content. 

**Context:**
- Node Title: {TITLE}
- Description: {DESCRIPTION}
- Notes: {NOTES}

**Your Role:**
- Answer questions about this node
- Suggest improvements
- Help brainstorm ideas
- Provide structured content when asked

Be concise, actionable, and helpful.
`;
```

#### 2.2 Create Roadmap Generator Logic (`lib/ai/roadmapGenerator.ts`)
```typescript
import { generateContent } from './gemini';
import { ROADMAP_GENERATION_PROMPT } from './prompts';
import { RoadmapNode, RoadmapEdge } from '@/types';

export async function generateRoadmapFromText(userInput: string): Promise<{
  nodes: RoadmapNode[];
  edges: RoadmapEdge[];
}> {
  try {
    const prompt = ROADMAP_GENERATION_PROMPT.replace('{USER_INPUT}', userInput);
    const response = await generateContent(prompt);
    
    // Clean response (remove markdown code blocks if present)
    const cleanedResponse = response
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    const parsed = JSON.parse(cleanedResponse);
    
    // Validate and sanitize
    const nodes: RoadmapNode[] = parsed.nodes.map((node: any, index: number) => ({
      id: node.id || `ai-node-${Date.now()}-${index}`,
      type: node.type || 'custom',
      data: {
        label: node.data?.label || 'Untitled',
        status: node.data?.status || 'todo',
        description: node.data?.description || '',
        notes: node.data?.notes || ''
      },
      position: node.position || { x: 250 + (index * 200), y: 100 }
    }));
    
    const edges: RoadmapEdge[] = parsed.edges.map((edge: any, index: number) => ({
      id: edge.id || `ai-edge-${Date.now()}-${index}`,
      source: edge.source,
      target: edge.target,
      type: edge.type || 'default'
    }));
    
    return { nodes, edges };
  } catch (error) {
    console.error('Roadmap generation error:', error);
    throw new Error('Failed to generate roadmap. Please try again.');
  }
}
```

#### 2.3 Create Generator Modal Component (`components/ai/RoadmapGeneratorModal.tsx`)
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
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
              placeholder="Example: Create a roadmap for launching a SaaS product with phases for research, development, testing, and launch..."
              className="w-full h-40 px-4 py-3 bg-muted border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isGenerating}
            />
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
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
              className="px-6 py-3 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors"
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

### Step 3: Implement Node AI Enhancement

#### 3.1 Create Node Enhancer Logic (`lib/ai/nodeEnhancer.ts`)
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
    
    const cleanedResponse = response
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    return JSON.parse(cleanedResponse);
  } catch (error) {
    console.error('Node enhancement error:', error);
    throw new Error('Failed to enhance node content');
  }
}
```

#### 3.2 Add AI Button to CustomNode (`components/CustomNode.tsx`)
**Modification:** Add an AI enhancement button to the existing CustomNode component.

```typescript
// Add this import
import { Sparkles } from 'lucide-react';

// Add this handler inside the component
const handleAIEnhance = async () => {
  // Trigger AI enhancement modal or inline enhancement
  // This will be connected to the NodeAIEnhancer component
};

// Add this button to the node UI (inside the node container)
<button
  onClick={handleAIEnhance}
  className="absolute -top-2 -right-2 p-1.5 bg-primary text-primary-foreground rounded-full shadow-lg hover:scale-110 transition-transform opacity-0 group-hover:opacity-100"
  title="Enhance with AI"
>
  <Sparkles className="w-3.5 h-3.5" />
</button>
```

#### 3.3 Create Node AI Enhancer Component (`components/ai/NodeAIEnhancer.tsx`)
```typescript
"use client";

import { useState } from 'react';
import { Sparkles, Loader2, Check, X } from 'lucide-react';
import { enhanceNodeContent } from '@/lib/ai/nodeEnhancer';

interface NodeAIEnhancerProps {
  nodeId: string;
  currentTitle: string;
  currentDescription?: string;
  currentNotes?: string;
  onApply: (data: { title: string; description: string; notes: string }) => void;
  onCancel: () => void;
}

export default function NodeAIEnhancer({
  nodeId,
  currentTitle,
  currentDescription = '',
  currentNotes = '',
  onApply,
  onCancel
}: NodeAIEnhancerProps) {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanced, setEnhanced] = useState<{
    title: string;
    description: string;
    notes: string;
  } | null>(null);
  const [error, setError] = useState('');

  const handleEnhance = async () => {
    setIsEnhancing(true);
    setError('');

    try {
      const result = await enhanceNodeContent(
        currentTitle,
        currentDescription,
        currentNotes
      );
      setEnhanced(result);
    } catch (err) {
      setError('Failed to enhance content. Please try again.');
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <div className="p-4 bg-muted/50 border border-border rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm">AI Enhancement</span>
        </div>
        <button onClick={onCancel} className="p-1 hover:bg-muted rounded">
          <X className="w-4 h-4" />
        </button>
      </div>

      {!enhanced && !isEnhancing && (
        <button
          onClick={handleEnhance}
          className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Enhance with AI
        </button>
      )}

      {isEnhancing && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      {enhanced && (
        <div className="space-y-3">
          <div className="p-3 bg-background border border-border rounded-lg space-y-2">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Title</p>
              <p className="font-medium">{enhanced.title}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Description</p>
              <p className="text-sm">{enhanced.description}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Notes</p>
              <pre className="text-xs whitespace-pre-wrap">{enhanced.notes}</pre>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onApply(enhanced)}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Apply Changes
            </button>
            <button
              onClick={handleEnhance}
              className="px-4 py-2 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors"
            >
              Regenerate
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
```

---

### Step 4: Implement AI Chat Interface

#### 4.1 Create Chat Panel Component (`components/ai/NodeAIChatPanel.tsx`)
```typescript
"use client";

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User } from 'lucide-react';
import { startChat } from '@/lib/ai/gemini';
import { NODE_CHAT_SYSTEM_PROMPT } from '@/lib/ai/prompts';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface NodeAIChatPanelProps {
  nodeTitle: string;
  nodeDescription?: string;
  nodeNotes?: string;
  onApplyContent?: (content: { title?: string; description?: string; notes?: string }) => void;
}

export default function NodeAIChatPanel({
  nodeTitle,
  nodeDescription = '',
  nodeNotes = '',
  onApplyContent
}: NodeAIChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hi! I'm here to help you refine "${nodeTitle}". Ask me anything or request improvements!`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const systemPrompt = NODE_CHAT_SYSTEM_PROMPT
        .replace('{TITLE}', nodeTitle)
        .replace('{DESCRIPTION}', nodeDescription)
        .replace('{NOTES}', nodeNotes);

      const chat = await startChat([
        { role: 'user', parts: systemPrompt },
        ...messages.map(m => ({ role: m.role, parts: m.content }))
      ]);

      const result = await chat.sendMessage(input);
      const response = result.response.text();

      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
            )}
            <div
              className={`max-w-[80%] px-4 py-2 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
            </div>
            <div className="px-4 py-2 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Thinking...</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask AI to improve this node..."
            className="flex-1 px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

### Step 5: Integrate AI Features into FlowCanvas

#### 5.1 Add AI Generator Button to EditorSidebar
**Modify `components/EditorSidebar.tsx`** to include a "Generate with AI" button.

```typescript
// Add import
import { Sparkles } from 'lucide-react';

// Add state in parent component (FlowCanvas)
const [showAIGenerator, setShowAIGenerator] = useState(false);

// Add button in sidebar
<button
  onClick={() => setShowAIGenerator(true)}
  className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
>
  <Sparkles className="w-4 h-4" />
  Generate with AI
</button>

// Add modal in FlowCanvas
<RoadmapGeneratorModal
  isOpen={showAIGenerator}
  onClose={() => setShowAIGenerator(false)}
  onGenerate={(nodes, edges) => {
    takeSnapshot(nodes, edges);
    setNodes(prev => [...prev, ...nodes]);
    setEdges(prev => [...prev, ...edges]);
  }}
/>
```

#### 5.2 Add AI Enhancement to NotePanel
**Modify `components/NotePanel.tsx`** to include AI enhancement and chat options.

```typescript
// Add tabs for "Edit", "AI Enhance", and "AI Chat"
const [activeTab, setActiveTab] = useState<'edit' | 'enhance' | 'chat'>('edit');

// Render appropriate component based on tab
{activeTab === 'enhance' && (
  <NodeAIEnhancer
    nodeId={selectedNode.id}
    currentTitle={selectedNode.data.label}
    currentDescription={selectedNode.data.description}
    currentNotes={selectedNode.data.notes}
    onApply={(data) => {
      // Update node with enhanced content
      setNodes(nodes =>
        nodes.map(n =>
          n.id === selectedNode.id
            ? { ...n, data: { ...n.data, ...data } }
            : n
        )
      );
      setActiveTab('edit');
    }}
    onCancel={() => setActiveTab('edit')}
  />
)}

{activeTab === 'chat' && (
  <NodeAIChatPanel
    nodeTitle={selectedNode.data.label}
    nodeDescription={selectedNode.data.description}
    nodeNotes={selectedNode.data.notes}
  />
)}
```

---

## 🎨 UI/UX Enhancements

### 1. Loading States
- Use skeleton loaders during AI generation
- Show progress indicators for long operations
- Display "AI is thinking..." messages

### 2. Error Handling
- Graceful error messages for API failures
- Retry mechanisms
- Fallback to manual editing

### 3. Visual Feedback
- Highlight AI-generated nodes with subtle glow
- Show "AI" badge on enhanced nodes
- Animate node creation

### 4. Accessibility
- Keyboard shortcuts (Ctrl+K for AI generator)
- Screen reader support
- Focus management

---

## 🔒 Security & Best Practices

### 1. API Key Management
- **Never expose API keys in client-side code**
- Use environment variables
- Consider using API routes for server-side calls

### 2. Rate Limiting
- Implement request throttling
- Cache AI responses when appropriate
- Show usage limits to users

### 3. Content Validation
- Sanitize AI-generated content
- Validate JSON structure
- Handle malformed responses

### 4. Privacy
- Don't send sensitive data to AI
- Allow users to opt-out of AI features
- Clear data retention policies

---

## 📊 Testing Strategy

### 1. Unit Tests
```typescript
// Test roadmap generation
describe('generateRoadmapFromText', () => {
  it('should generate valid nodes and edges', async () => {
    const result = await generateRoadmapFromText('Build a website');
    expect(result.nodes).toHaveLength(greaterThan(0));
    expect(result.edges).toBeDefined();
  });
});
```

### 2. Integration Tests
- Test full user flow from input to roadmap creation
- Verify AI enhancement updates node correctly
- Test chat interface message flow

### 3. Manual Testing Checklist
- [ ] Generate roadmap from various inputs
- [ ] Enhance nodes with different content
- [ ] Chat with AI for multiple turns
- [ ] Test error scenarios (invalid API key, network errors)
- [ ] Verify mobile responsiveness

---

## 🚀 Deployment Checklist

- [ ] Add `NEXT_PUBLIC_GEMINI_API_KEY` to production environment
- [ ] Test API rate limits
- [ ] Monitor AI usage costs
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Create user documentation
- [ ] Add feature announcement

---

## 📈 Future Enhancements

1. **Multi-language Support** - Generate roadmaps in different languages
2. **Template Library** - Pre-built roadmap templates
3. **Collaborative AI** - Multiple users chatting with AI
4. **Export AI Conversations** - Save chat history
5. **Voice Input** - Generate roadmaps via voice commands
6. **Smart Suggestions** - AI suggests next steps based on progress

---

## 🆘 Troubleshooting

### Common Issues

**Issue:** AI returns malformed JSON
- **Solution:** Add JSON validation and retry logic

**Issue:** API rate limit exceeded
- **Solution:** Implement exponential backoff and user notifications

**Issue:** Slow generation times
- **Solution:** Add streaming responses or progress indicators

**Issue:** Nodes overlap after generation
- **Solution:** Implement auto-layout algorithm (dagre, elk)

---

## 📚 Resources

- [Gemini API Documentation](https://ai.google.dev/docs)
- [React Flow Documentation](https://reactflow.dev/)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Prompt Engineering Guide](https://www.promptingguide.ai/)

---

## ✅ Implementation Checklist

### Phase 1: Foundation (Week 1)
- [ ] Install dependencies
- [ ] Set up Gemini API client
- [ ] Create prompt templates
- [ ] Build basic roadmap generator

### Phase 2: Core Features (Week 2)
- [ ] Implement text-to-roadmap generation
- [ ] Create generator modal UI
- [ ] Add node enhancement logic
- [ ] Build enhancement UI

### Phase 3: Advanced Features (Week 3)
- [ ] Implement AI chat interface
- [ ] Integrate chat into NotePanel
- [ ] Add loading states and error handling
- [ ] Implement auto-layout for generated nodes

### Phase 4: Polish & Testing (Week 4)
- [ ] Write tests
- [ ] Optimize performance
- [ ] Add animations and transitions
- [ ] User testing and feedback
- [ ] Documentation

---

## 🎯 Success Metrics

- **Generation Accuracy:** 90%+ of generated roadmaps are usable without major edits
- **User Adoption:** 60%+ of users try AI features
- **Enhancement Quality:** 80%+ of AI-enhanced nodes are kept
- **Performance:** AI responses within 5 seconds
- **Error Rate:** <5% API failures

---

**Good luck with your implementation! 🚀**
