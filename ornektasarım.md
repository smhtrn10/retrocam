<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>RetroCam - Y2K Vintage Camera Onboarding</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background: #000;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  font-family: 'Inter', sans-serif;
  padding: 20px;
}

.retro-onboarding {
  font-family: 'Inter', sans-serif;
  background: #0a0a0a;
  color: #f5f0e8;
  width: 100%;
  max-width: 400px;
  border-radius: 24px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 25px 80px rgba(0,0,0,0.6);
  min-height: 700px;
}

/* Film grain overlay */
.retro-onboarding::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 100;
  opacity: 0.6;
}

/* Screen container */
.screen {
  display: none;
  padding: 32px 24px 40px;
  min-height: 700px;
  position: relative;
  flex-direction: column;
}
.screen.active {
  display: flex;
}

/* Skip button */
.skip-btn {
  position: absolute;
  top: 16px;
  right: 20px;
  background: rgba(245,240,232,0.08);
  border: 1px solid rgba(245,240,232,0.15);
  color: rgba(245,240,232,0.5);
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 50;
  font-family: 'Inter', sans-serif;
}
.skip-btn:hover {
  background: rgba(245,240,232,0.15);
  color: rgba(245,240,232,0.8);
}

/* Progress dots */
.progress-dots {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-bottom: 28px;
}
.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(245,240,232,0.2);
  transition: all 0.4s ease;
}
.dot.active {
  background: #e8a87c;
  width: 24px;
  border-radius: 3px;
}

/* Typography */
.headline {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 28px;
  font-weight: 700;
  line-height: 1.15;
  margin-bottom: 12px;
  letter-spacing: -0.02em;
}
.headline .accent {
  color: #e8a87c;
}

.subheadline {
  font-size: 15px;
  color: rgba(245,240,232,0.6);
  line-height: 1.5;
  margin-bottom: 28px;
}

/* Screen 1: Hook */
.hook-visual {
  position: relative;
  width: 100%;
  height: 320px;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 24px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
}

.before-after-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.before-after-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.before-label, .after-label {
  position: absolute;
  bottom: 16px;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.before-label {
  left: 16px;
  background: rgba(0,0,0,0.6);
  color: rgba(245,240,232,0.7);
}
.after-label {
  right: 16px;
  background: #e8a87c;
  color: #0a0a0a;
}

.swipe-indicator {
  position: absolute;
  bottom: 50%;
  left: 50%;
  transform: translate(-50%, 50%);
  width: 48px;
  height: 48px;
  background: rgba(232,168,124,0.2);
  border: 2px solid #e8a87c;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: pulse-ring 2s ease-in-out infinite;
}

@keyframes pulse-ring {
  0%, 100% { transform: translate(-50%, 50%) scale(1); opacity: 1; }
  50% { transform: translate(-50%, 50%) scale(1.15); opacity: 0.7; }
}

/* Screen 2: Filters Carousel */
.filter-carousel {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 8px 0 20px;
  margin: 0 -24px;
  padding-left: 24px;
  padding-right: 24px;
  scrollbar-width: none;
}
.filter-carousel::-webkit-scrollbar {
  display: none;
}

.filter-card {
  min-width: 140px;
  height: 200px;
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  border: 2px solid transparent;
  transition: all 0.3s ease;
  cursor: pointer;
  flex-shrink: 0;
}
.filter-card:hover, .filter-card.selected {
  border-color: #e8a87c;
  transform: translateY(-4px);
}
.filter-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.filter-card .filter-name {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px;
  background: linear-gradient(transparent, rgba(0,0,0,0.8));
  font-size: 13px;
  font-weight: 600;
}
.filter-card .filter-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background: #e8a87c;
  color: #0a0a0a;
  padding: 3px 8px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 700;
}

