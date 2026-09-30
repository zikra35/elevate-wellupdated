// Curated, well-known tracks for the Mental Health → Music tab.
// Links open a YouTube / Spotify search for the exact title + artist, so they
// keep working even if a specific upload is taken down.

export type MusicMood = "Calm" | "Focus" | "Sleep" | "Energise";

export type Track = {
  title: string;
  artist: string;
  mood: MusicMood;
  genre: string;
  note: string;
};

export const MUSIC_MOODS: { mood: MusicMood; blurb: string }[] = [
  { mood: "Calm", blurb: "Slow tempo, soft textures to settle your nervous system." },
  { mood: "Focus", blurb: "Steady, lyric-free pieces for deep work and study." },
  { mood: "Sleep", blurb: "Quiet piano and ambient pieces for winding down." },
  { mood: "Energise", blurb: "Upbeat classics to lift your mood and get moving." },
];

export const TRACKS: Track[] = [
  // Calm
  { title: "Weightless", artist: "Marconi Union", mood: "Calm", genre: "Ambient", note: "Made with sound therapists to slow heart rate" },
  { title: "Clair de Lune", artist: "Claude Debussy", mood: "Calm", genre: "Classical", note: "Gentle, flowing piano" },
  { title: "Gymnopédie No. 1", artist: "Erik Satie", mood: "Calm", genre: "Classical", note: "Unhurried and spacious" },
  { title: "Watermark", artist: "Enya", mood: "Calm", genre: "New Age", note: "Soft layered vocals and piano" },
  { title: "Saturn", artist: "Sleeping At Last", mood: "Calm", genre: "Indie", note: "Warm strings and piano" },

  // Focus
  { title: "Experience", artist: "Ludovico Einaudi", mood: "Focus", genre: "Neo-classical", note: "Builds steadily without distraction" },
  { title: "Nuvole Bianche", artist: "Ludovico Einaudi", mood: "Focus", genre: "Neo-classical", note: "Repetitive, calming piano" },
  { title: "An Ending (Ascent)", artist: "Brian Eno", mood: "Focus", genre: "Ambient", note: "Classic ambient for concentration" },
  { title: "Time", artist: "Hans Zimmer", mood: "Focus", genre: "Soundtrack", note: "From Inception, slow and steady build" },
  { title: "Intro", artist: "The xx", mood: "Focus", genre: "Indie", note: "Minimal, rhythmic instrumental" },

  // Sleep
  { title: "Spiegel im Spiegel", artist: "Arvo Pärt", mood: "Sleep", genre: "Classical", note: "Very slow piano and violin" },
  { title: "Dream 3 (in the midst of my life)", artist: "Max Richter", mood: "Sleep", genre: "Neo-classical", note: "From the album Sleep" },
  { title: "River Flows in You", artist: "Yiruma", mood: "Sleep", genre: "Piano", note: "Soft, familiar melody" },
  { title: "Opus 23", artist: "Dustin O'Halloran", mood: "Sleep", genre: "Piano", note: "Delicate and quiet" },
  { title: "Moonlight Sonata (1st Movement)", artist: "Ludwig van Beethoven", mood: "Sleep", genre: "Classical", note: "Slow, low and soothing" },

  // Energise
  { title: "Here Comes the Sun", artist: "The Beatles", mood: "Energise", genre: "Rock", note: "Bright, hopeful and light" },
  { title: "Happy", artist: "Pharrell Williams", mood: "Energise", genre: "Pop", note: "Instant mood lift" },
  { title: "Don't Stop Me Now", artist: "Queen", mood: "Energise", genre: "Rock", note: "Big energy for a workout" },
  { title: "Walking on Sunshine", artist: "Katrina and the Waves", mood: "Energise", genre: "Pop", note: "Upbeat and feel-good" },
  { title: "Can't Stop the Feeling!", artist: "Justin Timberlake", mood: "Energise", genre: "Pop", note: "Dance-along positivity" },
];

export function youtubeUrl(t: Track): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${t.title} ${t.artist}`)}`;
}

export function spotifyUrl(t: Track): string {
  return `https://open.spotify.com/search/${encodeURIComponent(`${t.title} ${t.artist}`)}`;
}
