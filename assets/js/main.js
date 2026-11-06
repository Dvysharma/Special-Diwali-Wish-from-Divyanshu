/**
 * Main Application Logic for:
 * "A Little Light, A Lot of Gratitude"
 * Cinematic Interactive Diwali Greeting Experience
 */

document.addEventListener('DOMContentLoaded', () => {
    // -------------------------------------------------------------------------
    // 1. Audio Engine & Controls (Instant Pause Everywhere)
    // -------------------------------------------------------------------------
    const filmMusicToggleBtn = document.getElementById('film-music-toggle');

    if (window.cinematicAudio) {
        if (filmMusicToggleBtn) {
            filmMusicToggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                window.cinematicAudio.toggle();
            });
        }

        window.cinematicAudio.onStateChange = (isPlaying) => {
            if (isPlaying) {
                if (filmMusicToggleBtn) {
                    filmMusicToggleBtn.textContent = '🔊 Music: Playing';
                    filmMusicToggleBtn.classList.add('active');
                    filmMusicToggleBtn.classList.remove('paused');
                }
            } else {
                if (filmMusicToggleBtn) {
                    filmMusicToggleBtn.textContent = '🔇 Music: Paused';
                    filmMusicToggleBtn.classList.remove('active');
                    filmMusicToggleBtn.classList.add('paused');
                }
            }
        };
    }

    // -------------------------------------------------------------------------
    // 2. Intersection Observer for Scroll Animations & Navigation Dots
    // -------------------------------------------------------------------------
    const chapters = document.querySelectorAll('.story-chapter');
    const navDots = document.querySelectorAll('.nav-dot');
    const currentChapterLabel = document.getElementById('current-chapter-label');

    const observerOptions = {
        root: null,
        rootMargin: '-15% 0px -15% 0px',
        threshold: 0.3
    };

    const chapterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const chapterId = entry.target.getAttribute('id');
                const chapterTitle = entry.target.dataset.title;

                chapters.forEach(ch => ch.classList.remove('active-in-view'));
                entry.target.classList.add('active-in-view');

                navDots.forEach(dot => {
                    dot.classList.toggle('active', dot.dataset.target === chapterId);
                });

                if (currentChapterLabel && chapterTitle) {
                    currentChapterLabel.textContent = chapterTitle;
                }
            }
        });
    }, observerOptions);

    chapters.forEach(ch => chapterObserver.observe(ch));

    navDots.forEach(dot => {
        dot.addEventListener('click', () => {
            const targetId = dot.dataset.target;
            const targetEl = document.getElementById(targetId);
            if (targetEl) {
                targetEl.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // -------------------------------------------------------------------------
    // 3. Interactive Diya in Chapter 5
    // -------------------------------------------------------------------------
    const diyaSimulator = new DiyaFlameSimulator('diya-flame-canvas');
    const lightDiyaBtn = document.getElementById('light-diya-btn');
    const diyaMuteBtn = document.getElementById('diya-mute-btn');
    const diyaWrapper = document.getElementById('interactive-diya-wrapper');
    const diyaQuote = document.getElementById('diya-reveal-quote');

    function syncDiyaMuteButton() {
        if (!diyaMuteBtn || !window.diyaSongPlayer) return;
        const isMuted = window.diyaSongPlayer.muted;
        diyaMuteBtn.innerHTML = `<span>${isMuted ? '🔇' : '🔊'}</span>`;
        diyaMuteBtn.title = isMuted ? 'Unmute the diya song' : 'Mute the diya song';
        diyaMuteBtn.setAttribute('aria-label', isMuted ? 'Unmute diya song' : 'Mute diya song');
        diyaMuteBtn.classList.toggle('muted', isMuted);
    }

    function triggerDiyaLighting() {
        diyaSimulator.light();
        if (diyaWrapper) diyaWrapper.classList.add('is-lit');
        if (diyaQuote) diyaQuote.classList.add('visible');
        if (lightDiyaBtn) {
            lightDiyaBtn.innerHTML = `<span>✨ Diya Glowing Brightly</span>`;
            lightDiyaBtn.classList.add('lit-btn');
        }

        if (window.cinematicAudio && window.cinematicAudio.isPlaying) {
            window.cinematicAudio.stop();
        }

        if (window.playDiyaSong) {
            window.playDiyaSong();
        }

        if (window.diwaliParticles && diyaWrapper) {
            const rect = diyaWrapper.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            window.diwaliParticles.createBurst(centerX, centerY, 40);
            window.diwaliParticles.createDiyaCelebrationBurst(centerX, centerY);
        }
    }

    if (lightDiyaBtn) lightDiyaBtn.addEventListener('click', triggerDiyaLighting);
    if (diyaWrapper) diyaWrapper.addEventListener('click', triggerDiyaLighting);

    if (diyaMuteBtn) {
        diyaMuteBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            if (!window.diyaSongPlayer) return;
            window.diyaSongPlayer.muted = !window.diyaSongPlayer.muted;
            syncDiyaMuteButton();
        });
        syncDiyaMuteButton();
    }

    // -------------------------------------------------------------------------
    // 4. Cinematic Film Mode: Full Video & Music Synchronization
    // -------------------------------------------------------------------------
    const filmModal = document.getElementById('film-modal');
    const startFilmBtn = document.getElementById('start-film-btn');
    const heroPlayFilmBtn = document.getElementById('hero-play-film-btn');
    const closeFilmBtn = document.getElementById('close-film-btn');
    const filmProgressContainer = document.getElementById('film-progress-container');
    const filmProgressBar = document.getElementById('film-progress-bar');
    const filmSeekThumb = document.getElementById('film-seek-thumb');
    const filmSlides = document.querySelectorAll('.film-slide');
    const filmPlayPauseBtn = document.getElementById('film-play-pause');
    const filmTimeCurrent = document.getElementById('film-time-current');

    let filmPlaying = false;
    let filmProgress = 0; // 0 to 100
    let filmDuration = 55; // 55 seconds
    let filmInterval = null;
    let currentSlideIndex = 0;
    let isScrubbing = false;
    let filmUiHideTimer = null;

    function showFilmUi() {
        if (!filmModal) return;
        filmModal.classList.remove('ui-hidden');
        if (filmUiHideTimer) {
            clearTimeout(filmUiHideTimer);
            filmUiHideTimer = null;
        }
    }

    function scheduleFilmUiHide() {
        if (!filmModal || !filmPlaying) return;
        if (filmUiHideTimer) clearTimeout(filmUiHideTimer);
        filmUiHideTimer = setTimeout(() => {
            if (filmPlaying) {
                filmModal.classList.add('ui-hidden');
            }
        }, 2600);
    }

    const slideSchedule = [
        { start: 0, end: 9, index: 0 },    // First day (0 - 9s)
        { start: 9, end: 18, index: 1 },   // Questions gag (9 - 18s)
        { start: 18, end: 28, index: 2 },  // Mentorship (18 - 28s)
        { start: 28, end: 38, index: 3 },  // Fresher learning (28 - 38s)
        { start: 38, end: 48, index: 4 },  // Diwali Light (38 - 48s)
        { start: 48, end: 55, index: 5 }   // Finale Card (48 - 55s)
    ];

    function openFilmMode() {
        if (!filmModal) return;
        filmModal.classList.add('active');
        filmModal.classList.remove('ui-hidden');
        document.body.style.overflow = 'hidden';

        resetFilm();
        playFilm();
    }

    function closeFilmMode() {
        if (!filmModal) return;
        filmModal.classList.remove('active');
        filmModal.classList.remove('ui-hidden');
        document.body.style.overflow = '';
        pauseFilm(); // Automatically pauses video AND music
    }

    function resetFilm() {
        filmProgress = 0;
        currentSlideIndex = 0;
        updateFilmUI(0);
    }

    // When the video plays, music starts/resumes automatically
    function playFilm() {
        if (filmProgress >= 100) resetFilm();
        filmPlaying = true;
        showFilmUi();
        if (filmPlayPauseBtn) filmPlayPauseBtn.innerHTML = '⏸ Pause';

        // Auto-play / resume music with video
        if (window.cinematicAudio && !window.cinematicAudio.isPlaying) {
            window.cinematicAudio.start();
        }

        scheduleFilmUiHide();

        const tickRateMs = 100;
        const progressIncrement = (tickRateMs / 1000) / filmDuration * 100;

        if (filmInterval) clearInterval(filmInterval);
        filmInterval = setInterval(() => {
            if (!isScrubbing) {
                filmProgress += progressIncrement;
                if (filmProgress >= 100) {
                    filmProgress = 100;
                    pauseFilm();
                    if (filmPlayPauseBtn) filmPlayPauseBtn.innerHTML = '🔄 Replay';
                }
                updateFilmUI(filmProgress);
            }
        }, tickRateMs);
    }

    // When the video pauses, music also PAUSES automatically
    function pauseFilm() {
        filmPlaying = false;
        clearInterval(filmInterval);
        filmInterval = null;
        showFilmUi();
        if (filmUiHideTimer) {
            clearTimeout(filmUiHideTimer);
            filmUiHideTimer = null;
        }
        if (filmPlayPauseBtn && filmProgress < 100) {
            filmPlayPauseBtn.innerHTML = '▶ Play';
        }

        // Instant music pause synchronized with video pause
        if (window.cinematicAudio && window.cinematicAudio.isPlaying) {
            window.cinematicAudio.stop();
        }
    }

    function updateFilmUI(progress) {
        if (filmProgressBar) {
            filmProgressBar.style.width = `${progress}%`;
        }
        if (filmSeekThumb) {
            filmSeekThumb.style.left = `${progress}%`;
        }

        const currentTimeSeconds = Math.floor((progress / 100) * filmDuration);
        const mins = Math.floor(currentTimeSeconds / 60);
        const secs = String(currentTimeSeconds % 60).padStart(2, '0');
        if (filmTimeCurrent) filmTimeCurrent.textContent = `${mins}:${secs}`;

        const target = slideSchedule.find(s => currentTimeSeconds >= s.start && currentTimeSeconds < s.end) || slideSchedule[slideSchedule.length - 1];
        if (target && target.index !== currentSlideIndex) {
            currentSlideIndex = target.index;
        }

        filmSlides.forEach((slide, idx) => {
            slide.classList.toggle('active', idx === currentSlideIndex);
        });
    }

    // Interactive Timeline Scrubber Seeking (Click & Drag)
    function seekFromEvent(e) {
        if (!filmProgressContainer) return;
        const rect = filmProgressContainer.getBoundingClientRect();
        const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
        let offsetX = clientX - rect.left;
        if (offsetX < 0) offsetX = 0;
        if (offsetX > rect.width) offsetX = rect.width;

        filmProgress = (offsetX / rect.width) * 100;
        updateFilmUI(filmProgress);
    }

    if (filmProgressContainer) {
        filmProgressContainer.addEventListener('mousedown', (e) => {
            isScrubbing = true;
            seekFromEvent(e);
        });

        window.addEventListener('mousemove', (e) => {
            if (isScrubbing) seekFromEvent(e);
        });

        window.addEventListener('mouseup', () => {
            if (isScrubbing) isScrubbing = false;
        });

        // Touch support for mobile seeking
        filmProgressContainer.addEventListener('touchstart', (e) => {
            isScrubbing = true;
            seekFromEvent(e);
        }, { passive: true });

        window.addEventListener('touchmove', (e) => {
            if (isScrubbing) seekFromEvent(e);
        }, { passive: true });

        window.addEventListener('touchend', () => {
            if (isScrubbing) isScrubbing = false;
        });
    }

    // Play / Pause Button in Video Modal
    if (filmPlayPauseBtn) {
        filmPlayPauseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (filmProgress >= 100) {
                resetFilm();
                playFilm();
            } else if (filmPlaying) {
                pauseFilm();
            } else {
                playFilm();
            }
        });
    }

    if (filmModal) {
        filmModal.addEventListener('mousemove', () => {
            if (filmPlaying) {
                showFilmUi();
                scheduleFilmUiHide();
            }
        });

        filmModal.addEventListener('pointermove', () => {
            if (filmPlaying) {
                showFilmUi();
                scheduleFilmUiHide();
            }
        });

        filmModal.addEventListener('mouseenter', () => {
            if (filmPlaying) {
                showFilmUi();
                scheduleFilmUiHide();
            }
        });
    }

    if (startFilmBtn) startFilmBtn.addEventListener('click', openFilmMode);
    if (heroPlayFilmBtn) heroPlayFilmBtn.addEventListener('click', openFilmMode);
    if (closeFilmBtn) closeFilmBtn.addEventListener('click', closeFilmMode);

    // Keyboard Shortcuts inside film modal
    window.addEventListener('keydown', (e) => {
        if (!filmModal || !filmModal.classList.contains('active')) return;

        if (e.key === ' ' || e.code === 'Space') {
            e.preventDefault();
            if (filmPlaying) pauseFilm(); else playFilm();
        } else if (e.key === 'Escape') {
            closeFilmMode();
        }
    });

    // -------------------------------------------------------------------------
    // 5. Download Greeting Card (Clean, Divyanshu Sign-Off)
    // -------------------------------------------------------------------------
    const downloadCardBtn = document.getElementById('download-card-btn');
    if (downloadCardBtn) {
        downloadCardBtn.addEventListener('click', generateCardImage);
    }

    function generateCardImage() {
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1350;
        const ctx = canvas.getContext('2d');

        // Draw rich gradient background
        const grad = ctx.createLinearGradient(0, 0, 0, 1350);
        grad.addColorStop(0, '#0c0f1d');
        grad.addColorStop(0.5, '#19152b');
        grad.addColorStop(1, '#080911');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1080, 1350);

        // Draw ornamental golden border
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 4;
        ctx.strokeRect(40, 40, 1000, 1270);
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(52, 52, 976, 1246);

        // Load scene5 image into card
        const img = new Image();
        img.src = 'assets/images/scene5.jpg';
        img.onload = () => {
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(80, 80, 920, 520, 24);
            ctx.clip();
            ctx.drawImage(img, 80, 80, 920, 520);
            ctx.restore();

            ctx.strokeStyle = '#f39c12';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(80, 80, 920, 520, 24);
            ctx.stroke();

            ctx.textAlign = 'center';

            ctx.fillStyle = '#ffcf40';
            ctx.font = 'bold 44px Georgia, serif';
            ctx.fillText('✨ A Little Light, A Lot of Gratitude ✨', 540, 670);

            ctx.fillStyle = '#ffffff';
            ctx.font = '300 28px sans-serif';
            ctx.fillText('Some people make ordinary days a little brighter.', 540, 750);
            ctx.fillText('Some people make difficult things a little easier.', 540, 805);
            ctx.fillText('And some people deserve a little extra appreciation.', 540, 860);

            ctx.fillStyle = '#ffd200';
            ctx.font = '600 32px Georgia, serif';
            ctx.fillText('Thank you for being one of those people. 💖', 540, 940);

            ctx.fillStyle = '#ff9900';
            ctx.font = 'bold 46px Georgia, serif';
            ctx.fillText('Wishing you a very Happy Diwali! 🪔', 540, 1030);

            ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.font = 'italic 26px sans-serif';
            ctx.fillText('With gratitude, Divyanshu', 540, 1150);

            // Trigger Clean Download
            const link = document.createElement('a');
            link.download = 'Happy_Diwali_Divyanshu.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        };

        img.onerror = () => {
            alert('Greeting card image ready.');
        };
    }
});