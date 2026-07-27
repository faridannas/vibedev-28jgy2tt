/**
 * PARTY PLAYLIST VOTING WIDGET - APPLICATION JS
 * Single-Page Real-time Song Voting App
 */

document.addEventListener('DOMContentLoaded', () => {

    // --------------------------------------------------------------------------
    // 1. App State & Initial Configuration
    // --------------------------------------------------------------------------
    const STORAGE_KEY = 'party_playlist_songs_v1';
    const SOUND_SETTING_KEY = 'party_playlist_sound_enabled';

    let songs = [];
    let isSoundEnabled = localStorage.getItem(SOUND_SETTING_KEY) !== 'false'; // Default ON

    // Preloaded party sample hits for initial start
    const SAMPLE_PARTY_TRACKS = [
        { id: 'sample_1', title: 'Levitating', artist: 'Dua Lipa', votes: 15, createdAt: Date.now() - 50000 },
        { id: 'sample_2', title: 'Blinding Lights', artist: 'The Weeknd', votes: 12, createdAt: Date.now() - 40000 },
        { id: 'sample_3', title: 'Uptown Funk', artist: 'Mark Ronson ft. Bruno Mars', votes: 9, createdAt: Date.now() - 30000 },
        { id: 'sample_4', title: 'As It Was', artist: 'Harry Styles', votes: 6, createdAt: Date.now() - 20000 },
        { id: 'sample_5', title: 'Dance The Night', artist: 'Dua Lipa', votes: 4, createdAt: Date.now() - 10000 }
    ];

    // DOM Elements
    const addSongForm = document.getElementById('addSongForm');
    const songTitleInput = document.getElementById('songTitleInput');
    const artistInput = document.getElementById('artistInput');
    const titleError = document.getElementById('titleError');
    const playlistContainer = document.getElementById('playlistContainer');
    const emptyState = document.getElementById('emptyState');
    const searchInput = document.getElementById('searchInput');

    // Top Pick Hero Elements
    const topPickTitle = document.getElementById('topPickTitle');
    const topPickArtist = document.getElementById('topPickArtist');
    const topPickVoteNum = document.getElementById('topPickVoteNum');

    // Stats Elements
    const totalVotesCount = document.getElementById('totalVotesCount');
    const totalSongsCount = document.getElementById('totalSongsCount');

    // Tool & Control Buttons
    const soundToggleBtn = document.getElementById('soundToggleBtn');
    const soundIcon = document.getElementById('soundIcon');
    const soundLabel = document.getElementById('soundLabel');
    const loadSamplesBtn = document.getElementById('loadSamplesBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const emptyLoadBtn = document.getElementById('emptyLoadBtn');
    const vinylIcon = document.getElementById('vinylIcon');

    // Modal Elements
    const confirmModal = document.getElementById('confirmModal');
    const cancelModalBtn = document.getElementById('cancelModalBtn');
    const confirmClearBtn = document.getElementById('confirmClearBtn');

    // --------------------------------------------------------------------------
    // 2. Web Audio API Sound Synthesizer (Zero External Dependencies)
    // --------------------------------------------------------------------------
    let audioCtx = null;

    function getAudioContext() {
        if (!audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                audioCtx = new AudioContext();
            }
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
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
                // High-energy upbeat synth chirp
                osc.type = 'sine';
                osc.frequency.setValueAtTime(440, now); // A4
                osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
                osc.start(now);
                osc.stop(now + 0.12);

            } else if (type === 'add') {
                // Happy 2-tone chord (C5 -> G5)
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(523.25, now); // C5
                osc.frequency.setValueAtTime(783.99, now + 0.08); // G5
                gain.gain.setValueAtTime(0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
                osc.start(now);
                osc.stop(now + 0.25);

            } else if (type === 'clear') {
                // Downward swoosh
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(600, now);
                osc.frequency.exponentialRampToValueAtTime(150, now + 0.25);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
                osc.start(now);
                osc.stop(now + 0.25);

            } else if (type === 'spin') {
                // Disc Scratch / Spin sound
                osc.type = 'sine';
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.linearRampToValueAtTime(1200, now + 0.1);
                osc.frequency.linearRampToValueAtTime(200, now + 0.3);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
            }
        } catch (err) {
            console.warn('Audio play failed:', err);
        }
    }

    function updateSoundUI() {
        if (isSoundEnabled) {
            soundIcon.textContent = '🔊';
            soundLabel.textContent = 'Sound FX ON';
            soundToggleBtn.classList.remove('muted');
        } else {
            soundIcon.textContent = '🔇';
            soundLabel.textContent = 'Sound FX OFF';
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
    // 3. LocalStorage Data Persistence
    // --------------------------------------------------------------------------
    function loadSongs() {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
            try {
                songs = JSON.parse(savedData);
            } catch (e) {
                console.error('Error parsing stored playlist data:', e);
                songs = [...SAMPLE_PARTY_TRACKS];
            }
        } else {
            // Initial first time load with preloaded party hits
            songs = [...SAMPLE_PARTY_TRACKS];
            saveSongs();
        }
    }

    function saveSongs() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(songs));
    }

    // --------------------------------------------------------------------------
    // 4. Auto-Sort Algorithm & Rendering
    // --------------------------------------------------------------------------
    function sortSongs() {
        // Sort descending by votes.
        // If votes are equal, sort by creation time (newest first).
        songs.sort((a, b) => {
            if (b.votes !== a.votes) {
                return b.votes - a.votes;
            }
            return b.createdAt - a.createdAt;
        });
    }

    function renderPlaylist() {
        sortSongs();

        const searchQuery = searchInput.value.toLowerCase().trim();
        const filteredSongs = songs.filter(song => {
            const titleMatch = song.title.toLowerCase().includes(searchQuery);
            const artistMatch = (song.artist || '').toLowerCase().includes(searchQuery);
            return titleMatch || artistMatch;
        });

        // Update Total Stats
        const totalVotes = songs.reduce((sum, s) => sum + s.votes, 0);
        totalVotesCount.textContent = totalVotes.toLocaleString();
        totalSongsCount.textContent = songs.length.toLocaleString();

        // Update Top Pick Hero Section
        if (songs.length > 0) {
            const topSong = songs[0];
            topPickTitle.textContent = topSong.title;
            topPickArtist.textContent = topSong.artist ? `🎤 ${topSong.artist}` : '🎤 Unknown Artist';
            topPickVoteNum.textContent = topSong.votes;
        } else {
            topPickTitle.textContent = 'No songs yet';
            topPickArtist.textContent = 'Add a track below to start the party!';
            topPickVoteNum.textContent = '0';
        }

        // Handle Empty State
        if (filteredSongs.length === 0) {
            playlistContainer.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        } else {
            emptyState.classList.add('hidden');
        }

        // Build HTML for playlist items
        let htmlContent = '';
        filteredSongs.forEach((song, index) => {
            // Find overall rank in unsorted filtered view
            const overallRank = songs.findIndex(s => s.id === song.id) + 1;
            const rankClass = overallRank <= 3 ? `rank-${overallRank}` : '';

            htmlContent += `
                <div class="song-item ${rankClass}" data-id="${song.id}">
                    <div class="song-rank-badge" title="Rank #${overallRank}">
                        ${overallRank === 1 ? '👑' : overallRank}
                    </div>

                    <div class="song-main-info">
                        <div class="song-title-text" title="${escapeHtml(song.title)}">
                            ${escapeHtml(song.title)}
                        </div>
                        <div class="song-artist-text">
                            ${song.artist ? `🎤 ${escapeHtml(song.artist)}` : '🎤 Unknown Artist'}
                        </div>
                    </div>

                    <div class="song-actions">
                        <div class="vote-badge" id="voteCount-${song.id}" title="Current Votes">
                            ${song.votes}
                        </div>

                        <button 
                            class="upvote-btn" 
                            data-action="upvote" 
                            data-id="${song.id}" 
                            aria-label="Upvote ${escapeHtml(song.title)}"
                            title="Upvote track!"
                        >
                            👍
                        </button>

                        <button 
                            class="delete-single-btn" 
                            data-action="delete" 
                            data-id="${song.id}" 
                            aria-label="Remove ${escapeHtml(song.title)}"
                            title="Remove song"
                        >
                            🗑️
                        </button>
                    </div>
                </div>
            `;
        });

        playlistContainer.innerHTML = htmlContent;
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // --------------------------------------------------------------------------
    // 5. User Interaction Handlers
    // --------------------------------------------------------------------------

    // Add Song Form Handler
    addSongForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const titleVal = songTitleInput.value.trim();
        const artistVal = artistInput.value.trim();

        // Validation
        if (!titleVal) {
            songTitleInput.classList.add('invalid');
            titleError.classList.add('visible');
            songTitleInput.focus();
            return;
        }

        // Clear errors
        songTitleInput.classList.remove('invalid');
        titleError.classList.remove('visible');

        // Create new song record
        const newSong = {
            id: 'song_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            title: titleVal,
            artist: artistVal,
            votes: 1, // Start with 1 vote from submitter
            createdAt: Date.now()
        };

        songs.push(newSong);
        saveSongs();
        renderPlaylist();

        // Sound & Animation
        playSound('add');
        createParticleBurst(addSongBtn);

        // Reset Form
        songTitleInput.value = '';
        artistInput.value = '';
        songTitleInput.focus();
    });

    // Input error reset on typing
    songTitleInput.addEventListener('input', () => {
        if (songTitleInput.value.trim()) {
            songTitleInput.classList.remove('invalid');
            titleError.classList.remove('visible');
        }
    });

    // Delegation for Upvote & Individual Delete
    playlistContainer.addEventListener('click', (e) => {
        const upvoteBtn = e.target.closest('[data-action="upvote"]');
        const deleteBtn = e.target.closest('[data-action="delete"]');

        if (upvoteBtn) {
            const songId = upvoteBtn.getAttribute('data-id');
            handleUpvote(songId, upvoteBtn);
        } else if (deleteBtn) {
            const songId = deleteBtn.getAttribute('data-id');
            handleDeleteSong(songId);
        }
    });

    function handleUpvote(songId, btnEl) {
        const songIndex = songs.findIndex(s => s.id === songId);
        if (songIndex !== -1) {
            songs[songIndex].votes += 1;
            saveSongs();

            // Animate vote badge bump
            const badgeEl = document.getElementById(`voteCount-${songId}`);
            if (badgeEl) {
                badgeEl.classList.remove('bump');
                void badgeEl.offsetWidth; // Trigger reflow
                badgeEl.classList.add('bump');
            }

            // Sound FX & Sparkles
            playSound('vote');
            createParticleBurst(btnEl);

            // Re-render & Auto-sort
            renderPlaylist();
        }
    }

    function handleDeleteSong(songId) {
        songs = songs.filter(s => s.id !== songId);
        saveSongs();
        playSound('clear');
        renderPlaylist();
    }

    // Search Filter
    searchInput.addEventListener('input', () => {
        renderPlaylist();
    });

    // Load Sample Hits
    function loadSampleTracks() {
        // Merge samples without duplicating by title
        SAMPLE_PARTY_TRACKS.forEach(sample => {
            const exists = songs.some(s => s.title.toLowerCase() === sample.title.toLowerCase());
            if (!exists) {
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

    loadSamplesBtn.addEventListener('click', loadSampleTracks);
    emptyLoadBtn.addEventListener('click', loadSampleTracks);

    // Vinyl Disc Click Fun Interaction
    vinylIcon.addEventListener('click', () => {
        playSound('spin');
        createParticleBurst(vinylIcon);
    });

    // --------------------------------------------------------------------------
    // 6. Clear All & Confirmation Modal
    // --------------------------------------------------------------------------
    clearAllBtn.addEventListener('click', () => {
        if (songs.length === 0) return;
        confirmModal.classList.remove('hidden');
    });

    cancelModalBtn.addEventListener('click', () => {
        confirmModal.classList.add('hidden');
    });

    // Close modal on background click
    confirmModal.addEventListener('click', (e) => {
        if (e.target === confirmModal) {
            confirmModal.classList.add('hidden');
        }
    });

    confirmClearBtn.addEventListener('click', () => {
        songs = [];
        saveSongs();
        confirmModal.classList.add('hidden');
        playSound('clear');
        renderPlaylist();
    });

    // --------------------------------------------------------------------------
    // 7. Visual Particle Explosion Effect
    // --------------------------------------------------------------------------
    function createParticleBurst(targetEl) {
        if (!targetEl) return;
        const rect = targetEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const colors = ['#ff007f', '#00f3ff', '#ffd700', '#8c00ff', '#00ffaa'];

        for (let i = 0; i < 14; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';

            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = Math.floor(Math.random() * 8) + 6; // 6-14px

            // Random angle and distance
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 60 + 20;
            const dx = Math.cos(angle) * distance + 'px';
            const dy = Math.sin(angle) * distance + 'px';

            particle.style.left = centerX - size / 2 + 'px';
            particle.style.top = centerY - size / 2 + 'px';
            particle.style.width = size + 'px';
            particle.style.height = size + 'px';
            particle.style.backgroundColor = color;
            particle.style.boxShadow = `0 0 10px ${color}`;
            particle.style.setProperty('--dx', dx);
            particle.style.setProperty('--dy', dy);

            document.body.appendChild(particle);

            setTimeout(() => {
                particle.remove();
            }, 800);
        }
    }

    // --------------------------------------------------------------------------
    // 8. App Launch Init
    // --------------------------------------------------------------------------
    loadSongs();
    renderPlaylist();

});
