import "dotenv/config";

export const config = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
  databaseUrl: process.env.DATABASE_URL,
  musicBrainzUserAgent:
    process.env.MUSICBRAINZ_USER_AGENT ?? "SmartDJTransitionFinder/1.0.0 (local-development@example.com)",
  spotifyClientId: process.env.SPOTIFY_CLIENT_ID,
  spotifyClientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  lastFmApiKey: process.env.LASTFM_API_KEY
};