/* Screen 3: Video Preview */
.video-preview {
  width: 100%;
  height: 280px;
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  margin-bottom: 24px;
  background: #1a1a2e;
}
.video-preview::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0,0,0,0.15) 2px,
    rgba(0,0,0,0.15) 4px
  );
  pointer-events: none;
}
.play-btn {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  background: rgba(232,168,124,0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}
.play-btn:hover {
  transform: translate(-50%, -50%) scale(1.1);
}

/* Screen 4: Photo Album Grid */
.album-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 24px;
}
.album-photo {
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  border: 2px solid rgba(245,240,232,0.1);
  transition: all 0.4s ease;
}
.album-photo:hover {
  transform: rotate(0deg) scale(1.05) !important;
  border-color: #e8a87c;
  z-index: 10;
}
.album-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.album-photo:nth-child(1) { transform: rotate(-3deg); }
.album-photo:nth-child(2) { transform: rotate(2deg); }
.album-photo:nth-child(3) { transform: rotate(-1deg); }
.album-photo:nth-child(4) { transform: rotate(4deg); }
.album-photo:nth-child(5) { transform: rotate(-2deg); }
.album-photo:nth-child(6) { transform: rotate(1deg); }

/* Screen 5: Vibe Selection */
.vibe-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}
.vibe-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: rgba(245,240,232,0.05);
  border: 2px solid rgba(245,240,232,0.1);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}
.vibe-card:hover, .vibe-card.selected {
  border-color: #e8a87c;
  background: rgba(232,168,124,0.1);
}
.vibe-card .vibe-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}
.vibe-card .vibe-info h4 {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 2px;
}
.vibe-card .vibe-info p {
  font-size: 12px;
  color: rgba(245,240,232,0.5);
}
.vibe-card .check {
  margin-left: auto;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid rgba(245,240,232,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  color: transparent;
}
.vibe-card.selected .check {
  background: #e8a87c;
  border-color: #e8a87c;
  color: #0a0a0a;
}

/* ATT Permission Screen */
.att-screen {
  text-align: center;
  padding-top: 60px;
}
.att-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #e8a87c, #d4a574);
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  font-size: 36px;
}
.att-benefits {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 24px 0;
}
.att-benefit {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(245,240,232,0.05);
  border-radius: 12px;
  text-align: left;
}
.att-benefit .benefit-icon {
  width: 32px;
  height: 32px;
  background: rgba(232,168,124,0.2);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

/* Buttons */
.btn-primary {
  width: 100%;
  padding: 16px 24px;
  background: linear-gradient(135deg, #e8a87c, #d4a574);
  color: #0a0a0a;
  border: none;
  border-radius: 16px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: auto;
  font-family: 'Inter', sans-serif;
}
.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(232,168,124,0.3);
}
.btn-secondary {
  width: 100%;
  padding: 14px 24px;
  background: transparent;
  color: rgba(245,240,232,0.6);
  border: 1px solid rgba(245,240,232,0.15);
  border-radius: 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 12px;
  font-family: 'Inter', sans-serif;
}
.btn-secondary:hover {
  border-color: rgba(245,240,232,0.3);
  color: rgba(245,240,232,0.8);
}

/* Light leak effect */
.light-leak {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(ellipse at 30% 20%, rgba(232,168,124,0.15) 0%, transparent 50%),
              radial-gradient(ellipse at 70% 80%, rgba(212,165,116,0.1) 0%, transparent 50%);
  pointer-events: none;
  z-index: 5;
}

/* VHS glitch effect */
.vhs-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 10;
  opacity: 0;
}
.vhs-overlay.active {
  animation: vhs-glitch 0.4s ease;
}
@keyframes vhs-glitch {
  0% { opacity: 0; }
  20% { opacity: 1; transform: translateX(3px); }
  40% { opacity: 0.8; transform: translateX(-3px); filter: hue-rotate(20deg); }
  60% { opacity: 1; transform: translateX(2px); }
  80% { opacity: 0.6; transform: translateX(-2px); }
  100% { opacity: 0; transform: translateX(0); }
}

/* Shutter flash */
.shutter-flash {
  position: fixed;
  inset: 0;
  background: white;
  opacity: 0;
  pointer-events: none;
  z-index: 999;
}
.shutter-flash.active {
  animation: flash 0.15s ease;
}
@keyframes flash {
  0% { opacity: 0; }
  50% { opacity: 0.9; }
  100% { opacity: 0; }
}

