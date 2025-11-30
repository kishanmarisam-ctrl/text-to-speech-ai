document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

// --- STATE ---
const state = {
    voices: [],
    models: [],
    selectedVoiceId: null,
    selectedModelId: 'eleven_multilingual_v2', // Default
    history: [], // {id, textSnippet, voiceName, modelLabel, createdAt, audioUrl}
    playingPreviewId: null
};

// --- DOM ELEMENTS ---
const textInput = document.getElementById('textInput');
const charCount = document.getElementById('charCount');

// Tabs
const tabSettings = document.getElementById('tabSettings');
const tabHistory = document.getElementById('tabHistory');
const contentSettings = document.getElementById('contentSettings');
const contentHistory = document.getElementById('contentHistory');

// Settings
const voiceSelectBtn = document.getElementById('voiceSelectBtn');
const selectedVoiceName = document.getElementById('selectedVoiceName');
const selectedVoiceAvatar = document.getElementById('selectedVoiceAvatar');
const modelCard = document.getElementById('modelCard');
const modelLabel = document.getElementById('modelLabel');
const modelDesc = document.getElementById('modelDesc');
const modelBadge = document.getElementById('modelBadge');

// Sliders
const sliderSpeed = document.getElementById('sliderSpeed');
const sliderStability = document.getElementById('sliderStability');
const sliderSimilarity = document.getElementById('sliderSimilarity');
const sliderStyle = document.getElementById('sliderStyle');
const valSpeed = document.getElementById('valSpeed');
const valStability = document.getElementById('valStability');
const valSimilarity = document.getElementById('valSimilarity');
const valStyle = document.getElementById('valStyle');

// Override
const langToggle = document.getElementById('langToggle');
const langDropdownContainer = document.getElementById('langDropdownContainer');
const langSelect = document.getElementById('langSelect');

// Actions
const btnGenerate = document.getElementById('btnGenerate');
const errorMsg = document.getElementById('errorMsg');
const mainAudio = document.getElementById('mainAudio');

// History
const historyList = document.getElementById('historyList');

// Modals
const voiceModal = document.getElementById('voiceModal');
const btnCloseModal = document.getElementById('btnCloseModal');
const voiceSearch = document.getElementById('voiceSearch');
const voiceList = document.getElementById('voiceList');

const modelModal = document.getElementById('modelModal');
const btnCloseModelModal = document.getElementById('btnCloseModelModal');
const modelList = document.getElementById('modelList');

const previewAudio = document.getElementById('previewAudio');

// Chips
const chips = document.querySelectorAll('.chip');

// --- PRESETS TEXT ---
const PRESETS = {
    story: "Once upon a time, in a kingdom far away, there lived a brave little mouse who dreamed of flying.",
    joke: "Why did the scarecrow win an award? Because he was outstanding in his field!",
    ad: "Are you tired of slow internet? Switch to BoltFiber today for lightning fast speeds and reliability you can trust.",
    lang: "Bonjour! Je m'appelle Claude. Hallo! Ich heiße Hans. ¡Hola! Me llamo Maria.",
    drama: "Don't you dare walk away from me! I am telling you the truth, whether you want to hear it or not!",
    game: "Target acquired. Initiating launch sequence in 3, 2, 1... Blast off!",
    podcast: "Welcome back to 'The Daily Grind', the podcast where we explore productivity hacks for busy entrepreneurs.",
    meditation: "Take a deep breath in... hold it for a moment... and slowly exhale. Feel the tension leaving your body."
};


// --- INITIALIZATION ---
async function initApp() {
    setupEventListeners();
    await loadModels(); // Models are hardcoded in backend
    await loadVoices();
}

