# Smart DJ Transition Finder

Kompletna aplikacja webowa do znajdowania płynnych przejść DJ-skich w stylu Apple Music Crossfade: użytkownik wpisuje tytuł albo link, aplikacja analizuje BPM, Camelot key, energię, głośność, nastrój i gatunek, a następnie zwraca ranking następnych utworów.

## Aplikacja online

**https://k3mil.github.io/smart-dj-transition-finder/**

Na iPhonie:

1. Otwórz powyższy link w Safari.
2. Naciśnij ikonę udostępniania.
3. Wybierz `Dodaj do ekranu początkowego`.
4. Naciśnij `Dodaj`.

Po instalacji aplikacja otwiera się w osobnym oknie i zachowuje lokalnie dodane utwory. Globalne podpowiedzi Apple wymagają połączenia z internetem.

## Funkcje

- `Playlist Match`: rekomendacje tylko z Twojej playlisty zbudowanej ze screenshotów.
- `Whole`: rekomendacje z publicznych baz muzycznych i lokalnego modelu podobieństwa.
- Drag & drop do 17 screenshotów Apple Music.
- OCR przez `tesseract.js`, parser list Apple Music, deduplikacja i edycja kandydatów.
- Autocomplete: wpisy typu `somwhe` mogą podpowiedzieć `Somewhere Over the Rainbow`.
- Scoring 0-100 na podstawie Camelot Wheel, BPM, energii, loudness, gatunku, valence oraz intro/outro.
- Top 20 przejść, najlepszy następny utwór, najlepsze 5 przejść, mini-set 5 i 10 utworów.
- Wykres BPM, energia przejścia, wizualizacja Camelot Wheel.
- PostgreSQL + pgvector gotowe pod similarity search i historię transition events.

## Architektura

```text
apps/
  api/        Node.js + TypeScript + Express
  web/        Next.js + TypeScript + Tailwind + shadcn-style UI
packages/
  core/       typy, Camelot Wheel, scoring, OCR parser, seed playlisty
  database/   schema PostgreSQL + pgvector
```

## API

- `GET /api/health`
- `GET /api/playlist`
- `POST /api/playlist/ocr`
- `POST /api/playlist/candidates`
- `PATCH /api/playlist/tracks/:id`
- `GET /api/search?q=...&mode=playlist|whole`
- `POST /api/tracks/analyze`
- `POST /api/transitions`

## Algorytm scoringowy

Wagi bazowe:

- 35% harmonic match przez Camelot Wheel
- 25% BPM compatibility z obsługą half-time/double-time
- 20% energy match intro/outro
- 10% genre similarity
- 10% loudness match

Dodatkowo liczony jest phrase score z valence, danceability i różnicy końcówki/początku utworów. Konflikty harmoniczne odejmują karę, a wynik końcowy wraca jako `0-100`.

## Źródła muzyczne

- MusicBrainz: publiczne metadane nagrań.
- ListenBrainz: przewidziany kanał rekomendacji społecznościowych.
- Last.fm: opcjonalny search/tagging po `LASTFM_API_KEY`.
- Spotify: opcjonalny search po `SPOTIFY_CLIENT_ID` i `SPOTIFY_CLIENT_SECRET`; audio-features są traktowane jako niestabilne/deprecated, więc backend używa własnego estymatora audio jako fallback.

## Uruchomienie

```bash
pnpm install
cp .env.example .env
docker compose up -d postgres
pnpm dev
```

Frontend: `http://localhost:3000`
Backend: `http://localhost:4000/api/health`

## Zmienne środowiskowe

```bash
PORT=4000
WEB_ORIGIN=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000
DATABASE_URL=postgres://smartdj:smartdj@localhost:5432/smartdj
MUSICBRAINZ_USER_AGENT=SmartDJTransitionFinder/1.0.0 (you@example.com)
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
LASTFM_API_KEY=
```

## Pipeline audio

Gdy API nie oddaje BPM/key/energy, aplikacja używa deterministycznego estymatora:

- tytuł + artysta dają stabilny hash,
- gatunek jest wnioskowany z tagów, artist hints i metadanych,
- BPM, Camelot key, energy, valence, loudness oraz intro/outro są generowane stabilnie,
- embedding 10D trafia do pgvector i może być zastąpiony prawdziwym modelem audio.

W produkcji można podmienić `estimateAudioFeatures` na worker z `essentia.js`, `librosa` albo własnym modelem audio embeddingów.
