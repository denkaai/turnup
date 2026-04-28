-- ============================================
-- TURNUP DATABASE SCHEMA
-- Run this in your Supabase SQL editor
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- ============================================
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  age integer check (age >= 18 and age <= 35),
  gender text check (gender in ('male', 'female', 'other')),
  campus text not null,
  course text,
  year integer check (year between 1 and 6),
  bio text,
  photos text[] default '{}',
  interests text[] default '{}',
  looking_for text default 'everyone',
  verified boolean default false,
  premium boolean default false,
  premium_until timestamptz,
  online boolean default false,
  last_seen timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table public.profiles enable row level security;

create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  using (auth.role() = 'authenticated');

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ============================================
-- SWIPES TABLE
-- ============================================
create table if not exists public.swipes (
  id uuid default uuid_generate_v4() primary key,
  swiper_id uuid references public.profiles(id) on delete cascade not null,
  target_id uuid references public.profiles(id) on delete cascade not null,
  action text check (action in ('like', 'pass', 'superlike')) not null,
  created_at timestamptz default now(),
  unique(swiper_id, target_id)
);

alter table public.swipes enable row level security;

create policy "Users can insert their own swipes"
  on public.swipes for insert
  with check (auth.uid() = swiper_id);

create policy "Users can view their own swipes"
  on public.swipes for select
  using (auth.uid() = swiper_id or auth.uid() = target_id);

-- ============================================
-- MATCHES TABLE
-- ============================================
create table if not exists public.matches (
  id uuid default uuid_generate_v4() primary key,
  user1_id uuid references public.profiles(id) on delete cascade not null,
  user2_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user1_id, user2_id)
);

alter table public.matches enable row level security;

create policy "Users can view their own matches"
  on public.matches for select
  using (auth.uid() = user1_id or auth.uid() = user2_id);

create policy "Users can insert matches"
  on public.matches for insert
  with check (auth.uid() = user1_id);

-- ============================================
-- MESSAGES TABLE
-- ============================================
create table if not exists public.messages (
  id uuid default uuid_generate_v4() primary key,
  match_id uuid references public.matches(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  read boolean default false,
  created_at timestamptz default now()
);

alter table public.messages enable row level security;

create policy "Users can view messages in their matches"
  on public.messages for select
  using (
    exists (
      select 1 from public.matches m
      where m.id = match_id
      and (m.user1_id = auth.uid() or m.user2_id = auth.uid())
    )
  );

create policy "Users can send messages in their matches"
  on public.messages for insert
  with check (
    auth.uid() = sender_id and
    exists (
      select 1 from public.matches m
      where m.id = match_id
      and (m.user1_id = auth.uid() or m.user2_id = auth.uid())
    )
  );

-- ============================================
-- EVENTS TABLE
-- ============================================
create table if not exists public.events (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  date date not null,
  time text,
  location text,
  campus text default 'All Campuses',
  attendees integer default 0,
  max_attendees integer default 200,
  image_url text,
  price integer default 0,
  organizer text,
  category text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

alter table public.events enable row level security;

create policy "Events are viewable by authenticated users"
  on public.events for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can create events"
  on public.events for insert
  with check (auth.uid() = created_by);

-- ============================================
-- EVENT ATTENDEES TABLE
-- ============================================
create table if not exists public.event_attendees (
  id uuid default uuid_generate_v4() primary key,
  event_id uuid references public.events(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(event_id, user_id)
);

alter table public.event_attendees enable row level security;

create policy "Users can see event attendees"
  on public.event_attendees for select
  using (auth.role() = 'authenticated');

create policy "Users can join events"
  on public.event_attendees for insert
  with check (auth.uid() = user_id);

create policy "Users can leave events"
  on public.event_attendees for delete
  using (auth.uid() = user_id);

-- ============================================
-- PAYMENTS TABLE
-- ============================================
create table if not exists public.payments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id),
  checkout_request_id text,
  mpesa_receipt text,
  phone text,
  amount integer,
  plan text,
  status text default 'pending',
  created_at timestamptz default now()
);

alter table public.payments enable row level security;

create policy "Users can view their own payments"
  on public.payments for select
  using (auth.uid() = user_id);

-- ============================================
-- Enable Realtime for messages
-- ============================================
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.matches;

-- ============================================
-- Auto-update updated_at on profiles
-- ============================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_profile_updated
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();
