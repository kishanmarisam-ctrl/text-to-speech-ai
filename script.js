// Human Voice Studio - Frontend Logic

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const textInput = document.getElementById('text-input');
    const charCount = document.getElementById('char-count');
    const validationMsg = document.getElementById('validation-msg');
    
    const genderSelect = document.getElementById('gender-select');
    const styleSelect = document.getElementById('style-select');
    
    const pitchInput = document.getElementById('pitch');
    const pitchVal = document.getElementById('val-pitch');
    
    const speedInput = document.getElementById('speed');
    const speedVal = document.getElementById('val-speed');
    
    const volumeInput = document.getElementById('volume');
    const volumeVal = document.getElementById('val-volume');
    
    const summaryText = document.getElementById('summary-text');
    const btnGenerate = document.getElementById('btn-generate');
    const btnText = document.querySelector('.btn-text');
    const spinner = document.getElementById('spinner');
    
    const audioContainer = document.getElementById('audio-container');
    const audioPlayer = document.getElementById('audio-player');
    const downloadLink = document.getElementById('download-link');
    const errorBanner = document.getElementById('error-banner');

    // State
    const state = {
        text: '',
        gender: 'FEMALE',
        style: 'neutral',
        pitch: 0,
        speed: 1.0,
        volume: 0.9
    };

    // --- Helpers ---

    const updateCharCount = () => {
        const len = textInput.value.length;
        charCount.innerText = `${len} / 3000`;
        if (len > 3000) charCount.style.color = 'red';
        else charCount.style.color = '#999';
        
        state.text = textInput.value;
    };

    const updateSummary = () => {
        // Format text like: "Voice: Male Narrator | Pitch: +10% | Speed: 1.1x | Volume: 0.9"
        const g = state.gender === 'MALE' ? 'Male' : 'Female';
        const s = state.style.charAt(0).toUpperCase() + state.style.slice(1);
        
        const pSign = state.pitch > 0 ? '+' : '';
        const pitchText = `${pSign}${state.pitch}%`;
        
        summaryText.innerText = `Voice: ${g} ${s} | Pitch: ${pitchText} | Speed: ${state.speed}x | Volume: ${state.volume}`;
    };

    const showError = (msg) => {
        errorBanner.innerText = msg;
        errorBanner.classList.remove('hidden');
    };
    
    const hideError = () => {
        errorBanner.classList.add('hidden');
    };

    const toggleLoading = (isLoading) => {
        if (isLoading) {
            btnGenerate.disabled = true;
            btnText.innerText = 'Generating...';
            spinner.classList.remove('hidden');
            audioContainer.classList.add('hidden');
            hideError();
        } else {
            btnGenerate.disabled = false;
            btnText.innerText = 'Generate Voice';
            spinner.classList.add('hidden');
        }
    };

    // --- Event Listeners ---

    textInput.addEventListener('input', () => {
        updateCharCount();
        if (validationMsg.style.opacity === '1') {
            validationMsg.style.opacity = '0';
        }
    });

    genderSelect.addEventListener('change', (e) => {
        state.gender = e.target.value;
        updateSummary();
    });

    styleSelect.addEventListener('change', (e) => {
        state.style = e.target.value;
        updateSummary();
    });

    pitchInput.addEventListener('input', (e) => {
        state.pitch = parseInt(e.target.value);
        const sign = state.pitch > 0 ? '+' : '';
        pitchVal.innerText = `${sign}${state.pitch}%`;
        updateSummary();
    });

    speedInput.addEventListener('input', (e) => {
        state.speed = parseFloat(e.target.value);
        speedVal.innerText = `${state.speed.toFixed(1)}x`;
        updateSummary();
    });

    volumeInput.addEventListener('input', (e) => {
        state.volume = parseFloat(e.target.value);
        volumeVal.innerText = state.volume.toFixed(1);
        updateSummary();
    });

    // --- API Call ---

    btnGenerate.addEventListener('click', async () => {
        const text = textInput.value.trim();

        if (!text) {
            validationMsg.innerText = 'Please enter some text.';
            validationMsg.style.opacity = '1';
            return;
        }
        
        toggleLoading(true);

        try {
            const response = await fetch('/api/synthesize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: text,
                    gender: state.gender,
                    style: state.style,
                    pitch: state.pitch,
                    speed: state.speed,
                    volume: state.volume
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Generation failed');
            }

            // Get MP3 Blob
            const blob = await response.blob();
            const audioUrl = URL.createObjectURL(blob);
            
            // Play
            audioPlayer.src = audioUrl;
            downloadLink.href = audioUrl;
            audioContainer.classList.remove('hidden');
            
            // Auto-play (browser might block if no prior interaction, but button click counts)
            try {
                await audioPlayer.play();
            } catch (err) {
                console.log("Auto-play blocked, user must click play.");
            }

        } catch (error) {
            console.error(error);
            showError(`Error: ${error.message}`);
        } finally {
            toggleLoading(false);
        }
    });

    // Init
    updateSummary();
});