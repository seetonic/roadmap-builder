# AI Storage Database Setup

This guide will help you set up the AI generations tracking in your Supabase database.

## What's Been Added

We've created a new database table to track all AI-generated content:
- **AI Roadmap Generation** - Tracks when users generate entire roadmaps
- **AI Node Enhancement** - Tracks when users enhance node content  
- **AI Node Expansion** - Tracks when users branch nodes into sub-topics

## Setup Instructions

### Step 1: Apply the Database Migration

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file at `supabase/ai_generations_migration.sql`
4. Copy the entire SQL code
5. Paste it into the SQL Editor
6. Click **Run** to execute the migration

### Step 2: Verify the Migration

After running the migration, verify it worked:

1. Go to **Table Editor** in Supabase
2. You should see a new table called `ai_generations`
3. The table should have these columns:
   - `id` (uuid, primary key)
   - `user_id` (uuid, foreign key to auth.users)
   - `roadmap_id` (uuid, foreign key to roadmaps)
   - `generation_type` (text: roadmap/enhancement/expansion)
   - `input_data` (jsonb)
   - `output_data` (jsonb)
   - `model_used` (text, default: 'gemini-1.5-flash')
   - `tokens_used` (integer, nullable)
   - `created_at` (timestamp)

### Step 3: Check RLS Policies

The migration automatically creates Row Level Security policies:
- Users can view their own AI generations
- Users can insert their own AI generations
- Users can delete their own AI generations

## How It Works

### Automatic Tracking

The system now automatically tracks:

1. **When you generate a roadmap** (`dashboard/page.tsx`)
   - Saves the input prompt and generated nodes/edges

2. **When you enhance node content** (`NotePanel.tsx`)
   - Saves original and enhanced title/description/notes

3. **When you expand nodes** (`NotePanel.tsx`)
   - Saves parent node info and generated child nodes

### Storage Locations

All AI-generated data is stored in **two places**:

1. **Roadmap Content** (existing)
   - The `content` column in the `roadmaps` table
   - Stores the actual nodes and edges for the roadmap

2. **AI Generation History** (new)
   - The `ai_generations` table
   - Tracks what was generated, when, and by whom
   - Useful for analytics and usage monitoring

## Benefits

✅ **Usage Analytics** - Track how users interact with AI features  
✅ **Generation History** - See all AI generations for a roadmap  
✅ **Usage Limits** - Better enforcement of plan limits  
✅ **Debugging** - Investigate issues with AI generations  
✅ **Improvement** - Analyze prompts to improve AI quality

## API Reference

You can use the `aiStorage` module to query AI generation data:

```typescript
import { aiStorage } from '@/lib/aiStorage';

// Get all AI generations for a roadmap
const history = await aiStorage.getGenerationHistory(roadmapId);

// Get user's AI usage statistics
const stats = await aiStorage.getUserStats();
// Returns: { total, roadmaps, enhancements, expansions }
```

## Troubleshooting

### Migration Fails

If the migration fails:
1. Check if the table already exists
2. Drop it first: `DROP TABLE IF EXISTS ai_generations CASCADE;`
3. Run the migration again

### Data Not Saving

If AI generations aren't being saved:
1. Check browser console for errors
2. Verify RLS policies are active
3. Ensure user is authenticated
4. Check Supabase logs in the dashboard

## Next Steps

- Monitor the `ai_generations` table to see tracking in action
- Consider adding analytics dashboards using this data
- Adjust token counting if you implement usage limits
