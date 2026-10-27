-- ==============================================================================
-- LIFE OS — FULL SUPABASE & POSTGRESQL SCHEMA WITH ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES & USER SETTINGS
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'Пользователь',
  timezone text not null default 'Europe/Moscow',
  language text not null default 'ru',
  theme text not null default 'dark',
  onboarding_completed boolean not null default false,
  routine jsonb not null default '{
    "wakeTime": "07:00",
    "sleepTime": "23:00",
    "workOrSchoolStart": "09:00",
    "workOrSchoolEnd": "15:00",
    "commuteMinutes": 30,
    "fixedStudyDays": [1, 2, 3, 4, 5],
    "workoutDays": [1, 3, 5],
    "restDays": [0, 6]
  }'::jsonb,
  water_settings jsonb not null default '{
    "dailyTargetMl": 2000,
    "cupSizesMl": [200, 250, 350, 500],
    "reminderIntervalHours": 2,
    "reminderStartTime": "08:30",
    "reminderEndTime": "21:00"
  }'::jsonb,
  digital_settings jsonb not null default '{
    "screenOffTime": "22:00",
    "reminderBeforeMinutes": 30,
    "detoxDayOfWeek": 0,
    "allowEmergencyExceptions": true
  }'::jsonb,
  sleep_settings jsonb not null default '{
    "targetBedtime": "22:45",
    "targetWakeTime": "07:00",
    "windDownReminderMinutes": 45
  }'::jsonb,
  sugar_settings jsonb not null default '{
    "enabled": true,
    "goalType": "cut_sugary_drinks",
    "dailyTargetChecks": 1
  }'::jsonb,
  minimum_for_today_habit_ids text[] default array[]::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
create policy "Users can view their own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);

-- 2. SUBJECTS (EDUCATION)
create table if not exists public.subjects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null default '#3b82f6',
  priority text not null check (priority in ('low', 'medium', 'high', 'urgent')),
  weekly_target_hours numeric not null default 4,
  exam_date date,
  topics text[] default array[]::text[],
  created_at timestamptz not null default now()
);

alter table public.subjects enable row level security;
create policy "Users manage own subjects" on public.subjects for all using (auth.uid() = user_id);

-- 3. STUDY GOALS
create table if not exists public.study_goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  title text not null,
  target_hours numeric not null default 10,
  completed_hours numeric not null default 0,
  deadline date,
  status text not null default 'active' check (status in ('active', 'completed', 'paused')),
  created_at timestamptz not null default now()
);

alter table public.study_goals enable row level security;
create policy "Users manage own study goals" on public.study_goals for all using (auth.uid() = user_id);

-- 4. TASKS
create table if not exists public.tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  category text not null check (category in ('education', 'fitness', 'nutrition', 'self_care', 'work', 'chores', 'recovery', 'other')),
  date date not null,
  start_time text,
  duration_minutes integer not null default 30,
  deadline timestamptz,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  status text not null default 'scheduled' check (status in ('scheduled', 'in_progress', 'completed', 'skipped', 'cancelled')),
  subtasks jsonb not null default '[]'::jsonb,
  recurrence jsonb,
  is_recurring_template boolean not null default false,
  parent_template_id uuid references public.tasks(id) on delete set null,
  subject_id uuid references public.subjects(id) on delete set null,
  notes text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tasks_user_date on public.tasks(user_id, date);
create index if not exists idx_tasks_user_status on public.tasks(user_id, status);

alter table public.tasks enable row level security;
create policy "Users manage own tasks" on public.tasks for all using (auth.uid() = user_id);

-- 5. HABITS
create table if not exists public.habits (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  category text not null,
  measurement_type text not null check (measurement_type in ('boolean', 'duration', 'count', 'volume')),
  target_value numeric not null default 1,
  unit text,
  frequency text not null check (frequency in ('daily', 'weekdays', 'weekends', 'specific_days')),
  days_of_week integer[] not null default array[0,1,2,3,4,5,6],
  preferred_time text,
  time_of_day text check (time_of_day in ('morning', 'afternoon', 'evening', 'anytime')),
  reminder_enabled boolean not null default true,
  reminder_time text,
  start_date date not null default current_date,
  end_date date,
  is_active boolean not null default true,
  is_archived boolean not null default false,
  is_optional boolean not null default false,
  sort_order integer default 0,
  created_at timestamptz not null default now()
);

alter table public.habits enable row level security;
create policy "Users manage own habits" on public.habits for all using (auth.uid() = user_id);

-- 6. HABIT LOGS
create table if not exists public.habit_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null references public.habits(id) on delete cascade,
  date date not null,
  value numeric not null default 0,
  completed boolean not null default false,
  completed_at timestamptz,
  notes text,
  constraint unique_user_habit_date unique (user_id, habit_id, date)
);

create index if not exists idx_habit_logs_user_date on public.habit_logs(user_id, date);

alter table public.habit_logs enable row level security;
create policy "Users manage own habit logs" on public.habit_logs for all using (auth.uid() = user_id);

