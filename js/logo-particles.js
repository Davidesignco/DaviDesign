/* ============================================================
   DAVID MUÑOZ STUDIO — Dynamic Favicon & Interactive Particles
   Interactive neon particles floating around the logo & favicon
   ============================================================ */

/* --- 1. DYNAMIC NEON FAVICON ANIMATOR --- */
(function () {
  'use strict';

  // Create offscreen canvas for favicon
  const favCanvas = document.createElement('canvas');
  favCanvas.width = 32;
  favCanvas.height = 32;
  const favCtx = favCanvas.getContext('2d');

  let colorPhase = 0;

  // Animation Loop (Runs at ~18 FPS to be smooth yet ultra-lightweight)
  function animateFavicon() {
    // If tab is not active, pause animation to save CPU
    if (document.hidden) {
      setTimeout(animateFavicon, 1000);
      return;
    }

    favCtx.clearRect(0, 0, 32, 32);

    // Oscillation for the breathing color transition
    colorPhase += 0.08; // Breathing speed
    const t = 0.5 + 0.5 * Math.sin(colorPhase);
    
    // Interpolate color from white (255,255,255) to bright cyan (0,237,255)
    const r = Math.round(255 - 255 * t);
    const g = Math.round(255 - 18 * t);
    const textColor = `rgb(${r}, ${g}, 255)`;

    // Draw glowing "Ñ" in center
    favCtx.save();
    favCtx.textAlign = 'center';
    favCtx.textBaseline = 'middle';
    
    // Intense neon shadow/glow
    favCtx.shadowColor = '#00EDFF';
    favCtx.shadowBlur = 2 + 7 * t; // Glow expands when cyan
    favCtx.fillStyle = textColor;
    
    // Font family hierarchy
    favCtx.font = "900 20px 'Outfit', 'Montserrat', sans-serif";
    favCtx.fillText('Ñ', 16, 17);
    favCtx.restore();

    // Update all favicon link elements in the head
    const dataUrl = favCanvas.toDataURL('image/png');
    const faviconLinks = document.querySelectorAll("link[rel*='icon']");
    
    if (faviconLinks.length > 0) {
      faviconLinks.forEach(link => {
        link.type = 'image/png';
        link.href = dataUrl;
      });
    } else {
      // Fallback: create favicon link if it doesn't exist
      const newLink = document.createElement('link');
      newLink.rel = 'icon';
      newLink.type = 'image/png';
      newLink.href = dataUrl;
      document.head.appendChild(newLink);
    }

    setTimeout(animateFavicon, 55); // ~18 FPS
  }

  // Start the animation
  animateFavicon();
})();

