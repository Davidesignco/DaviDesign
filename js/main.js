/* ============================================================
   DAVID MUÑOZ STUDIO — Main JS
   Scroll animations, nav, FAQ, counters
   ============================================================ */

(function () {
  'use strict';

  /* ── NAV SCROLL ──────────────────────────────────────────── */
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    const onScroll = () => {
      navbar.classList.toggle('scrolled', window.scrollY > 60);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── MOBILE NAV ──────────────────────────────────────────── */
  const toggle = document.querySelector('.nav-toggle');
  const mobileNav = document.querySelector('.nav-mobile');
  const floatingBtn = document.getElementById('floatingCTA');

  if (toggle && mobileNav) {
    toggle.addEventListener('click', () => {
      const isOpen = mobileNav.classList.toggle('open');
      toggle.classList.toggle('active');

      // Sincronizar con el botón flotante
      if (floatingBtn) {
        if (isOpen) {
          floatingBtn.classList.add('menu-open');
        } else {
          floatingBtn.classList.remove('menu-open');
        }
      }
    });

    mobileNav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        toggle.classList.remove('active');
        if (floatingBtn) floatingBtn.classList.remove('menu-open');
      });
    });
  }

  /* ── SCROLL REVEAL ───────────────────────────────────────── */
  const revealEls = document.querySelectorAll('.reveal');

  if (revealEls.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(el => observer.observe(el));
  }

  /* ── FAQ ACCORDION ───────────────────────────────────────── */
  document.querySelectorAll('.faq-question').forEach(q => {
    q.addEventListener('click', () => {
      const item = q.closest('.faq-item');
      const isOpen = item.classList.contains('open');
      // Close all
      document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });

  /* ── COUNTER ANIMATION ───────────────────────────────────── */
  function animateCounter(el, target, suffix = '', decimals = 0) {
    const duration = 2000;
    const start = performance.now();
    const startVal = 0;

    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = startVal + (target - startVal) * eased;

      const formatted = decimals > 0
        ? current.toFixed(decimals)
        : Math.round(current).toLocaleString();

      el.textContent = formatted + suffix;
      if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
  }

  const counters = document.querySelectorAll('[data-counter]');
  if (counters.length) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const targetStr = el.dataset.counter;
          const target = parseFloat(targetStr);
          const suffix = el.dataset.suffix || '';
          const decimals = targetStr.includes('.') ? (targetStr.split('.')[1] || '').length : 0;

          animateCounter(el, target, suffix, decimals);
          counterObserver.unobserve(el);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(c => counterObserver.observe(c));
  }

  /* ── CURSOR GLOW (desktop) ───────────────────────────────── */
  if (window.matchMedia('(pointer: fine)').matches) {
    const glow = document.createElement('div');
    glow.style.cssText = `
      position: fixed; pointer-events: none; z-index: 9999;
      width: 320px; height: 320px; border-radius: 50%;
      background: radial-gradient(circle, rgba(0,237,255,0.04) 0%, transparent 70%);
      transform: translate(-50%, -50%);
      transition: opacity 0.3s;
      top: 0; left: 0;
    `;
    document.body.appendChild(glow);

    let mouseX = 0, mouseY = 0;
    let glowX = 0, glowY = 0;

    document.addEventListener('mousemove', e => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    (function animGlow() {
      glowX += (mouseX - glowX) * 0.1;
      glowY += (mouseY - glowY) * 0.1;
      glow.style.left = glowX + 'px';
      glow.style.top = glowY + 'px';
      requestAnimationFrame(animGlow);
    })();
  }

  /* ── SMOOTH ANCHOR SCROLL ────────────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ── ACTIVE NAV LINK ─────────────────────────────────────── */
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .nav-dropdown-menu a, .nav-mobile a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });

  /* ── BTN RIPPLE EFFECT ───────────────────────────────────── */
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', function (e) {
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement('span');
      const size = Math.max(rect.width, rect.height);
      ripple.style.cssText = `
        position: absolute;
        width: ${size}px; height: ${size}px;
        border-radius: 50%;
        background: rgba(255,255,255,0.15);
        left: ${e.clientX - rect.left - size / 2}px;
        top: ${e.clientY - rect.top - size / 2}px;
        transform: scale(0);
        animation: ripple 0.5s ease-out;
        pointer-events: none;
      `;
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  });

  // Inject ripple keyframes
  const style = document.createElement('style');
  style.textContent = '@keyframes ripple { to { transform: scale(2.5); opacity: 0; } }';
  document.head.appendChild(style);

  /* ── LOGO SVG — glow dinámico fluido (X azul + 10 naranja) ── */
  (function initLogoGlow() {
    const logoSVGs = Array.from(document.querySelectorAll('svg.logo-svg'));
    if (!logoSVGs.length) return;

    // Estado suavizado por rAF: t actual vs t objetivo por cada SVG
    const states = logoSVGs.map(function () { return { cur: 0, tgt: 0 }; });
    let mx = -9999, my = -9999;

    document.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
    }, { passive: true });

    function applyGlow(xEl, tenEl, t) {
      if (xEl) {
        const b = 2 + t * 16;
        const m = 6 + t * 38;
        const f = 14 + t * 70;
        let filter = `drop-shadow(0 0 ${b.toFixed(1)}px rgba(0,237,255,${(0.5 + t * 0.5).toFixed(2)})) drop-shadow(0 0 ${m.toFixed(1)}px rgba(0,237,255,${(0.15 + t * 0.7).toFixed(2)})) drop-shadow(0 0 ${f.toFixed(1)}px rgba(0,237,255,${(0.0 + t * 0.5).toFixed(2)}))`;
        if (t > 0.1) filter += ` drop-shadow(0 0 ${(t * 120).toFixed(0)}px rgba(0,237,255,${(t * 0.18).toFixed(2)}))`;
        xEl.style.filter = filter;
      }
      if (tenEl) {
        const b = 2 + t * 10;
        const m = 6 + t * 28;
        const f = 14 + t * 54;
        let filter = `drop-shadow(0 0 ${b.toFixed(1)}px rgba(255,107,53,${(0.5 + t * 0.5).toFixed(2)})) drop-shadow(0 0 ${m.toFixed(1)}px rgba(255,107,53,${(0.15 + t * 0.7).toFixed(2)})) drop-shadow(0 0 ${f.toFixed(1)}px rgba(255,107,53,${(0.0 + t * 0.5).toFixed(2)}))`;
        if (t > 0.1) filter += ` drop-shadow(0 0 ${(t * 90).toFixed(0)}px rgba(255,107,53,${(t * 0.18).toFixed(2)}))`;
        tenEl.style.filter = filter;
      }
    }

    function loop() {
      requestAnimationFrame(loop);
      logoSVGs.forEach(function (svg, i) {
        const xEl = svg.querySelector('.x-shape');
        const tenEl = svg.querySelector('.ten-shape');
        if (!xEl && !tenEl) return;

        const r = svg.getBoundingClientRect();
        const dist = Math.hypot(mx - (r.left + r.width / 2), my - (r.top + r.height / 2));
        states[i].tgt = Math.max(0, 1 - dist / 200);

        // Lerp suavizado: se acerca rápido (0.12) y se aleja lento (0.06)
        const speed = states[i].tgt > states[i].cur ? 0.12 : 0.06;
        states[i].cur += (states[i].tgt - states[i].cur) * speed;

        if (Math.abs(states[i].cur - states[i].tgt) > 0.001) {
          applyGlow(xEl, tenEl, states[i].cur);
        }
      });
    }

    loop();
  }());

  /* ── HERO MOUSE PARALLAX ────────────────────────────────── */
  (function initHeroParallax() {
    const hero = document.querySelector('.hero');
    if (!hero || window.matchMedia('(pointer: coarse)').matches) return;

    const orbs = hero.querySelectorAll('.hero-orb');
    const bg = hero.querySelector('.hero-bg');
    let mx = 0, my = 0;
    let cx = 0, cy = 0;

    document.addEventListener('mousemove', (e) => {
      mx = (e.clientX - window.innerWidth / 2) / 30;
      my = (e.clientY - window.innerHeight / 2) / 30;
    }, { passive: true });

    function animate() {
      cx += (mx - cx) * 0.08;
      cy += (my - cy) * 0.08;

      if (bg) bg.style.transform = `translate(${cx}px, ${cy}px) scale(1.05)`;

      orbs.forEach((orb, i) => {
        const f = (i + 1) * 1.5;
        orb.style.transform = `translate(${-cx * f}px, ${-cy * f}px)`;
      });
      requestAnimationFrame(animate);
    }
    animate();

    // Ensure transitions don't conflict with JS updates
    const style = document.createElement('style');
    style.textContent = '.hero-bg, .hero-orb { transition: transform 0.1s ease-out !important; }';
    document.head.appendChild(style);
  }());

  /* ── HERO PARTICLES ANIMATION ──────────────────────────── */
  (function initHeroParticles() {
    const canvas = document.getElementById('hero-particles');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationId;
    let mouse = { x: null, y: null, radius: 150 };

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = canvas.parentElement.offsetHeight;
    }

    class Particle {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.12; // Even slower (was 0.2)
        this.vy = (Math.random() - 0.5) * 0.12; // Even slower (was 0.2)
        this.radius = Math.random() * 3 + 2; // Larger: was 1.5 + 1
        this.baseRadius = this.radius;
        this.glow = 0;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;

        // Mouse interaction (Glow and subtle attraction)
        if (mouse.x != null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouse.radius) {
            this.glow = 1 - (dist / mouse.radius);
            const force = (mouse.radius - dist) / mouse.radius;
            this.vx += dx * force * 0.003; // Even more subtle attraction
            this.vy += dy * force * 0.003;
          } else {
            this.glow = 0;
          }
        } else {
          this.glow = 0;
        }

        // Limit speed
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > 0.5) { // Slower limit (was 0.8)
          this.vx = (this.vx / speed) * 0.5;
          this.vy = (this.vy / speed) * 0.5;
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + (this.glow * 2), 0, Math.PI * 2);

        // Blur/Glow effect
        ctx.shadowBlur = 15 + (this.glow * 20);
        ctx.shadowColor = 'rgba(0, 237, 255, 0.8)';

        const opacity = 0.3 + (this.glow * 0.5);
        ctx.fillStyle = `rgba(0, 237, 255, ${opacity})`;
        ctx.fill();

        // Reset shadow for performance on lines
        ctx.shadowBlur = 0;
      }
    }

    function init() {
      resize();
      particles = [];
      const count = Math.min(Math.floor(canvas.width / 15), 100);
      for (let i = 0; i < count; i++) {
        particles.push(new Particle());
      }
    }

    function drawLines() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(0, 237, 255, ${0.15 * (1 - dist / 150)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      drawLines();
      animationId = requestAnimationFrame(animate);
    }

    window.addEventListener('resize', init);
    window.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });

    window.addEventListener('mouseout', () => {
      mouse.x = null;
      mouse.y = null;
    });

    init();
    animate();
  }());

  /* ── FLOATING CTA LOGIC (Móvil) ────────────────────────── */
  (function initFloatingCTA() {
    const floatingBtn = document.getElementById('floatingCTA');
    const hero = document.querySelector('.hero, .c10-hero, .page-hero');
    const ctaFinal = document.querySelector('.cta-block, #postular');
    const planesSection = document.getElementById('planes');
    const urgenciaSection = document.getElementById('urgencia');

    if (!floatingBtn || !hero) return;

    const isPlanesPage = window.location.pathname.includes('planes-diseno.html') ||
      window.location.pathname.includes('planes-instagrowth.html') ||
      window.location.pathname.includes('web-premium.html') ||
      window.location.pathname.includes('automatizacion.html');
    let heroVisible = true;
    let ctaFinalVisible = false;
    let planesVisible = false;
    let urgenciaVisible = false;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.target === hero) {
          heroVisible = entry.isIntersecting;
        } else if (ctaFinal && entry.target === ctaFinal) {
          ctaFinalVisible = entry.isIntersecting;
        } else if (planesSection && entry.target === planesSection) {
          planesVisible = entry.isIntersecting;
        } else if (urgenciaSection && entry.target === urgenciaSection) {
          urgenciaVisible = entry.isIntersecting;
        }

        // LÓGICA DE VISIBILIDAD
        let showButton = false;

        if (isPlanesPage) {
          // Exclusivo para Páginas de Planes: Oculto en Hero, en Planes Y en Urgencia
          showButton = !heroVisible && !planesVisible && !urgenciaVisible && window.scrollY > 200;
        } else {
          // Comportamiento estándar: Oculto en Hero y después del CTA final
          showButton = !heroVisible && !ctaFinalVisible && window.scrollY > 300;
        }

        if (showButton) {
          floatingBtn.classList.add('visible');
        } else {
          floatingBtn.classList.remove('visible');
        }
      });
    }, { threshold: 0.1 });

    observer.observe(hero);
    if (ctaFinal) observer.observe(ctaFinal);
    if (planesSection && isPlanesPage) observer.observe(planesSection);
    if (urgenciaSection && isPlanesPage) observer.observe(urgenciaSection);

    // Backup para scroll y resize
    const checkVisibility = () => {
      const scrollPos = window.scrollY;
      let showButton = false;

      if (isPlanesPage) {
        const planesRect = planesSection ? planesSection.getBoundingClientRect() : null;
        const urgenciaRect = urgenciaSection ? urgenciaSection.getBoundingClientRect() : null;

        const inPlanes = planesRect ? (planesRect.top < window.innerHeight && planesRect.bottom > 0) : false;
        const inUrgencia = urgenciaRect ? (urgenciaRect.top < window.innerHeight && urgenciaRect.bottom > 0) : false;

        showButton = scrollPos > 200 && !heroVisible && !inPlanes && !inUrgencia;
      } else {
        showButton = scrollPos > 400 && !ctaFinalVisible && !heroVisible;
      }

      if (showButton) {
        floatingBtn.classList.add('visible');
      } else {
        floatingBtn.classList.remove('visible');
      }
    };

    window.addEventListener('scroll', checkVisibility, { passive: true });
  }());

  /* ── CARD GLOW ON SCROLL (Móvil) ────────────────────────── */
  (function initCardScrollGlow() {
    // Solo activar si es un dispositivo móvil (pantalla pequeña)
    if (!window.matchMedia('(max-width: 768px)').matches) return;

    const cards = document.querySelectorAll('.card, .service-card');
    if (!cards.length) return;

    const observerOptions = {
      threshold: 0.4, // Se activa cuando el 40% es visible
      rootMargin: '-20% 0px -20% 0px' // Centrado en el viewport
    };

    const glowObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('scrolled-glow');
        } else {
          entry.target.classList.remove('scrolled-glow');
        }
      });
    }, observerOptions);

    cards.forEach(card => glowObserver.observe(card));
  }());

  /* ── EMOJI PARALLAX (Social Glass) ─────────────────────── */
  (function initEmojiParallax() {
    const emojis = document.querySelectorAll('.reaction-emoji');
    if (!emojis.length) return;

    window.addEventListener('scroll', () => {
      const scrollPos = window.scrollY;
      emojis.forEach(emoji => {
        const speed = parseFloat(emoji.getAttribute('data-speed')) || 0.1;
        const yPos = scrollPos * speed;
        // Combinamos el paralaje con la animación de flotación base
        emoji.style.transform = `translateY(${-yPos}px)`;
      });
    }, { passive: true });
  }());


})();
