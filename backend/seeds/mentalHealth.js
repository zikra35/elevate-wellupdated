const mongoose = require('mongoose');
const MusicEntry = require('../models/MusicEntry');

/**
 * Seed data for Mental Health module - Music entries
 * Inserts music entries idempotently using upsert operations
 */

const seedMentalHealth = async () => {
  try {
    console.log('Starting Mental Health seed...');

    // ===== MUSIC ENTRIES (10+ total, covering all 4 mood tags) =====
    const musicEntries = [
      // Calm mood (3 entries)
      {
        title: 'Peaceful Piano',
        artist: 'Relaxing Melodies',
        genreTag: 'Classical',
        moodTag: 'Calm',
        url: 'https://www.youtube.com/watch?v=Xw5AiRVqfqk',
      },
      {
        title: 'Ocean Waves Ambient',
        artist: 'Nature Sounds',
        genreTag: 'Nature Sounds',
        moodTag: 'Calm',
        url: 'https://www.youtube.com/watch?v=ZEKhZc6pB9s',
      },
      {
        title: 'Gentle Lo-Fi Beats',
        artist: 'Lo-Fi Chill',
        genreTag: 'Lo-Fi',
        moodTag: 'Calm',
        url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
      },
      // Focus mood (3 entries)
      {
        title: 'Deep Focus Lo-Fi',
        artist: 'Study Beats',
        genreTag: 'Lo-Fi',
        moodTag: 'Focus',
        url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
      },
      {
        title: 'Binaural Focus Frequency',
        artist: 'Brain Waves',
        genreTag: 'Binaural Beats',
        moodTag: 'Focus',
        url: 'https://www.youtube.com/watch?v=WPni755-Krg',
      },
      {
        title: 'Classical Concentration',
        artist: 'Mozart Essentials',
        genreTag: 'Classical',
        moodTag: 'Focus',
        url: 'https://www.youtube.com/watch?v=Xw5AiRVqfqk',
      },
      // Sleep mood (2 entries)
      {
        title: 'Sleepy Forest Sounds',
        artist: 'Nature Sounds',
        genreTag: 'Nature Sounds',
        moodTag: 'Sleep',
        url: 'https://www.youtube.com/watch?v=ZEKhZc6pB9s',
      },
      {
        title: 'Binaural Sleep Waves',
        artist: 'Sleep Science',
        genreTag: 'Binaural Beats',
        moodTag: 'Sleep',
        url: 'https://www.youtube.com/watch?v=WPni755-Krg',
      },
      // Energise mood (2 entries)
      {
        title: 'Upbeat Lo-Fi Energy',
        artist: 'Motivation Beats',
        genreTag: 'Lo-Fi',
        moodTag: 'Energise',
        url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
      },
      {
        title: 'Energising Classical',
        artist: 'Vivaldi Classics',
        genreTag: 'Classical',
        moodTag: 'Energise',
        url: 'https://www.youtube.com/watch?v=Xw5AiRVqfqk',
      },
      // Additional entries for variety
      {
        title: 'Midnight Lo-Fi Chill',
        artist: 'Night Beats',
        genreTag: 'Lo-Fi',
        moodTag: 'Sleep',
        url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
      },
    ];

    // Upsert music entries
    for (const entry of musicEntries) {
      await MusicEntry.updateOne(
        { title: entry.title },
        { $set: entry },
        { upsert: true }
      );
    }
    console.log(`✓ Seeded ${musicEntries.length} music entries`);

    console.log('✓ Mental Health seed completed successfully');
  } catch (error) {
    console.error('Error seeding Mental Health data:', error);
    throw error;
  }
};

module.exports = seedMentalHealth;