function setupEventListeners() {
    // Text Input
    textInput.addEventListener('input', () => {
        const len = textInput.value.length;
        charCount.textContent = `${len} / 2000`;
        if(len > 2000) charCount.style.color = 'red';
        else charCount.style.color = '#9CA3AF';
    });

    // Tab Switching
    tabSettings.addEventListener('click', () => switchTab('settings'));
    tabHistory.addEventListener('click', () => switchTab('history'));

    // Voice Modal
    voiceSelectBtn.addEventListener('click', () => openModal(voiceModal));
    btnCloseModal.addEventListener('click', () => closeModal(voiceModal));
    voiceSearch.addEventListener('input', (e) => renderVoiceList(e.target.value));

    // Model Modal
    modelCard.addEventListener('click', () => openModal(modelModal));
    btnCloseModelModal.addEventListener('click', () => closeModal(modelModal));

    // Sliders
    sliderSpeed.addEventListener('input', () => valSpeed.textContent = parseFloat(sliderSpeed.value).toFixed(1) + 'x');
    sliderStability.addEventListener('input', () => valStability.textContent = parseFloat(sliderStability.value).toFixed(2));
    sliderSimilarity.addEventListener('input', () => valSimilarity.textContent = parseFloat(sliderSimilarity.value).toFixed(2));
    sliderStyle.addEventListener('input', () => valStyle.textContent = parseFloat(sliderStyle.value).toFixed(2));

    // Toggle
    langToggle.addEventListener('change', () => {
        if(langToggle.checked) langDropdownContainer.classList.remove('hidden');
        else langDropdownContainer.classList.add('hidden');
    });

    // Generate
    btnGenerate.addEventListener('click', handleGenerate);

    // Get Started Chips
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            const key = chip.dataset.preset;
            if(PRESETS[key]) {
                textInput.value = PRESETS[key];
                textInput.dispatchEvent(new Event('input')); // Update counter
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });

    // Preview Audio End
    previewAudio.addEventListener('ended', () => {
        state.playingPreviewId = null;
        renderVoiceList(voiceSearch.value); // Reset icon
    });
}

function switchTab(tabName) {
    if(tabName === 'settings') {
        tabSettings.classList.add('active');
        tabHistory.classList.remove('active');
        contentSettings.classList.add('active');
        contentHistory.classList.remove('active');
    } else {
        tabHistory.classList.add('active');
        tabSettings.classList.remove('active');
        contentHistory.classList.add('active');
        contentSettings.classList.remove('active');
        renderHistory();
    }
}

function openModal(modal) { modal.classList.remove('hidden'); }
function closeModal(modal) { modal.classList.add('hidden'); }


// --- DATA LOADING ---

async function loadVoices() {
    try {
        const res = await fetch('/api/voices');
        const data = await res.json();
        state.voices = data;
        
        // Default select first
        if(state.voices.length > 0) setSelectedVoice(state.voices[0]);
        renderVoiceList();
    } catch(err) {
        console.error(err);
    }
}

async function loadModels() {
    try {
        const res = await fetch('/api/models');
        const data = await res.json();
        state.models = data;
        
        // Find default model if exists, or first
        const def = state.models.find(m => m.id === state.selectedModelId) || state.models[0];
        setSelectedModel(def);
        renderModelList();
    } catch(err) {
        console.error(err);
    }
}

function setSelectedVoice(voice) {
    state.selectedVoiceId = voice.id;
    selectedVoiceName.textContent = voice.name;
    selectedVoiceAvatar.textContent = voice.name.charAt(0);
}

function setSelectedModel(model) {
    state.selectedModelId = model.id;
    modelLabel.textContent = model.label;
    modelDesc.textContent = model.description;
    modelBadge.textContent = model.badge;
}


// --- RENDERING LISTS ---

function renderVoiceList(filter = '') {
    voiceList.innerHTML = '';
    const filtered = state.voices.filter(v => v.name.toLowerCase().includes(filter.toLowerCase()));
    
    filtered.forEach(v => {
        const row = document.createElement('div');
        row.className = 'voice-row';
        const isPreviewing = state.playingPreviewId === v.id;
        
        row.innerHTML = `
            <div class="avatar-sm">${v.name.charAt(0)}</div>
            <div class="v-info">
                <div class="v-name">${v.name}</div>
                <div class="v-desc">${v.description}</div>
            </div>
            <div class="v-actions">
                <button class="btn-preview" data-vid="${v.id}">${isPreviewing ? '■' : '▶'}</button>
            </div>
        `;
        
        // Row click -> Select
        row.addEventListener('click', (e) => {
            if(!e.target.closest('.btn-preview')) {
                setSelectedVoice(v);
                closeModal(voiceModal);
            }
        });

        // Preview click
        const btnP = row.querySelector('.btn-preview');
        btnP.addEventListener('click', (e) => {
            e.stopPropagation();
            togglePreview(v);
        });

        voiceList.appendChild(row);
    });
}

