-- AI Generations tracking table
create table if not exists ai_generations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  roadmap_id uuid references roadmaps(id) on delete cascade,
  generation_type text check (generation_type in ('roadmap', 'enhancement', 'expansion')) not null,
  
  -- Input data
  input_data jsonb,
  
  -- Output data
  output_data jsonb not null,
  
  -- Metadata
  model_used text default 'gemini-1.5-flash',
  tokens_used integer,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create index for faster queries
create index if not exists ai_generations_user_id_idx on ai_generations(user_id);
create index if not exists ai_generations_roadmap_id_idx on ai_generations(roadmap_id);
create index if not exists ai_generations_created_at_idx on ai_generations(created_at desc);

-- Enable RLS
alter table ai_generations enable row level security;

-- RLS Policies for ai_generations

-- Users can view their own AI generations
create policy "Users can view own ai_generations"
  on ai_generations for select
  using (auth.uid() = user_id);

-- Users can insert their own AI generations
create policy "Users can insert own ai_generations"
  on ai_generations for insert
  with check (auth.uid() = user_id);

-- Users can delete their own AI generations
create policy "Users can delete own ai_generations"
  on ai_generations for delete
  using (auth.uid() = user_id);
