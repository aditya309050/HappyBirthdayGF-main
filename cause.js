// Audio Player Controller with Barbaad (Saiyaara) integration
// Supports local ./barbaad.mp3, YouTube Barbaad Official Stream, and WebAudio synth fallback

let ytPlayer = null;
let ytReady = false;
let ytPollingInterval = null;
let activeSource = 'html5'; // 'html5' | 'youtube' | 'synth'
let isPlaying = false;
let audioCtx = null;
let melodyInterval = null;

// Initialize YouTube IFrame Player for Barbaad (Saiyaara)
window.onYouTubeIframeAPIReady = function () {
    try {
        ytPlayer = new YT.Player('yt-player', {
            height: '1',
            width: '1',
            videoId: '0v5eHPfy5Lk', // Official "Barbaad" - Saiyaara track
            playerVars: {
                'playsinline': 1,
                'controls': 0,
                'disablekb': 1,
                'fs': 0,
                'rel': 0,
                'origin': window.location.origin && window.location.origin !== 'null' ? window.location.origin : '*'
            },
            events: {
                'onReady': () => {
                    ytReady = true;
                    console.log('YouTube Barbaad player ready');
                },
                'onStateChange': (e) => {
                    if (e.data === YT.PlayerState.PLAYING) {
                        setUIPlayState(true);
                        startYTPolling();
                    } else if (e.data === YT.PlayerState.PAUSED || e.data === YT.PlayerState.ENDED) {
                        setUIPlayState(false);
                        stopYTPolling();
                    }
                }
            }
        });
    } catch (err) {
        console.warn('YouTube API init error:', err);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const playBtn = document.getElementById('play-btn');
    const playIcon = document.getElementById('play-icon');
    const pauseIcon = document.getElementById('pause-icon');
    const audio = document.getElementById('audio-track');
    const progressBar = document.getElementById('progress-bar');
    const progressContainer = document.getElementById('progress-container');
    const currentTimeEl = document.getElementById('current-time');
    const totalDurationEl = document.getElementById('total-duration');
    const albumArt = document.querySelector('.player-album-art');
    const seeAlbumBtn = document.getElementById('see-album-btn');
    const ambientContainer = document.getElementById('ambient-container');

    // Format seconds to mm:ss
    function formatTime(seconds) {
        if (isNaN(seconds) || seconds < 0) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    // Toggle Play/Pause UI state
    window.setUIPlayState = function (playing) {
        isPlaying = playing;
        if (playing) {
            if (playIcon) playIcon.style.display = 'none';
            if (pauseIcon) pauseIcon.style.display = 'block';
            if (albumArt) albumArt.style.animation = 'pulseAlbum 2s ease-in-out infinite';
        } else {
            if (playIcon) playIcon.style.display = 'block';
            if (pauseIcon) pauseIcon.style.display = 'none';
            if (albumArt) albumArt.style.animation = 'none';
        }
    };

    // YouTube Progress Polling
    function startYTPolling() {
        stopYTPolling();
        ytPollingInterval = setInterval(() => {
            if (ytPlayer && typeof ytPlayer.getCurrentTime === 'function' && typeof ytPlayer.getDuration === 'function') {
                const current = ytPlayer.getCurrentTime();
                const duration = ytPlayer.getDuration();
                if (duration > 0) {
                    const percent = (current / duration) * 100;
                    if (progressBar) progressBar.style.width = `${percent}%`;
                    if (currentTimeEl) currentTimeEl.textContent = formatTime(current);
                    if (totalDurationEl) totalDurationEl.textContent = formatTime(duration);
                }
            }
        }, 250);
    }

    function stopYTPolling() {
        if (ytPollingInterval) {
            clearInterval(ytPollingInterval);
            ytPollingInterval = null;
        }
    }

    // Synthetic Romantic Melody Fallback
    function startSyntheticMelody() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        const notes = [261.63, 329.63, 392.00, 523.25, 440.00, 392.00, 349.23, 329.63];
        let noteIndex = 0;
        let elapsed = 0;

        melodyInterval = setInterval(() => {
            if (!isPlaying) return;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(notes[noteIndex % notes.length], audioCtx.currentTime);

            gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.12, audioCtx.currentTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.2);

            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.start();
            osc.stop(audioCtx.currentTime + 1.3);

            noteIndex++;
            elapsed += 0.8;
            if (currentTimeEl) currentTimeEl.textContent = formatTime(elapsed);
            if (progressBar) progressBar.style.width = `${(elapsed % 180) / 180 * 100}%`;
        }, 800);
    }

    function stopSyntheticMelody() {
        if (melodyInterval) {
            clearInterval(melodyInterval);
            melodyInterval = null;
        }
    }

    // Playback Controller
    function playTrack() {
        // 1. Try local audio first (barbaad.mp3)
        if (audio) {
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    activeSource = 'html5';
                    setUIPlayState(true);
                }).catch(err => {
                    console.log('Local audio file unavailable, using YouTube Barbaad stream:', err);
                    playYouTube();
                });
                return;
            }
        }
        playYouTube();
    }

    function playYouTube() {
        if (ytPlayer && ytReady && typeof ytPlayer.playVideo === 'function') {
            activeSource = 'youtube';
            ytPlayer.playVideo();
            setUIPlayState(true);
            startYTPolling();
        } else {
            console.log('Activating romantic synth preview fallback');
            activeSource = 'synth';
            setUIPlayState(true);
            startSyntheticMelody();
        }
    }

    function pauseTrack() {
        if (activeSource === 'html5' && audio) {
            audio.pause();
        } else if (activeSource === 'youtube' && ytPlayer && typeof ytPlayer.pauseVideo === 'function') {
            ytPlayer.pauseVideo();
            stopYTPolling();
        } else if (activeSource === 'synth') {
            stopSyntheticMelody();
        }
        setUIPlayState(false);
    }

    // Button Click Listener
    if (playBtn) {
        playBtn.addEventListener('click', () => {
            if (isPlaying) {
                pauseTrack();
            } else {
                playTrack();
            }
        });
    }

    // HTML5 Audio Events
    if (audio) {
        audio.addEventListener('timeupdate', () => {
            if (activeSource === 'html5' && audio.duration) {
                const percent = (audio.currentTime / audio.duration) * 100;
                if (progressBar) progressBar.style.width = `${percent}%`;
                if (currentTimeEl) currentTimeEl.textContent = formatTime(audio.currentTime);
            }
        });

        audio.addEventListener('loadedmetadata', () => {
            if (totalDurationEl && audio.duration) {
                totalDurationEl.textContent = formatTime(audio.duration);
            }
        });

        audio.addEventListener('ended', () => {
            setUIPlayState(false);
            if (progressBar) progressBar.style.width = '0%';
        });
    }

    // Scrubbing on Progress Bar
    if (progressContainer) {
        progressContainer.addEventListener('click', (e) => {
            const rect = progressContainer.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const fraction = Math.max(0, Math.min(1, clickX / rect.width));

            if (activeSource === 'html5' && audio && audio.duration) {
                audio.currentTime = fraction * audio.duration;
            } else if (activeSource === 'youtube' && ytPlayer && typeof ytPlayer.getDuration === 'function') {
                const newTime = fraction * ytPlayer.getDuration();
                ytPlayer.seekTo(newTime, true);
            }
        });
    }

    // Transition to Photo Album (last.html)
    if (seeAlbumBtn) {
        seeAlbumBtn.addEventListener('click', () => {
            pauseTrack();
            if (window.gsap) {
                gsap.to('body', {
                    opacity: 0,
                    scale: 0.98,
                    duration: 0.8,
                    ease: "power2.inOut",
                    onComplete: () => {
                        window.location.href = 'last.html';
                    }
                });
            } else {
                window.location.href = 'last.html';
            }
        });
    }

    // GSAP Card Entrance Animation
    if (window.gsap) {
        gsap.from('.birthday-card', {
            opacity: 0,
            y: 40,
            duration: 1.1,
            ease: "back.out(1.2)"
        });

        gsap.from('.flower-top-left', {
            opacity: 0,
            y: -15,
            duration: 0.9,
            delay: 0.3,
            ease: "back.out(1.5)"
        });

        gsap.from('.flower-top-right', {
            opacity: 0,
            y: -15,
            duration: 0.9,
            delay: 0.4,
            ease: "back.out(1.5)"
        });

        gsap.from('.bottom-action-wrapper', {
            opacity: 0,
            y: 20,
            duration: 0.8,
            delay: 0.7,
            ease: "power2.out"
        });
    }

    // Ambient floating particles
    const ambientSymbols = ['🌸', '✨', '🦋', '💖', '💮', '⭐'];
    function createAmbientParticle() {
        if (!ambientContainer) return;
        const particle = document.createElement('div');
        particle.className = 'ambient-particle';
        particle.textContent = ambientSymbols[Math.floor(Math.random() * ambientSymbols.length)];

        const startX = Math.random() * window.innerWidth;
        const startY = window.innerHeight + 20;
        const size = Math.random() * 16 + 14;

        particle.style.left = `${startX}px`;
        particle.style.top = `${startY}px`;
        particle.style.fontSize = `${size}px`;
        particle.style.opacity = '0';

        ambientContainer.appendChild(particle);

        if (window.gsap) {
            gsap.to(particle, {
                y: -(window.innerHeight + 60),
                x: (Math.random() - 0.5) * 80,
                rotation: (Math.random() - 0.5) * 180,
                opacity: 0.6,
                duration: Math.random() * 8 + 8,
                ease: "none",
                onComplete: () => particle.remove()
            });
        } else {
            setTimeout(() => particle.remove(), 8000);
        }
    }

    setInterval(createAmbientParticle, 1600);
});