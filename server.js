const express = require('express');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.ELEVENLABS_API_KEY;

// Middleware
app.use(express.static('public'));
app.use(express.json());

// Check for API Key
if (!API_KEY) {
  console.warn("WARNING: ELEVENLABS_API_KEY is not set in .env file.");
}

const XI_HEADERS = {
  'Accept': 'application/json',
  'xi-api-key': API_KEY,
  'Content-Type': 'application/json'
};

// 1️⃣ GET /api/voices
app.get('/api/voices', async (req, res) => {
  try {
    const response = await axios.get('https://api.elevenlabs.io/v1/voices', {
      headers: XI_HEADERS
    });

    const voices = response.data.voices.map(v => ({
      id: v.voice_id,
      name: v.name,
      description: v.labels ? Object.values(v.labels).join(', ') : "High quality neural voice",
      category: v.category || 'generated',
      previewUrl: v.preview_url,
      language: v.labels?.language || v.labels?.accent || 'English'
    }));

    res.json(voices);
  } catch (error) {
    console.error('Error fetching voices:', error.message);
    res.status(500).json({ error: 'Failed to fetch voices.' });
  }
});

// 2️⃣ GET /api/models (Hardcoded definitions)
app.get('/api/models', (req, res) => {
  const models = [
    {
      id: 'eleven_multilingual_v2',
      label: 'Eleven Multilingual v2',
      description: 'The most expressive Text to Speech',
      badge: 'V2'
    },
    {
      id: 'eleven_turbo_v2',
      label: 'Eleven Turbo v2',
      description: 'Low latency, high quality',
      badge: 'Turbo'
    },
    {
      id: 'eleven_turbo_v2_5',
      label: 'Eleven v2.5',
      description: 'Newest fast model',
      badge: 'V2.5'
    }
  ];
  res.json(models);
});

// 3️⃣ POST /api/tts
app.post('/api/tts', async (req, res) => {
  const { 
    text, 
    voiceId, 
    modelId,
    speed, 
    stability, 
    similarity, 
    styleExaggeration, 
    languageOverride 
  } = req.body;

  // Validation
  if (!text) return res.status(400).json({ error: 'Text is required.' });
  if (text.length > 2000) return res.status(400).json({ error: 'Text exceeds 2000 characters.' });
  if (!voiceId) return res.status(400).json({ error: 'Voice ID is required.' });
  if (!modelId) return res.status(400).json({ error: 'Model ID is required.' });

  try {
    const response = await axios({
      method: 'post',
      url: `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      data: {
        text,
        model_id: modelId,
        voice_settings: {
          stability: Number(stability) || 0.5,
          similarity_boost: Number(similarity) || 0.75,
          style: Number(styleExaggeration) || 0,
          use_speaker_boost: true
        },
        // Only include language_id if explicitly overridden and supported by model logic
        ...(languageOverride ? { language_id: languageOverride } : {})
      },
      headers: {
        ...XI_HEADERS,
        'Accept': 'audio/mpeg'
      },
      responseType: 'arraybuffer' // Get raw binary data
    });

    // Convert binary to base64
    const audioBase64 = Buffer.from(response.data, 'binary').toString('base64');

    res.json({
      audio: audioBase64,
      contentType: 'audio/mpeg',
      meta: {
        voiceId,
        modelId,
        createdAt: new Date().toISOString()
      }
    });

  } catch (error) {
    const errorMsg = error.response?.data 
      ? JSON.parse(Buffer.from(error.response.data).toString()).detail?.message 
      : error.message;
    console.error('Error generating audio:', errorMsg);
    res.status(500).json({ error: 'Failed to generate audio. Check API Key or Quota.' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Human Voice Studio running at http://localhost:${PORT}`);
});