function renderModelList() {
    modelList.innerHTML = '';
    state.models.forEach(m => {
        const div = document.createElement('div');
        div.className = 'model-row';
        div.innerHTML = `
            <div style="font-weight:600">${m.label} <span class="badge">${m.badge}</span></div>
            <div style="font-size:0.8rem; color:#6B7280">${m.description}</div>
        `;
        div.addEventListener('click', () => {
            setSelectedModel(m);
            closeModal(modelModal);
        });
        modelList.appendChild(div);
    });
}


// --- PREVIEW LOGIC ---
async function togglePreview(voice) {
    if(state.playingPreviewId === voice.id) {
        previewAudio.pause();
        state.playingPreviewId = null;
        renderVoiceList(voiceSearch.value);
        return;
    }

    state.playingPreviewId = voice.id;
    renderVoiceList(voiceSearch.value);

    let url = voice.previewUrl;
    if(!url) {
        // Generate on-the-fly preview
        try {
            const res = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: `Hello, I am ${voice.name}. This is a preview.`,
                    voiceId: voice.id,
                    modelId: state.selectedModelId,
                    speed: 1.0,
                    stability: 0.5,
                    similarity: 0.75,
                    styleExaggeration: 0,
                    languageOverride: null
                })
            });
            const data = await res.json();
            url = `data:${data.contentType};base64,${data.audio}`;
        } catch(e) {
            console.error(e);
            state.playingPreviewId = null;
            renderVoiceList(voiceSearch.value);
            return;
        }
    }
    
    previewAudio.src = url;
    previewAudio.play();
}


// --- GENERATION LOGIC ---

async function handleGenerate() {
    const text = textInput.value.trim();
    if(!text) {
        errorMsg.textContent = "Please enter some text first.";
        errorMsg.classList.remove('hidden');
        return;
    }
    
    // UI Loading
    btnGenerate.disabled = true;
    const oldLabel = btnGenerate.textContent;
    btnGenerate.textContent = "Generating...";
    errorMsg.classList.add('hidden');

    const payload = {
        text,
        voiceId: state.selectedVoiceId,
        modelId: state.selectedModelId,
        speed: parseFloat(sliderSpeed.value),
        stability: parseFloat(sliderStability.value),
        similarity: parseFloat(sliderSimilarity.value),
        styleExaggeration: parseFloat(sliderStyle.value),
        languageOverride: langToggle.checked ? langSelect.value : null
    };

    try {
        const res = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if(!res.ok) throw new Error("Generation failed");
        
        const data = await res.json();
        const blobUrl = `data:${data.contentType};base64,${data.audio}`;

        // Play
        mainAudio.src = blobUrl;
        mainAudio.playbackRate = payload.speed;
        mainAudio.play();

        // Add to History
        addToHistory({
            id: Date.now(),
            textSnippet: text.length > 60 ? text.slice(0, 60) + '...' : text,
            voiceName: selectedVoiceName.textContent,
            modelLabel: state.models.find(m=>m.id === state.selectedModelId)?.badge || 'V2',
            createdAt: new Date().toLocaleTimeString(),
            audioUrl: blobUrl,
            playbackRate: payload.speed
        });

    } catch(err) {
        console.error(err);
        errorMsg.textContent = "Error generating audio. Please try again.";
        errorMsg.classList.remove('hidden');
    } finally {
        btnGenerate.disabled = false;
        btnGenerate.textContent = oldLabel;
    }
}


// --- HISTORY LOGIC ---
function addToHistory(item) {
    state.history.unshift(item);
    // Switch to history tab automatically to show result? 
    // Usually standard apps don't force switch, but let's keep it in memory
}

function renderHistory() {
    if(state.history.length === 0) {
        historyList.innerHTML = '<div class="empty-state">No history yet.</div>';
        return;
    }
    
    historyList.innerHTML = '';
    state.history.forEach(item => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `
            <div class="hist-info">
                <span class="hist-meta">${item.voiceName} • ${item.modelLabel} • ${item.createdAt}</span>
                <span class="hist-text">${item.textSnippet}</span>
            </div>
            <button class="hist-play">▶</button>
        `;
        
        const playBtn = div.querySelector('.hist-play');
        playBtn.addEventListener('click', () => {
            mainAudio.src = item.audioUrl;
            mainAudio.playbackRate = item.playbackRate;
            mainAudio.play();
        });
        
        historyList.appendChild(div);
    });
}