/* Fade in animation */
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-in {
  animation: fade-in-up 0.6s ease forwards;
}
.animate-delay-1 { animation-delay: 0.1s; opacity: 0; }
.animate-delay-2 { animation-delay: 0.2s; opacity: 0; }
.animate-delay-3 { animation-delay: 0.3s; opacity: 0; }
.animate-delay-4 { animation-delay: 0.4s; opacity: 0; }

/* Stats badge */
.stats-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(232,168,124,0.15);
  color: #e8a87c;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 16px;
}

/* Feature icons row */
.feature-row {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
.feature-item {
  flex: 1;
  text-align: center;
  padding: 12px;
  background: rgba(245,240,232,0.05);
  border-radius: 12px;
}
.feature-item .feature-icon {
  font-size: 20px;
  margin-bottom: 4px;
}
.feature-item .feature-label {
  font-size: 12px;
  font-weight: 600;
}

/* Review badge */
.review-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  padding: 12px 16px;
  background: rgba(232,168,124,0.1);
  border-radius: 12px;
}
.review-badge .review-icon {
  font-size: 20px;
}
.review-badge .review-text {
  font-size: 13px;
  font-weight: 600;
}
.review-badge .review-source {
  font-size: 11px;
  color: rgba(245,240,232,0.5);
}

/* Home hint */
.home-hint {
  margin-top: 32px;
  padding: 20px;
  background: rgba(245,240,232,0.05);
  border-radius: 16px;
  border: 1px dashed rgba(245,240,232,0.15);
}
.home-hint .hint-label {
  font-size: 13px;
  color: rgba(245,240,232,0.5);
  margin-bottom: 8px;
}
.home-hint .hint-text {
  font-size: 14px;
  color: #f5f0e8;
}
</style>
<base target="_blank">
</head>
<body>

