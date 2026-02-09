-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create roadmaps table
create table if not exists roadmaps (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  content jsonb default '{}'::jsonb,
  user_id uuid references auth.users(id) on delete cascade,
  visibility text check (visibility in ('private', 'public')) default 'private',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create roadmaps shares table
create table if not exists roadmap_shares (
  roadmap_id uuid references roadmaps(id) on delete cascade,
  email text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (roadmap_id, email)
);

-- Create profiles table
create table if not exists profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  display_name text,
  email text,
  avatar_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table roadmaps enable row level security;
alter table roadmap_shares enable row level security;
alter table profiles enable row level security;

-- RLS Policies for roadmaps

-- Users can view their own roadmaps
create policy "Users can view own roadmaps"
  on roadmaps for select
  using (auth.uid() = user_id);

-- Users can insert their own roadmaps
create policy "Users can insert own roadmaps"
  on roadmaps for insert
  with check (auth.uid() = user_id);

-- Users can update their own roadmaps
create policy "Users can update own roadmaps"
  on roadmaps for update
  using (auth.uid() = user_id);

-- Users can delete their own roadmaps
create policy "Users can delete own roadmaps"
  on roadmaps for delete
  using (auth.uid() = user_id);

-- Public roadmaps are viewable by everyone
create policy "Public roadmaps are viewable by everyone"
  on roadmaps for select
  using (visibility = 'public');

-- Shared roadmaps are viewable by shared users
create policy "Users can view shared roadmaps"
  on roadmaps for select
  using (
    exists (
      select 1 from roadmap_shares
      where roadmap_shares.roadmap_id = roadmaps.id
      and roadmap_shares.email = (auth.jwt() ->> 'email')
    )
  );
  
-- RLS Policies for roadmap_shares

-- Users can view shares for their email (no circular dependency)
create policy "Users can view their shares"
  on roadmap_shares for select
  using (email = (auth.jwt() ->> 'email'));

-- Owners can insert shares
create policy "Owners can insert shares"
  on roadmap_shares for insert
  with check (
    roadmap_id in (
      select id from roadmaps where user_id = auth.uid()
    )
  );

-- Owners can update shares
create policy "Owners can update shares"
  on roadmap_shares for update
  using (
    roadmap_id in (
      select id from roadmaps where user_id = auth.uid()
    )
  );

-- Owners can delete shares
create policy "Owners can delete shares"
  on roadmap_shares for delete
  using (
    roadmap_id in (
      select id from roadmaps where user_id = auth.uid()
    )
  );

-- RLS Policies for profiles

-- Public profiles are viewable by everyone (optional, if you want public profiles)
create policy "Public profiles are viewable by everyone"
  on profiles for select
  using (true);

-- Users can update own profile
create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- Users can insert own profile (usually handled by trigger, but just in case)
create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- Users can delete own profile
create policy "Users can delete own profile"
  on profiles for delete
  using (auth.uid() = id);

-- Function and Trigger for New User Creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists to avoid error on rerun
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
