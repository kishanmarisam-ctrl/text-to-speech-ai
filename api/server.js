const express = require('express');
const textToSpeech = require('@google-cloud/text-to-speech');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../'))); // Serve static frontend files from root

// Google Cloud Client
const client = new textToSpeech.TextToSpeechClient();

/**
 * VOICE MAPPING CONFIGURATION
 * Maps gender + style to specific Google Cloud Neural voices and SSML styles.
 */
const VOICE_MAP = {
    FEMALE: {
        default: 'en-US-Neural2-F', // Good base female voice
        styles: {
            neutral:  { style: null },
            friendly: { style: 'cheerful' }, // Neural2 supports 'cheerful'
            whisper:  { style: 'whisper' },
            excited:  { style: 'excited' },  // Use excited style if supported, else falls back
            sad:      { style: 'sad' },
            angry:    { style: 'angry' }     // Some Neural voices support this
        }
    },
    MALE: {
        default: 'en-US-Neural2-D', // Deep male voice
        styles: {
            neutral:  { style: null },
            friendly: { style: 'friendly' }, // Try friendly/cheerful
            whisper:  { style: 'whisper' },
            excited:  { style: 'excited' },
            sad:      { style: 'sad' },
            angry:    { style: 'angry' }, // Often supported by Neural2-D
            // Special mapping for 'narrator' to a Studio voice if available, 
            // or just use Neural2-D (it is very narrator-like).
            narrator: { voiceOverride: 'en-US-Studio-M', style: null } 
        }
    }
};

/**
 * Generate SSML
 * Wraps text in <speak> and <express-as> tags based on style.
 */
function createSsml(text, styleName, voiceGender) {
    const config = VOICE_MAP[voiceGender].styles[styleName] || {};
    const ssmlStyle = config.style;

    let innerContent = text;
    
    // Escape XML special characters in text
    const escapedText = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

    if (ssmlStyle) {
        return `<speak><express-as style="${ssmlStyle}">${escapedText}</express-as></speak>`;
    } else {
        return `<speak>${escapedText}</speak>`;
    }
}

function getVoiceName(styleName, voiceGender) {
    const config = VOICE_MAP[voiceGender].styles[styleName];
    if (config && config.voiceOverride) {
        return config.voiceOverride;
    }
    return VOICE_MAP[voiceGender].default;
}

// --- Routes ---

app.post('/api/synthesize', async (req, res) => {
    try {
        const { text, gender, style, pitch, speed, volume } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        // 1. Determine Voice & SSML
        const voiceName = getVoiceName(style, gender);
        const ssml = createSsml(text, style, gender);

        // 2. Construct Request
        const request = {
            input: { ssml: ssml },
            voice: {
                languageCode: 'en-US',
                name: voiceName,
                // If using Studio voices, ssmlGender is less relevant but required for generic selection.
                // We are selecting by specific name, so strict gender matching is handled by the name.
            },
            audioConfig: {
                audioEncoding: 'MP3',
                pitch: pitch,           // Range -20.0 to 20.0
                speakingRate: speed,    // Range 0.25 to 4.0
                volumeGainDb: 0         // We don't map linear volume (0-1) to dB here easily, 
                                        // keeping it standard or could map 0.9 -> -1dB etc.
                                        // Let's rely on frontend volume for playback, 
                                        // or simple logic: (volume - 1) * 10? 
                                        // Simplified: leaving at 0dB (native level).
            },
        };

        // 3. Call Google API
        const [response] = await client.synthesizeSpeech(request);
        
        // 4. Send Audio
        res.set('Content-Type', 'audio/mpeg');
        res.send(response.audioContent);

    } catch (error) {
        console.error('TTS API Error:', error);
        // Clean error message for frontend
        const msg = error.details || error.message || 'Error generating speech';
        res.status(500).json({ error: msg });
    }
});

// Start Server
app.listen(port, () => {
    console.log(`Human Voice Studio server running at http://localhost:${port}`);
});