<div class="retro-onboarding" id="onboardingContainer">
  <div class="light-leak"></div>
  <div class="shutter-flash" id="shutterFlash"></div>
  <div class="vhs-overlay" id="vhsOverlay"></div>

  <!-- SCREEN 1: HOOK / VALUE PROP -->
  <div class="screen active" id="screen1">
    <button class="skip-btn" onclick="skipOnboarding()">Atla</button>
    <div class="progress-dots">
      <div class="dot active"></div>
      <div class="dot"></div>
      <div class="dot"></div>
      <div class="dot"></div>
      <div class="dot"></div>
    </div>

    <div class="stats-badge animate-in">
      <span>🔥</span>
      <span>TikTok'ta 2M+ kullanıcı</span>
    </div>

    <h1 class="headline animate-in animate-delay-1">
      1998'deki gibi<br><span class="accent">çek</span>
    </h1>
    <p class="subheadline animate-in animate-delay-2">
      Anlık film tane, ışık sızıntısı ve Y2K tonları. Düzenleme yok, tek dokunuşla vintage estetik.
    </p>

    <div class="hook-visual animate-in animate-delay-3">
      <div class="before-after-container">
        <img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=500&fit=crop&q=80" alt="Before/After" style="filter: contrast(1.1) saturate(1.2);">
        <span class="before-label">Normal</span>
        <span class="after-label">Y2K</span>
        <div class="swipe-indicator">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" stroke-width="2.5">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </div>
      </div>
    </div>

    <button class="btn-primary animate-in animate-delay-4" onclick="nextScreen(2)">
      Keşfet →
    </button>
  </div>

  <!-- SCREEN 2: FILTERS CAROUSEL -->
  <div class="screen" id="screen2">
    <button class="skip-btn" onclick="skipOnboarding()">Atla</button>
    <div class="progress-dots">
      <div class="dot"></div>
      <div class="dot active"></div>
      <div class="dot"></div>
      <div class="dot"></div>
      <div class="dot"></div>
    </div>

    <h1 class="headline animate-in">
      4 ikonik<br><span class="accent">film kamerası</span>
    </h1>
    <p class="subheadline animate-in animate-delay-1">
      Her biri gerçek film stoklarından esinlenerek tasarlandı. Kaydır ve dene.
    </p>

    <div class="filter-carousel animate-in animate-delay-2">
      <div class="filter-card selected">
        <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=280&h=400&fit=crop&q=80" alt="Classic M" style="filter: sepia(0.3) contrast(0.9) brightness(1.05);">
        <span class="filter-badge">POPÜLER</span>
        <div class="filter-name">Classic M</div>
      </div>
      <div class="filter-card">
        <img src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=280&h=400&fit=crop&q=80" alt="D Classic" style="filter: contrast(1.1) saturate(0.8) brightness(1.1);">
        <div class="filter-name">D Classic</div>
      </div>
      <div class="filter-card">
        <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=280&h=400&fit=crop&q=80" alt="CCD R" style="filter: saturate(1.4) contrast(1.15) hue-rotate(-5deg);">
        <span class="filter-badge">Y2K</span>
        <div class="filter-name">CCD R</div>
      </div>
      <div class="filter-card">
        <img src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=280&h=400&fit=crop&q=80" alt="D Exp" style="filter: contrast(1.2) saturate(1.3) brightness(1.15);">
        <div class="filter-name">D Exp</div>
      </div>
    </div>

    <button class="btn-primary animate-in animate-delay-3" onclick="triggerShutter(); nextScreen(3)">
      Videoyu Gör →
    </button>
  </div>

  <!-- SCREEN 3: VIDEO / 8MM -->
  <div class="screen" id="screen3">
    <button class="skip-btn" onclick="skipOnboarding()">Atla</button>
    <div class="progress-dots">
      <div class="dot"></div>
      <div class="dot"></div>
      <div class="dot active"></div>
      <div class="dot"></div>
      <div class="dot"></div>
    </div>

    <h1 class="headline animate-in">
      8mm film<br><span class="accent">video modu</span>
    </h1>
    <p class="subheadline animate-in animate-delay-1">
      Videolarına otantik 8mm film tane, sıcak titreşim ve eski tarz tarama çizgileri ekle.
    </p>

    <div class="video-preview animate-in animate-delay-2">
      <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=300&fit=crop&q=80" alt="8mm Video" style="width:100%;height:100%;object-fit:cover;filter: sepia(0.2) contrast(1.1) saturate(0.9);">
      <div class="play-btn">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="#0a0a0a">
          <path d="M8 5v14l11-7z"/>
        </svg>
      </div>
      <div style="position:absolute;bottom:12px;left:12px;background:rgba(0,0,0,0.7);padding:4px 10px;border-radius:8px;font-size:11px;font-weight:600;">
        ▶ 8mm Demo
      </div>
    </div>

    <div class="feature-row">
      <div class="feature-item">
        <div class="feature-icon">🎞️</div>
        <div class="feature-label">8mm Tane</div>
      </div>
      <div class="feature-item">
        <div class="feature-icon">✨</div>
        <div class="feature-label">Işık Sızıntısı</div>
      </div>
      <div class="feature-item">
        <div class="feature-icon">📺</div>
        <div class="feature-label">VHS Tarama</div>
      </div>
    </div>

    <button class="btn-primary animate-in animate-delay-3" onclick="triggerVHS(); nextScreen(4)">
      Galeriyi Gör →
    </button>
  </div>

  <!-- SCREEN 4: SOCIAL PROOF / ALBUM -->
  <div class="screen" id="screen4">
    <button class="skip-btn" onclick="skipOnboarding()">Atla</button>
    <div class="progress-dots">
      <div class="dot"></div>
      <div class="dot"></div>
      <div class="dot"></div>
      <div class="dot active"></div>
      <div class="dot"></div>
    </div>

    <h1 class="headline animate-in">
      Viral olan<br><span class="accent">estetik</span>
    </h1>
    <p class="subheadline animate-in animate-delay-1">
      Instagram ve TikTok'ta milyonlarca beğeni alan Y2K görünümü. Tek dokunuşla sen de yap.
    </p>

    <div class="album-grid animate-in animate-delay-2">
      <div class="album-photo" style="--rot:-3deg;">
        <img src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=200&h=200&fit=crop&q=80" style="filter: sepia(0.3) contrast(1.1) saturate(1.2);">
      </div>
      <div class="album-photo" style="--rot:2deg;">
        <img src="https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=200&h=200&fit=crop&q=80" style="filter: contrast(1.15) saturate(1.3) hue-rotate(-5deg);">
      </div>
      <div class="album-photo" style="--rot:-1deg;">
        <img src="https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=200&h=200&fit=crop&q=80" style="filter: brightness(1.1) contrast(0.95) saturate(0.9);">
      </div>
      <div class="album-photo" style="--rot:4deg;">
        <img src="https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=200&h=200&fit=crop&q=80" style="filter: saturate(1.4) contrast(1.2) brightness(1.05);">
      </div>
      <div class="album-photo" style="--rot:-2deg;">
        <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&q=80" style="filter: sepia(0.2) contrast(1.05) saturate(1.1);">
      </div>
      <div class="album-photo" style="--rot:1deg;">
        <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&q=80" style="filter: contrast(1.1) saturate(0.85) brightness(1.1);">
      </div>
    </div>

    <div class="review-badge">
      <span class="review-icon">⭐</span>
      <div>
        <div class="review-text">"En iyi Y2K uygulaması"</div>
        <div class="review-source">App Store Kullanıcı Yorumu</div>
      </div>
    </div>

    <button class="btn-primary animate-in animate-delay-3" onclick="nextScreen(5)">
      Başlayalım →
    </button>
  </div>

  <!-- SCREEN 5: VIBE SELECTION + ATT -->
  <div class="screen" id="screen5">
    <button class="skip-btn" onclick="skipOnboarding()">Atla</button>
    <div class="progress-dots">
      <div class="dot"></div>
      <div class="dot"></div>
      <div class="dot"></div>
      <div class="dot"></div>
      <div class="dot active"></div>
    </div>

    <h1 class="headline animate-in">
      Senin <span class="accent">viben</span><br>hangisi?
    </h1>
    <p class="subheadline animate-in animate-delay-1">
      Sana özel filtreler önermemiz için birini seç. İstediğin zaman değiştirebilirsin.
    </p>

    <div class="vibe-options animate-in animate-delay-2">
      <div class="vibe-card selected" onclick="selectVibe(this)">
        <div class="vibe-icon" style="background: linear-gradient(135deg, #e8a87c, #d4a574);">✨</div>
        <div class="vibe-info">
          <h4>Y2K Glow</h4>
          <p>Parlak, canlı CCD tonları</p>
        </div>
        <div class="check">✓</div>
      </div>
      <div class="vibe-card" onclick="selectVibe(this)">
        <div class="vibe-icon" style="background: linear-gradient(135deg, #8b7355, #a0826d);">🎞️</div>
        <div class="vibe-info">
          <h4>90s Tane</h4>
          <p>Sıcak, doğal film tane</p>
        </div>
        <div class="check">✓</div>
      </div>
      <div class="vibe-card" onclick="selectVibe(this)">
        <div class="vibe-icon" style="background: linear-gradient(135deg, #6b8e9f, #8faabb);">📸</div>
        <div class="vibe-info">
          <h4>Disposable</h4>
          <p>Bulanık, pastel tek kullanımlık</p>
        </div>
        <div class="check">✓</div>
      </div>
    </div>

    <button class="btn-primary animate-in animate-delay-3" onclick="showATT()">
      Kamerayı Aç →
    </button>
  </div>

  <!-- ATT PERMISSION SCREEN -->
  <div class="screen" id="screenATT">
    <div class="att-screen">
      <div class="att-icon">🔒</div>
      <h1 class="headline" style="font-size: 24px;">
        Filtrelerini<br><span class="accent">kişiselleştir</span>
      </h1>
      <p class="subheadline" style="text-align:center;">
        Sana en uygun Y2K filtrelerini önerebilmemiz için izin ver. Verilerin asla paylaşılmaz.
      </p>

      <div class="att-benefits">
        <div class="att-benefit">
          <div class="benefit-icon">🎯</div>
          <div>
            <div style="font-size:13px;font-weight:600;">Kişiselleştirilmiş öneriler</div>
            <div style="font-size:11px;color:rgba(245,240,232,0.5);">Beğendiğin tarzlara göre filtre önerisi</div>
          </div>
        </div>
        <div class="att-benefit">
          <div class="benefit-icon">📊</div>
          <div>
            <div style="font-size:13px;font-weight:600;">Daha iyi deneyim</div>
            <div style="font-size:11px;color:rgba(245,240,232,0.5);">Uygulama performansını iyileştirmek için</div>
          </div>
        </div>
        <div class="att-benefit">
          <div class="benefit-icon">🔒</div>
          <div>
            <div style="font-size:13px;font-weight:600;">Güvenli ve gizli</div>
            <div style="font-size:11px;color:rgba(245,240,232,0.5);">Verilerin üçüncü taraflarla paylaşılmaz</div>
          </div>
        </div>
      </div>

      <button class="btn-primary" onclick="grantATT()" style="margin-top: 32px;">
        İzin Ver ve Başla
      </button>
      <button class="btn-secondary" onclick="denyATT()">
        Sonra Sor
      </button>
    </div>
  </div>

  <!-- HOME SCREEN PREVIEW -->
  <div class="screen" id="screenHome" style="justify-content:center;align-items:center;text-align:center;">
    <div style="padding: 40px 24px;">
      <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #e8a87c, #d4a574); border-radius: 24px; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; font-size: 36px;">
        📷
      </div>
      <h1 class="headline" style="font-size: 24px;">
        Hazır mısın?
      </h1>
      <p class="subheadline" style="text-align:center;">
        Kamerayı aç ve ilk Y2K fotoğrafını çek. Filtreler otomatik uygulanacak.
      </p>
      <div class="home-hint">
        <div class="hint-label">💡 İpucu</div>
        <div class="hint-text">3. fotoğrafından sonra tüm filtreleri açabilirsin.</div>
      </div>
      <button class="btn-primary" onclick="alert('Kamera açılıyor... 🎬')" style="margin-top: 24px;">
        Kamerayı Aç
      </button>
    </div>
  </div>
