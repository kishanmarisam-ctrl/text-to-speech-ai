# Human Voice Studio

A full-stack text-to-speech application using Google Cloud AI.

## Prerequisites

1. **Node.js**: Installed (v14+ recommended).
2. **Google Cloud Account**: A project with billing enabled.

## Setup Instructions

### 1. Google Cloud Configuration
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one.
3. Search for **"Cloud Text-to-Speech API"** and enable it.
4. Go to **IAM & Admin > Service Accounts**.
5. Create a Service Account, give it the **"Cloud Text-to-Speech API User"** role.
6. Create a JSON key for this account and download it.
7. Save the key file in this project folder as `google-credentials.json`.
8. Set the environment variable:
   - **Mac/Linux**: `export GOOGLE_APPLICATION_CREDENTIALS="./google-credentials.json"`
   - **Windows (Cmd)**: `set GOOGLE_APPLICATION_CREDENTIALS=.\google-credentials.json`
   - **Windows (PowerShell)**: `$env:GOOGLE_APPLICATION_CREDENTIALS=".\google-credentials.json"`

### 2. Install Dependencies

Open your terminal in this project folder and run:

```bash
npm init -y
npm install express @google-cloud/text-to-speech body-parser dotenv
```

### 3. Run the App

```bash
node api/server.js
```

Visit **http://localhost:3000** in your browser.

## Features
- **Neural Voices**: Uses `en-US-Neural2` and `Studio` voices.
- **Style Mapping**: Supports Friendly, Whisper, Angry, Sad, and Narrator styles via SSML.
- **Customization**: Pitch, Speed, and Volume controls.
