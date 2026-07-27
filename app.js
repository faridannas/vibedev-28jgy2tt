/**
 * JUKEBOX.VIBE - SPOTIFY/FESTIFY INSPIRED PLAYLIST ENGINE
 */

document.addEventListener('DOMContentLoaded', () => {

    const STORAGE_KEY = 'party_playlist_songs_v2';
    const SOUND_SETTING_KEY = 'party_playlist_sound_enabled';

    let songs = [];
    let isSoundEnabled = localStorage.getItem(SOUND_SETTING_KEY) !== 'false';

    // Sample top hits
    const SAMPLE_TRACKS = [
        { id: 'sample_1', title: 'Espresso', artist: 'Sabrina Carpenter', votes: 18, createdAt: Date.now() - 50000 },
        { id: 'sample_2', title: 'Levitating', artist: 'Dua Lipa', votes: 14, createdAt: Date.now() - 40000 },
        { id: 'sample_3', title: 'Blinding Lights', artist: 'The Weeknd', votes: 11, createdAt: Date.now() - 30000 },
        { id: 'sample_4', title: 'As It Was', artist: 'Harry Styles', votes: 7, createdAt: Date.now() - 20000 },
        { id: 'sample_5', title: 'Uptown Funk', artist: 'Mark Ronson ft. Bruno Mars', votes: 4, createdAt: Date.now() - 10000 }
    ];

    // Album cover gradient generators
    const GRADIENTS = [
        'linear-gradient(135deg, #1db954 0%, #00e676 100%)',
        'linear-gradient(135deg, #7c4dff 0%, #b388ff 100%)',
        'linear-gradient(135deg, #ff2a85 0%, #ff70a6 100%)',
        'linear-gradient(135deg, #ffb300 0%, #ffe082 100%)',
        'linear-gradient(135deg, #00b0ff 0%, #80d8ff 100%)'
    ];

    // DOM Elements
    const addSongForm = document.getElementById('addSongForm');
    const songTitleInput = document.getElementById('songTitleInput');
    const artistInput = document.getElementById('artistInput');
    const titleError = document.getElementById('titleError');
    const playlistContainer = document.getElementById('playlistContainer');
    const emptyState = document.getElementById('emptyState');
    const searchInput = document.getElementById('searchInput');

    // Hero Elements
    const topPickTitle = document.getElementById('topPickTitle');
    const topPickArtist = document.getElementById('topPickArtist');
    const topPickVoteNum = document.getElementById('topPickVoteNum');
    const heroCover = document.getElementById('heroCover');

    // Controls
    const totalSongsCount = document.getElementById('totalSongsCount');
    const soundToggleBtn = document.getElementById('soundToggleBtn');
    const soundLabel = document.getElementById('soundLabel');
    const loadSamplesBtn = document.getElementById('loadSamplesBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const emptyLoadBtn = document.getElementById('emptyLoadBtn');

    // Modal
    const confirmModal = document.getElementById('confirmModal');
    const cancelModalBtn = document.getElementById('cancelModalBtn');
    const confirmClearBtn = document.getElementById('confirmClearBtn');

    // --------------------------------------------------------------------------
    // Web Audio Synthesizer
    // --------------------------------------------------------------------------
    let audioCtx = null;

    function getAudioContext() {
        if (!audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) audioCtx = new AudioContext();
        }
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
        return audioCtx;
    }

    function playSound(type) {
        if (!isSoundEnabled) return;
        try {
            const ctx = getAudioContext();
            if (!ctx) return;
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            if (type === 'vote') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(523.25, now);
                osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.1);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
            } else if (type === 'add') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.setValueAtTime(659.25, now + 0.08);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
            } else if (type === 'clear') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.exponentialRampToValueAtTime(120, now + 0.2);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
            }
        } catch (e) {
            console.warn(e);
        }
    }

    function updateSoundUI() {
        if (isSoundEnabled) {
            soundLabel.textContent = 'Sound On';
            soundToggleBtn.classList.remove('muted');
        } else {
            soundLabel.textContent = 'Sound Off';
            soundToggleBtn.classList.add('muted');
        }
    }

    soundToggleBtn.addEventListener('click', () => {
        isSoundEnabled = !isSoundEnabled;
        localStorage.setItem(SOUND_SETTING_KEY, isSoundEnabled);
        updateSoundUI();
        if (isSoundEnabled) playSound('vote');
    });

    updateSoundUI();

    // --------------------------------------------------------------------------
    // Data Persistence
    // --------------------------------------------------------------------------
    function loadSongs() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                songs = JSON.parse(saved);
            } catch (e) {
                songs = [...SAMPLE_TRACKS];
            }
        } else {
            songs = [...SAMPLE_TRACKS];
            saveSongs();
        }
    }

    function saveSongs() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(songs));
    }

    // --------------------------------------------------------------------------
    // Auto-Sort & Rendering
    // --------------------------------------------------------------------------
    function sortSongs() {
        songs.sort((a, b) => {
            if (b.votes !== a.votes) return b.votes - a.votes;
            return b.createdAt - a.createdAt;
        });
    }

    function getGradient(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % GRADIENTS.length;
        return GRADIENTS[index];
    }

    function renderPlaylist() {
        sortSongs();

        const query = searchInput.value.toLowerCase().trim();
        const filtered = songs.filter(s => 
            s.title.toLowerCase().includes(query) || (s.artist || '').toLowerCase().includes(query)
        );

        totalSongsCount.textContent = songs.length;

        // Top Hero Card
        if (songs.length > 0) {
            const topTrack = songs[0];
            topPickTitle.textContent = topTrack.title;
            topPickArtist.textContent = topTrack.artist || 'Unknown Artist';
            topPickVoteNum.textContent = topTrack.votes;
            heroCover.style.background = getGradient(topTrack.title);
        } else {
            topPickTitle.textContent = 'No track queued';
            topPickArtist.textContent = 'Add a song below to start';
            topPickVoteNum.textContent = '0';
            heroCover.style.background = GRADIENTS[0];
        }

        if (filtered.length === 0) {
            playlistContainer.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        } else {
            emptyState.classList.add('hidden');
        }

        let html = '';
        filtered.forEach((song) => {
            const rank = songs.findIndex(s => s.id === song.id) + 1;
            const rankClass = rank === 1 ? 'rank-1' : '';
            const bgGrad = getGradient(song.title);
            const initial = song.title.charAt(0).toUpperCase();

            html += `
                <div class="track-item ${rankClass}" data-id="${song.id}">
                    <div class="track-rank">${rank}</div>
                    
                    <div class="track-cover" style="background: ${bgGrad}">
                        ${initial}
                    </div>

                    <div class="track-details">
                        <div class="track-title" title="${escapeHtml(song.title)}">${escapeHtml(song.title)}</div>
                        <div class="track-artist">${song.artist ? escapeHtml(song.artist) : 'Unknown Artist'}</div>
                    </div>

                    <div class="track-actions">
                        <div class="vote-pill" id="voteCount-${song.id}">${song.votes}</div>

                        <button class="upvote-action-btn" data-action="upvote" data-id="${song.id}" aria-label="Upvote track" title="Upvote track">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                        </button>

                        <button class="delete-action-btn" data-action="delete" data-id="${song.id}" aria-label="Remove track" title="Remove track">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    </div>
                </div>
            `;
        });

        playlistContainer.innerHTML = html;
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // --------------------------------------------------------------------------
    // Event Handlers
    // --------------------------------------------------------------------------
    addSongForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = songTitleInput.value.trim();
        const artist = artistInput.value.trim();

        if (!title) {
            songTitleInput.classList.add('error');
            titleError.classList.add('visible');
            songTitleInput.focus();
            return;
        }

        songTitleInput.classList.remove('error');
        titleError.classList.remove('visible');

        const newTrack = {
            id: 'track_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            title: title,
            artist: artist,
            votes: 1,
            createdAt: Date.now()
        };

        songs.push(newTrack);
        saveSongs();
        renderPlaylist();
        playSound('add');

        songTitleInput.value = '';
        artistInput.value = '';
        songTitleInput.focus();
    });

    songTitleInput.addEventListener('input', () => {
        if (songTitleInput.value.trim()) {
            songTitleInput.classList.remove('error');
            titleError.classList.remove('visible');
        }
    });

    playlistContainer.addEventListener('click', (e) => {
        const upvoteBtn = e.target.closest('[data-action="upvote"]');
        const deleteBtn = e.target.closest('[data-action="delete"]');

        if (upvoteBtn) {
            const id = upvoteBtn.getAttribute('data-id');
            const song = songs.find(s => s.id === id);
            if (song) {
                song.votes += 1;
                saveSongs();
                playSound('vote');

                const pill = document.getElementById(`voteCount-${id}`);
                if (pill) {
                    pill.classList.remove('bump');
                    void pill.offsetWidth;
                    pill.classList.add('bump');
                }

                renderPlaylist();
            }
        } else if (deleteBtn) {
            const id = deleteBtn.getAttribute('data-id');
            songs = songs.filter(s => s.id !== id);
            saveSongs();
            playSound('clear');
            renderPlaylist();
        }
    });

    searchInput.addEventListener('input', renderPlaylist);

    function loadSamples() {
        SAMPLE_TRACKS.forEach(sample => {
            if (!songs.some(s => s.title.toLowerCase() === sample.title.toLowerCase())) {
                songs.push({
                    ...sample,
                    id: 'sample_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
                    createdAt: Date.now()
                });
            }
        });
        saveSongs();
        playSound('add');
        renderPlaylist();
    }

    loadSamplesBtn.addEventListener('click', loadSamples);
    emptyLoadBtn.addEventListener('click', loadSamples);

    // Modal
    clearAllBtn.addEventListener('click', () => {
        if (songs.length === 0) return;
        confirmModal.classList.remove('hidden');
    });

    cancelModalBtn.addEventListener('click', () => {
        confirmModal.classList.add('hidden');
    });

    confirmClearBtn.addEventListener('click', () => {
        songs = [];
        saveSongs();
        confirmModal.classList.add('hidden');
        playSound('clear');
        renderPlaylist();
    });

    loadSongs();
    renderPlaylist();
});
