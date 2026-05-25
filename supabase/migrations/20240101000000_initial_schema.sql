-- Create profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text unique not null,
  avatar_url text,
  role text check (role in ('admin', 'employee')) default 'employee',
  password text,
  created_at timestamp with time zone default timezone('utc', now())
);

-- Enable RLS for profiles
alter table public.profiles enable row level security;

-- Profiles policies
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Create remote_work_entries table
create table public.remote_work_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  work_date date not null,
  created_at timestamp with time zone default timezone('utc', now()),
  updated_at timestamp with time zone default timezone('utc', now()),
  
  unique(user_id, work_date)
);

-- Enable RLS for remote_work_entries
alter table public.remote_work_entries enable row level security;

-- Remote Work Entries policies
create policy "Employees can view own entries"
  on remote_work_entries for select
  using ( auth.uid() = user_id );

create policy "Admins can view all entries"
  on remote_work_entries for select
  using ( exists (select 1 from profiles where id = auth.uid() and role = 'admin') );

create policy "Employees can insert own entries"
  on remote_work_entries for insert
  with check ( auth.uid() = user_id );

create policy "Admins can insert any entries"
  on remote_work_entries for insert
  with check ( exists (select 1 from profiles where id = auth.uid() and role = 'admin') );

create policy "Employees can update own entries"
  on remote_work_entries for update
  using ( auth.uid() = user_id );

create policy "Admins can update any entries"
  on remote_work_entries for update
  using ( exists (select 1 from profiles where id = auth.uid() and role = 'admin') );

create policy "Employees can delete own entries"
  on remote_work_entries for delete
  using ( auth.uid() = user_id );

create policy "Admins can delete any entries"
  on remote_work_entries for delete
  using ( exists (select 1 from profiles where id = auth.uid() and role = 'admin') );

-- Create indexes for performance
create index idx_remote_work_entries_date on public.remote_work_entries(work_date);
create index idx_remote_work_entries_user_date on public.remote_work_entries(user_id, work_date);

-- Trigger to auto create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), new.email, coalesce(new.raw_user_meta_data->>'role', 'employee'));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
