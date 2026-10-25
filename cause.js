// Audio Player Controller for Barbaad (Saiyaara)
// Plays local barbaad.mp3 with autoplay, interaction unlocker, and progress scrubbing

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
    const musicCaption = document.getElementById('music-caption');
    const seeAlbumBtn = document.getElementById('see-album-btn');
    const ambientContainer = document.getElementById('ambient-container');

    let isPlaying = false;

    // Format seconds to mm:ss
    function formatTime(seconds) {
        if (isNaN(seconds) || seconds < 0) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    // Toggle Play/Pause UI state
    function setUIPlayState(playing) {
        isPlaying = playing;
        if (playing) {
            if (playIcon) playIcon.style.display = 'none';
            if (pauseIcon) pauseIcon.style.display = 'block';
            if (albumArt) albumArt.style.animation = 'pulseAlbum 2s ease-in-out infinite';
            if (musicCaption) {
                musicCaption.textContent = 'playing for you — i picked this one because it always reminds me of you. 🎵';
            }
        } else {
            if (playIcon) playIcon.style.display = 'block';
            if (pauseIcon) pauseIcon.style.display = 'none';
            if (albumArt) albumArt.style.animation = 'none';
            if (musicCaption) {
                musicCaption.textContent = 'press play — i picked this one because it always reminds me of you.';
            }
        }
    }

    // Play function
    function playTrack() {
        if (!audio) return;
        audio.play().then(() => {
            setUIPlayState(true);
        }).catch(err => {
            console.log('Autoplay prevented by browser, waiting for user gesture:', err);
            setUIPlayState(false);
        });
    }

    // Pause function
    function pauseTrack() {
        if (!audio) return;
        audio.pause();
        setUIPlayState(false);
    }

    // Play/Pause button click
    if (playBtn) {
        playBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (audio.paused) {
                playTrack();
            } else {
                pauseTrack();
            }
        });
    }

    // Progress Bar & Time Update
    if (audio) {
        audio.addEventListener('timeupdate', () => {
            if (audio.duration) {
                const percent = (audio.currentTime / audio.duration) * 100;
                if (progressBar) progressBar.style.width = `${percent}%`;
                if (currentTimeEl) currentTimeEl.textContent = formatTime(audio.currentTime);
                if (totalDurationEl) totalDurationEl.textContent = formatTime(audio.duration);
            }
        });

        audio.addEventListener('loadedmetadata', () => {
            if (totalDurationEl && audio.duration) {
                totalDurationEl.textContent = formatTime(audio.duration);
            }
        });

        audio.addEventListener('play', () => setUIPlayState(true));
        audio.addEventListener('pause', () => setUIPlayState(false));

        audio.addEventListener('ended', () => {
            setUIPlayState(false);
            if (progressBar) progressBar.style.width = '0%';
            if (currentTimeEl) currentTimeEl.textContent = '0:00';
        });
    }

    // Scrubbing / Seeking on progress bar
    if (progressContainer && audio) {
        progressContainer.addEventListener('click', (e) => {
            e.stopPropagation();
            const rect = progressContainer.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const fraction = Math.max(0, Math.min(1, clickX / rect.width));
            if (audio.duration) {
                audio.currentTime = fraction * audio.duration;
            }
        });
    }

    // Autoplay Attempt on Page Load
    setTimeout(() => {
        playTrack();
    }, 400);

    // Interaction fallback: Starts music immediately on first touch/tap/click/scroll anywhere
    const unlockOnGesture = () => {
        if (audio && audio.paused) {
            playTrack();
        }
        window.removeEventListener('click', unlockOnGesture);
        window.removeEventListener('touchstart', unlockOnGesture);
        window.removeEventListener('pointerdown', unlockOnGesture);
        window.removeEventListener('scroll', unlockOnGesture);
    };

    window.addEventListener('click', unlockOnGesture, { once: true });
    window.addEventListener('touchstart', unlockOnGesture, { once: true });
    window.addEventListener('pointerdown', unlockOnGesture, { once: true });
    window.addEventListener('scroll', unlockOnGesture, { once: true });

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