/* --- 2. INTERACTIVE LOGO PARTICLES (NAVBAR) --- */
(function () {
  'use strict';

  const container = document.getElementById('navLogoContainer');
  const glowChar = document.getElementById('glowÑ');
  
  if (!container || !glowChar) {
    return; // Exit if the logo elements are not present on this page
  }

  const canvasBack = container.querySelector('.logo-particles-back');
  const canvasFront = container.querySelector('.logo-particles-front');

  if (!canvasBack || !canvasFront) {
    return;
  }

  const ctxBack = canvasBack.getContext('2d');
  const ctxFront = canvasFront.getContext('2d');

  // Particle params (Approved settings)
  const globalParams = {
    speed: 1.2,
    density: 3,        // Exactly 3 particles
    lifespan: 180,     // Horizontal dispersion reach
    size: 2.2,         // Particle size
    color: '#00EDFF'   // Cyan neon
  };

  let particles = [];
  let isHovered = false;
  let mouseX = null;
  let mouseY = null;

  // Resize canvases to actual element size including high DPI support
  function resizeCanvases() {
    const rect = canvasBack.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    
    canvasBack.width = rect.width * window.devicePixelRatio;
    canvasBack.height = rect.height * window.devicePixelRatio;
    ctxBack.resetTransform();
    ctxBack.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    canvasFront.width = rect.width * window.devicePixelRatio;
    canvasFront.height = rect.height * window.devicePixelRatio;
    ctxFront.resetTransform();
    ctxFront.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  window.addEventListener('resize', resizeCanvases);
  window.addEventListener('load', resizeCanvases);
  setTimeout(resizeCanvases, 200); // Back-up for font rendering delays

  // Track mouse relative to canvas
  container.addEventListener('mousemove', (e) => {
    const rectCanvas = canvasBack.getBoundingClientRect();
    mouseX = e.clientX - rectCanvas.left;
    mouseY = e.clientY - rectCanvas.top;
  });

  container.addEventListener('mouseleave', () => {
    mouseX = null;
    mouseY = null;
    isHovered = false;
  });

  container.addEventListener('mouseenter', () => {
    isHovered = true;
  });

  // Locate emitter center point (the Ñ letter)
  function getEmitterPos() {
    if (!glowChar) return { x: 100, y: 20 };
    const rectÑ = glowChar.getBoundingClientRect();
    const rectCanvas = canvasBack.getBoundingClientRect();
    return {
      x: (rectÑ.left - rectCanvas.left) + rectÑ.width / 2,
      y: (rectÑ.top - rectCanvas.top) + rectÑ.height / 2
    };
  }

  // Get logo bounding box for vertical alignment constraints and horizontal range
  function getLogoBounds() {
    const wordsEl = container.querySelector('.logo-words');
    const rectText = wordsEl ? wordsEl.getBoundingClientRect() : container.getBoundingClientRect();
    const rectCanvas = canvasBack.getBoundingClientRect();
    const width = rectText.width || 180;
    const height = rectText.height || 30;
    return {
      left: rectText.left - rectCanvas.left || 100,
      right: rectText.right - rectCanvas.left || 280,
      top: rectText.top - rectCanvas.top || 15,
      bottom: rectText.bottom - rectCanvas.top || 45,
      width: width,
      height: height
    };
  }

  // Particle definition
  class Particle {
    constructor(x, y) {
      // Slight initial jitter to prevent exact overlap
      this.x = x + (Math.random() - 0.5) * 4;
      this.y = y + (Math.random() - 0.5) * 4;
      
      this.vx = (Math.random() - 0.5) * 0.5;
      this.vy = (Math.random() - 0.5) * 0.5;
      
      // Slow breathing glow cycle
      this.glowPhase = Math.random() * Math.PI * 2;
      this.glowSpeed = 0.008 + Math.random() * 0.012;
      
      // Slow 3D depth weave phase (renders behind or in front of text)
      this.depthPhase = Math.random() * Math.PI * 2;
      this.depthSpeed = 0.003 + Math.random() * 0.007;
      this.depth = 0.4 + Math.random() * 1.2;
      
      this.size = globalParams.size;
      this.alpha = 0;
      
      this.targetX = this.x;
      this.targetY = this.y;
    }

    update() {
      const emitter = getEmitterPos();
      const bounds = getLogoBounds();
      
      // 1. Weave depth oscillation
      this.depthPhase += this.depthSpeed * globalParams.speed;
      this.depth = 0.4 + 1.2 * (Math.sin(this.depthPhase) * 0.5 + 0.5);
      
      // Size based on Z-depth scaling
      this.size = globalParams.size * (0.6 + this.depth * 0.4) * (0.5 + this.depth * 0.5);
      
      // 2. Glow oscillation
      this.glowPhase += this.glowSpeed * globalParams.speed;
      const baseOscillatingAlpha = 0.55 + 0.45 * (Math.sin(this.glowPhase) * 0.5 + 0.5);
      
      let targetAlpha = 0;
      
      if (isHovered) {
        targetAlpha = baseOscillatingAlpha;
        
        // Pick a new target coordinate occasionally
        if (Math.random() < 0.015 || Math.abs(this.x - this.targetX) < 15) {
          const spreadFactor = globalParams.lifespan / 90;
          const halfWidth = (bounds.width * 0.5) * spreadFactor;
          
          const minX = Math.max(bounds.left - 20, emitter.x - halfWidth);
          const maxX = Math.min(bounds.right + 20, emitter.x + halfWidth);
          
          this.targetX = minX + Math.random() * (maxX - minX);
          // Tight vertical bound near center line (±5px)
          this.targetY = bounds.top + bounds.height * 0.45 + (Math.random() - 0.5) * 10;
        }
        
        // Steer force towards wander target
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 5) {
          const steerForce = 0.035 * globalParams.speed;
          this.vx += (dx / dist) * steerForce;
          this.vy += (dy / dist) * steerForce;
        }
        
        // Prevent overlap (separation force with NaN safety check)
        for (let other of particles) {
          if (other === this) continue;
          const odx = this.x - other.x;
          const ody = this.y - other.y;
          const odist = Math.sqrt(odx * odx + ody * ody);
          
          if (odist === 0) {
            const angle = Math.random() * Math.PI * 2;
            this.vx += Math.cos(angle) * 0.5;
            this.vy += Math.sin(angle) * 0.5;
            continue;
          }
          
          if (odist < 25) {
            const force = (25 - odist) / 25;
            this.vx += (odx / odist) * force * 0.15;
            this.vy += (ody / odist) * force * 0.15;
          }
        }
        
        // Mouse repulsion (highly anisotropic: push horizontally, barely vertically)
        if (mouseX !== null && mouseY !== null) {
          const mdx = this.x - mouseX;
          const mdy = this.y - mouseY;
          const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
          if (mdist > 0 && mdist < 75) {
            const force = (75 - mdist) / 75;
            this.vx += (mdx / mdist) * force * 0.45 * globalParams.speed;
            this.vy += (mdy / mdist) * force * 0.10 * globalParams.speed;
          }
        }
        
        // Friction
        this.vx *= 0.96;
        this.vy *= 0.96;
        
      } else {
        // Sleep mode: return to the Ñ and fade out
        const dx = emitter.x - this.x;
        const dy = emitter.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 1.5) {
          const gatherForce = 0.18 * globalParams.speed;
          this.vx += (dx / dist) * gatherForce;
          this.vy += (dy / dist) * gatherForce;
          this.vx *= 0.85;
          this.vy *= 0.85;
        } else {
          this.vx = 0;
          this.vy = 0;
          this.x = emitter.x;
          this.y = emitter.y;
        }
        
        if (dist < 45) {
          targetAlpha = (dist / 45) * baseOscillatingAlpha;
        } else {
          targetAlpha = baseOscillatingAlpha;
        }
      }
      
      this.x += this.vx;
      this.y += this.vy;
      this.alpha += (targetAlpha - this.alpha) * 0.08;
    }

    draw(ctx) {
      if (this.alpha < 0.01) return;
      
      ctx.save();
      
      // 1. Soft outer neon glow
      ctx.globalAlpha = Math.max(0, Math.min(1, this.alpha * 0.35));
      ctx.fillStyle = globalParams.color;
      ctx.beginPath();
      const glowSize = this.size * 3.5;
      ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
      ctx.fill();
      
      // 2. Intermediate solid neon ring
      ctx.globalAlpha = Math.max(0, Math.min(1, this.alpha * 0.7));
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // 3. Bright white core
      ctx.globalAlpha = Math.max(0, Math.min(1, this.alpha));
      if (this.depth >= 0.9) {
        ctx.shadowColor = globalParams.color;
        ctx.shadowBlur = 10;
      }
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    }
  }

  // Initialize particle pool
  function initParticlePool() {
    particles = [];
    const emitter = getEmitterPos();
    for (let i = 0; i < globalParams.density; i++) {
      particles.push(new Particle(emitter.x, emitter.y));
    }
  }

  // Animation Loop
  function loop() {
    ctxBack.clearRect(0, 0, canvasBack.width, canvasBack.height);
    ctxFront.clearRect(0, 0, canvasFront.width, canvasFront.height);
    
    particles.forEach(p => {
      p.update();
      if (p.depth < 0.9) {
        p.draw(ctxBack);
      } else {
        p.draw(ctxFront);
      }
    });
    
    requestAnimationFrame(loop);
  }

  // Bind setup
  window.addEventListener('load', () => {
    resizeCanvases();
    initParticlePool();
  });
  
  // Execution
  resizeCanvases();
  initParticlePool();
  loop();
})();
