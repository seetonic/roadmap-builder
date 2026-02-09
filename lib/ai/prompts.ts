export const ROADMAP_GENERATION_PROMPT = `You are an expert roadmap architect. Generate a well-structured roadmap based on the user's description.

**Instructions:**
1. **Structure**: Create a "Spine and Rib" layout.
   - **Main Topics**: Form a vertical "Spine" (Top to Bottom).
   - **Sub Topics**: Branch off horizontally from their Main Topic parent (Left or Right).
2. **Nodes**:
   - **First Node** (Root): Status "none", marked as Main.
   - **Main Topics**: Status "todo", marked as Main.
   - **Sub Topics**: Status "todo", marked as Sub.
3. **Edges**:
   - **Main-to-Main**: Vertical, "dashed" line.
   - **Main-to-Sub**: Horizontal, "dotted" line.

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
        "notes": "",
        "isSubNode": false // false for Main Chain, true for Sub Topics
      },
      "position": { "x": 0, "y": 0 }
    }
  ],
  "edges": [
    {
      "id": "edge-id",
      "source": "source-node-id",
      "target": "target-node-id",
      "type": "default",
      "data": {
        "lineStyle": "dashed" // "dashed" for vertical spine, "dotted" for horizontal ribs
      }
    }
  ]
}

**User Input:**
{USER_INPUT}

**Generate the roadmap now (JSON only, no markdown code blocks):**`;

export const NODE_ENHANCEMENT_PROMPT = `You are a content enhancement specialist. Improve the following roadmap node with high-quality, concise content.

**Current Node:**
- Title: {TITLE}
- Description: {DESCRIPTION}
- Notes: {NOTES}

**Instructions:**
1. **Title**: Profound, short, and punchy (max 5 words).
2. **Description**: Concise and impactful (max 2 short sentences).
3. **Notes**: Detailed, comprehensive, and well-structured using Markdown. Include:
   - Key objectives (bullet points)
   - Detailed explanation or context
   - Actionable steps or best practices
   - Potential challenges
   - Resources or tools (if applicable)

**Output Format (JSON ONLY, NO MARKDOWN):**
{
  "title": "Enhanced Title",
  "description": "Short description...",
  "notes": "## Objectives\\n- ...\\n\\n## Context\\n...\\n\\n## Actionable Steps\\n- ...\\n\\n## Challenges\\n- ..."
}

**Generate enhanced content (JSON only, no markdown code blocks):**`;

export const NODE_EXPANSION_PROMPT = `You are a roadmap architect. Generate 3-5 child nodes (sub-topics) based on the current node context to expand the roadmap.

**Parent Node:**
- Title: {TITLE}
- Description: {DESCRIPTION}
- Notes: {NOTES}

**Instructions:**
1. Identify 3 to 5 logical sub-topics or next steps that branch off from this parent node.
2. For each child node, provide:
   - **Title**: Short and clear.
   - **Description**: Brief summary.
   - **Notes**: A starting point for detailed notes (can be brief).

**Output Format (JSON ONLY, NO MARKDOWN):**
{
  "childNodes": [
    {
      "title": "Sub Topic 1",
      "description": "Description...",
      "notes": "Initial notes..."
    }
  ]
}

**Generate child nodes (JSON only, no markdown code blocks):**`;

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
