create type public.translation_feedback_status as enum ('pending', 'reviewed', 'implemented', 'rejected');

create table public.translation_feedback (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    message_key text not null,
    locale text not null,
    reported_text text not null,
    suggested_text text,
    status public.translation_feedback_status not null default 'pending',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- RLS
alter table public.translation_feedback enable row level security;

create policy "Users can submit their own feedback"
    on public.translation_feedback for insert
    to authenticated
    with check (auth.uid() = user_id);

create policy "Users can view their own feedback"
    on public.translation_feedback for select
    to authenticated
    using (auth.uid() = user_id);

create policy "Admins can view all feedback"
    on public.translation_feedback for select
    to authenticated
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
            and profiles.role = 'admin'
        )
    );

create policy "Admins can update feedback status"
    on public.translation_feedback for update
    to authenticated
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
            and profiles.role = 'admin'
        )
    );

-- Set updated_at on update
create trigger handle_translation_feedback_updated_at
    before update on public.translation_feedback
    for each row execute function public.set_updated_at();
