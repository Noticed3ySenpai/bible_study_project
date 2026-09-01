-- study_notes: BlockNote document per note
create table if not exists study_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  title text not null default 'Untitled',
  content jsonb not null default '[]',
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

create index if not exists idx_study_notes_user_id on study_notes (user_id);
create index if not exists idx_study_notes_updated_at on study_notes (updated_at desc);

-- Denormalized verse refs for cross-note lookup
create table if not exists note_verse_refs (
  id uuid primary key default gen_random_uuid(),
  note_id uuid references study_notes on delete cascade not null,
  user_id uuid references auth.users not null,
  osis_ref text not null,
  book text not null,
  chapter int not null,
  verse_start int not null,
  verse_end int not null
);

create index if not exists idx_note_verse_refs_note_id on note_verse_refs (note_id);
create index if not exists idx_note_verse_refs_osis on note_verse_refs (osis_ref);
create index if not exists idx_note_verse_refs_user_osis on note_verse_refs (user_id, osis_ref);

alter table study_notes enable row level security;
alter table note_verse_refs enable row level security;

create policy "Users can view own notes"
  on study_notes for select
  using (auth.uid() = user_id);

create policy "Users can insert own notes"
  on study_notes for insert
  with check (auth.uid() = user_id);

create policy "Users can update own notes"
  on study_notes for update
  using (auth.uid() = user_id);

create policy "Users can delete own notes"
  on study_notes for delete
  using (auth.uid() = user_id);

create policy "Users can view own verse refs"
  on note_verse_refs for select
  using (auth.uid() = user_id);

create policy "Users can insert own verse refs"
  on note_verse_refs for insert
  with check (auth.uid() = user_id);

create policy "Users can update own verse refs"
  on note_verse_refs for update
  using (auth.uid() = user_id);

create policy "Users can delete own verse refs"
  on note_verse_refs for delete
  using (auth.uid() = user_id);