-- 7. STUDY SESSIONS
create table if not exists public.study_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  topic text,
  start_time timestamptz not null,
  end_time timestamptz,
  duration_seconds integer not null default 0,
  planned_duration_seconds integer not null default 1500,
  break_duration_seconds integer not null default 300,
  completed boolean not null default false,
  notes text,
  date date not null
);

create index if not exists idx_study_sessions_user_date on public.study_sessions(user_id, date);

alter table public.study_sessions enable row level security;
create policy "Users manage own study sessions" on public.study_sessions for all using (auth.uid() = user_id);

-- 8. WORKOUT EXERCISES & SESSIONS
create table if not exists public.workout_exercises (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('reps', 'duration', 'weight_reps')),
  category text not null,
  default_sets integer not null default 3,
  default_reps integer,
  default_weight_kg numeric,
  default_duration_seconds integer
);

alter table public.workout_exercises enable row level security;
create policy "Users manage own workout exercises" on public.workout_exercises for all using (auth.uid() = user_id);

create table if not exists public.workout_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  title text not null default 'Тренировка',
  start_time timestamptz not null default now(),
  end_time timestamptz,
  exercises jsonb not null default '[]'::jsonb,
  completed boolean not null default false,
  feeling_score integer check (feeling_score between 1 and 5),
  notes text,
  rest_timer_seconds integer default 60
);

create index if not exists idx_workout_sessions_user_date on public.workout_sessions(user_id, date);

alter table public.workout_sessions enable row level security;
create policy "Users manage own workout sessions" on public.workout_sessions for all using (auth.uid() = user_id);

-- 9. MEALS & NUTRITION
create table if not exists public.meals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  time text not null default '12:00',
  items jsonb not null default '[]'::jsonb,
  notes text
);

create index if not exists idx_meals_user_date on public.meals(user_id, date);

alter table public.meals enable row level security;
create policy "Users manage own meals" on public.meals for all using (auth.uid() = user_id);

-- 10. WATER LOGS
create table if not exists public.water_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  timestamp timestamptz not null default now(),
  volume_ml integer not null check (volume_ml > 0)
);

create index if not exists idx_water_logs_user_date on public.water_logs(user_id, date);

alter table public.water_logs enable row level security;
create policy "Users manage own water logs" on public.water_logs for all using (auth.uid() = user_id);

-- 11. DIGITAL DISCIPLINE LOGS
create table if not exists public.digital_discipline_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  screen_off_observed boolean not null default false,
  screen_off_time_actual text,
  is_detox_day boolean not null default false,
  detox_observed boolean not null default false,
  exceptions_notes text,
  checklist_completed jsonb not null default '{
    "workFinished": false,
    "phonePutAway": false,
    "readyForTomorrow": false,
    "eveningCareDone": false
  }'::jsonb,
  constraint unique_user_digital_date unique (user_id, date)
);

alter table public.digital_discipline_logs enable row level security;
create policy "Users manage own digital logs" on public.digital_discipline_logs for all using (auth.uid() = user_id);

-- 12. SLEEP LOGS
create table if not exists public.sleep_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  bed_time text not null,
  wake_time text not null,
  total_sleep_minutes integer not null,
  quality_rating integer not null check (quality_rating between 1 and 5),
  wake_feeling text not null check (wake_feeling in ('refreshed', 'normal', 'tired', 'exhausted')),
  notes text,
  constraint unique_user_sleep_date unique (user_id, date)
);

alter table public.sleep_logs enable row level security;
create policy "Users manage own sleep logs" on public.sleep_logs for all using (auth.uid() = user_id);

-- 13. DAILY CHECK-INS
create table if not exists public.daily_checkins (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  energy_level integer not null check (energy_level between 1 and 5),
  available_free_hours numeric not null default 4,
  has_special_constraints boolean not null default false,
  constraint_notes text,
  lighten_load_requested boolean not null default false,
  timestamp timestamptz not null default now(),
  constraint unique_user_checkin_date unique (user_id, date)
);

alter table public.daily_checkins enable row level security;
create policy "Users manage own checkins" on public.daily_checkins for all using (auth.uid() = user_id);

-- 14. DAILY PLANS
create table if not exists public.daily_plans (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  slots jsonb not null default '[]'::jsonb,
  generated_at timestamptz not null default now(),
  last_recalculated_at timestamptz,
  is_overloaded boolean not null default false,
  conflict_details text[] default array[]::text[],
  total_scheduled_minutes integer not null default 0,
  available_minutes integer not null default 0,
  constraint unique_user_plan_date unique (user_id, date)
);

alter table public.daily_plans enable row level security;
create policy "Users manage own daily plans" on public.daily_plans for all using (auth.uid() = user_id);

-- 15. NOTIFICATIONS
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  category text not null,
  scheduled_time timestamptz not null,
  delivered boolean not null default false,
  read boolean not null default false,
  action_url text,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;
create policy "Users manage own notifications" on public.notifications for all using (auth.uid() = user_id);