</div>

<script>
let currentScreen = 1;
const totalScreens = 5;

function nextScreen(screenNum) {
  document.getElementById('screen' + currentScreen).classList.remove('active');
  currentScreen = screenNum;
  const nextEl = document.getElementById('screen' + currentScreen);
  nextEl.classList.add('active');
  const animated = nextEl.querySelectorAll('.animate-in');
  animated.forEach(el => {
    el.style.animation = 'none';
    el.offsetHeight;
    el.style.animation = '';
  });
}

function skipOnboarding() {
  for(let i=1; i<=5; i++) {
    document.getElementById('screen' + i).classList.remove('active');
  }
  document.getElementById('screen5').classList.add('active');
  currentScreen = 5;
}

function selectVibe(card) {
  document.querySelectorAll('.vibe-card').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');
}

function showATT() {
  document.getElementById('screen5').classList.remove('active');
  document.getElementById('screenATT').classList.add('active');
}

function grantATT() {
  document.getElementById('screenATT').classList.remove('active');
  document.getElementById('screenHome').classList.add('active');
}

function denyATT() {
  document.getElementById('screenATT').classList.remove('active');
  document.getElementById('screenHome').classList.add('active');
}

function triggerShutter() {
  const flash = document.getElementById('shutterFlash');
  flash.classList.add('active');
  setTimeout(() => flash.classList.remove('active'), 200);
}

function triggerVHS() {
  const vhs = document.getElementById('vhsOverlay');
  vhs.classList.add('active');
  setTimeout(() => vhs.classList.remove('active'), 400);
}

// Auto-scroll filter carousel
let scrollPos = 0;
setInterval(() => {
  const carousel = document.querySelector('.filter-carousel');
  if(carousel && document.getElementById('screen2').classList.contains('active')) {
    scrollPos += 1;
    if(scrollPos > 100) scrollPos = 0;
    carousel.scrollLeft = scrollPos * 2;
  }
}, 50);
</script>

</body>
</html>