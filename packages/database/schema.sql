create extension if not exists vector;
create extension if not exists pg_trgm;
create extension if not exists pgcrypto;

create table if not exists tracks (
  id text primary key,
  title text not null,
  artist text not null,
  album text,
  artwork_url text,
  apple_music_url text,
  external_url text,
  source text not null,
  source_label text not null,
  confidence numeric(4, 3) not null default 0.7,
  bpm numeric(6, 2) not null,
  key_name text not null,
  mode text not null check (mode in ('major', 'minor')),
  camelot text not null,
  energy numeric(5, 4) not null,
  danceability numeric(5, 4) not null,
  valence numeric(5, 4) not null,
  acousticness numeric(5, 4) not null,
  instrumentalness numeric(5, 4) not null,
  loudness numeric(6, 2) not null,
  duration_ms integer not null,
  genre text not null,
  intro_energy numeric(5, 4) not null,
  outro_energy numeric(5, 4) not null,
  intro_loudness numeric(6, 2) not null,
  outro_loudness numeric(6, 2) not null,
  vocal_density numeric(5, 4) not null,
  embedding vector(10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists tracks_title_artist_unique_idx on tracks (lower(title), lower(artist));
create table if not exists playlist_imports (
  id uuid primary key default gen_random_uuid(),
  source_name text,
  ocr_engine text not null default 'tesseract.js',
  raw_text text not null,
  candidate_count integer not null,
  created_at timestamptz not null default now()
);

create table if not exists transition_events (
  id uuid primary key default gen_random_uuid(),
  from_track_id text not null references tracks(id) on delete cascade,
  to_track_id text not null references tracks(id) on delete cascade,
  score integer not null,
  bpm_delta numeric(6, 2) not null,
  key_compatibility text not null,
  mix_quality text not null,
  mode text not null check (mode in ('playlist', 'whole')),
  created_at timestamptz not null default now()
);

create index if not exists tracks_title_artist_trgm_idx on tracks using gin ((title || ' ' || artist) gin_trgm_ops);
create index if not exists tracks_embedding_idx on tracks using ivfflat (embedding vector_cosine_ops) with (lists = 64);
create index if not exists transition_events_from_score_idx on transition_events (from_track_id, score desc);
