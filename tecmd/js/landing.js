/* ==========================================================================
   LANDING PAGE JAVASCRIPT - TEC MD
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  
  // --- 1. HEADER SCROLL-REACTIVE LOGIC ---
  const header = document.querySelector('header.site-header');
  let lastScrollY = window.scrollY;
  const shrinkThreshold = 80;
  const hideThreshold = 200;

  window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;

    // A. Add glassmorphism/shrink when scrolled past threshold
    if (currentScrollY > shrinkThreshold) {
      header.classList.add('nav-scrolled');
    } else {
      header.classList.remove('nav-scrolled');
    }

    // B. Hide on scroll down, show on scroll up when scrolled deep
    if (currentScrollY > hideThreshold) {
      if (currentScrollY > lastScrollY) {
        // Scrolling Down
        header.classList.add('nav-hidden');
      } else {
        // Scrolling Up
        header.classList.remove('nav-hidden');
      }
    } else {
      header.classList.remove('nav-hidden');
    }

    lastScrollY = currentScrollY;
  });

  // --- 1B. FLOATING ENROLL BUTTON LOGIC ---
  const floatingEnroll = document.getElementById('floating-enroll-btn');
  const introCta = document.querySelector('.section-intro .btn-primary');
  const formSubmitBtn = document.querySelector('#inscripcion .btn-form-submit');

  function updateFloatingEnrollVisibility() {
    if (!floatingEnroll || !introCta || !formSubmitBtn) return;

    if (window.innerWidth <= 1038) {
      const introCtaRect = introCta.getBoundingClientRect();
      const submitRect = formSubmitBtn.getBoundingClientRect();
      
      const showTrigger = introCtaRect.bottom < 0;
      const isSubmitInViewport = (submitRect.bottom >= 0 && submitRect.top <= window.innerHeight);

      if (showTrigger && !isSubmitInViewport) {
        floatingEnroll.classList.add('show');
      } else {
        floatingEnroll.classList.remove('show');
      }
    } else {
      floatingEnroll.classList.remove('show');
    }
  }

  window.addEventListener('scroll', updateFloatingEnrollVisibility);
  window.addEventListener('resize', updateFloatingEnrollVisibility);
  updateFloatingEnrollVisibility();

  // --- 2. MOBILE DRAWER NAVIGATION ---
  const menuToggle = document.querySelector('.menu-toggle');
  const mobileDrawer = document.querySelector('.mobile-nav-drawer');

  if (menuToggle && mobileDrawer) {
    menuToggle.addEventListener('click', () => {
      mobileDrawer.classList.toggle('open');
      
      // Animate hamburger icon
      const spans = menuToggle.querySelectorAll('span');
      if (mobileDrawer.classList.contains('open')) {
        spans[0].style.transform = 'rotate(45deg) translate(6px, 6px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
      } else {
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
      }
    });

    // Close drawer when clicking a link
    mobileDrawer.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileDrawer.classList.remove('open');
        menuToggle.querySelectorAll('span').forEach(span => span.style.transform = 'none');
        menuToggle.querySelector('span:nth-child(2)').style.opacity = '1';
      });
    });
  }


  // --- 3. AI VECTOR PARTICLES ANIMATION (HTML CANVAS) ---
  const canvas = document.getElementById('ai-particles-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let particlesArray = [];
    const numberOfParticles = 38;
    const maxConnectionDistance = 110;

    // Set canvas sizes
    function setCanvasSize() {
      canvas.width = canvas.parentElement.offsetWidth;
      canvas.height = canvas.parentElement.offsetHeight;
    }
    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    // Particle class
    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 1;
        this.speedX = (Math.random() - 0.5) * 0.45;
        this.speedY = (Math.random() - 0.5) * 0.45;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Boundary bounce
        if (this.x < 0 || this.x > canvas.width) this.speedX = -this.speedX;
        if (this.y < 0 || this.y > canvas.height) this.speedY = -this.speedY;
      }

      draw() {
        ctx.fillStyle = 'rgba(0, 191, 255, 0.45)'; // Soft electric blue
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Initialize particles
    function init() {
      particlesArray = [];
      for (let i = 0; i < numberOfParticles; i++) {
        particlesArray.push(new Particle());
      }
    }
    init();

    // Connect particles with lines
    function connect() {
      for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a; b < particlesArray.length; b++) {
          const dx = particlesArray[a].x - particlesArray[b].x;
          const dy = particlesArray[a].y - particlesArray[b].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < maxConnectionDistance) {
            // Calculate opacity based on distance
            const opacity = (1 - (distance / maxConnectionDistance)) * 0.16;
            ctx.strokeStyle = `rgba(0, 191, 255, ${opacity})`;
            ctx.lineWidth = 0.85;
            ctx.beginPath();
            ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
            ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
            ctx.stroke();
          }
        }
      }
    }

    // Animation Loop
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
        particlesArray[i].draw();
      }
      connect();
      requestAnimationFrame(animate);
    }
    animate();

    // Re-initialize on resize to avoid weird spacing
    window.addEventListener('resize', () => {
      init();
    });
  }


  // --- 4. TABS: SYLLABUS / PLAN DE ESTUDIOS ---
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  if (tabButtons.length > 0 && tabPanels.length > 0) {
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');

        // Remove active class from buttons and panels
        tabButtons.forEach(b => b.classList.remove('active'));
        tabPanels.forEach(p => p.classList.remove('active'));

        // Add active to current button and target panel
        btn.classList.add('active');
        const targetPanel = document.getElementById(targetTab);
        if (targetPanel) {
          targetPanel.classList.add('active');
        }
      });
    });
  }


  // --- 5. ACCORDION: FAQ ---
  const faqHeaders = document.querySelectorAll('.faq-header');

  if (faqHeaders.length > 0) {
    faqHeaders.forEach(header => {
      header.addEventListener('click', () => {
        const item = header.parentElement;
        const body = item.querySelector('.faq-body');
        const isActive = item.classList.contains('active');

        // Close all other accordion items
        document.querySelectorAll('.faq-item').forEach(i => {
          i.classList.remove('active');
          i.querySelector('.faq-body').style.maxHeight = '0';
        });

        // Toggle current accordion item
        if (!isActive) {
          item.classList.add('active');
          body.style.maxHeight = body.scrollHeight + 'px';
        }
      });
    });
  }


  // --- 6. LEAD FORM SUBMISSION (PHP AJAX INTEGRATION) ---
  const leadForm = document.getElementById('tecmd-admission-form');
  const successModal = document.getElementById('success-modal');
  const modalMessage = document.getElementById('success-modal-message');
  const closeModalBtn = document.getElementById('close-modal-btn');

  if (leadForm) {
    leadForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const submitBtn = leadForm.querySelector('.btn-form-submit');
      const originalText = submitBtn.innerHTML;
      
      // Show loading spinner/text
      submitBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="spinner" style="animation: spin 1s linear infinite; margin-right: 8px; vertical-align: middle;">
          <line x1="12" y1="2" x2="12" y2="6"></line>
          <line x1="12" y1="18" x2="12" y2="22"></line>
          <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
          <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
          <line x1="2" y1="12" x2="6" y2="12"></line>
          <line x1="18" y1="12" x2="22" y2="12"></line>
          <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
          <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
        </svg>
        Procesando...
      `;
      submitBtn.disabled = true;

      // Collect values
      const data = {
        nombres: document.getElementById('nombres').value,
        apellidos: document.getElementById('apellidos').value,
        celular: document.getElementById('celular').value,
        email: document.getElementById('email').value,
        tipo_documento: document.getElementById('tipo_documento').value || 'CC',
        identificacion: document.getElementById('identificacion').value
      };

      // Call PHP Send API
      fetch('send_email.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      .then(response => {
        return response.json().then(json => {
          if (!response.ok) {
            throw new Error(json.message || 'Error en el servidor');
          }
          return json;
        });
      })
      .then(res => {
        // Show success state
        submitBtn.innerHTML = '✔ Solicitud Enviada';
        submitBtn.style.backgroundColor = '#25d366';
        submitBtn.style.color = '#ffffff';
        submitBtn.style.boxShadow = '0 4px 15px rgba(37, 211, 102, 0.4)';
        
        // Reset form
        leadForm.reset();

        // Show Modal
        if (successModal) {
          if (res.message && modalMessage) {
            modalMessage.textContent = res.message;
          }
          successModal.classList.add('active');
        }
        
        // Revert button styling after delay
        setTimeout(() => {
          submitBtn.innerHTML = originalText;
          submitBtn.style.backgroundColor = '';
          submitBtn.style.color = '';
          submitBtn.style.boxShadow = '';
          submitBtn.disabled = false;
        }, 3000);
      })
      .catch(error => {
        // Show error message
        alert('Hubo un inconveniente al enviar tu formulario: ' + error.message);
        
        // Revert button
        submitBtn.innerHTML = originalText;
        submitBtn.style.backgroundColor = '';
        submitBtn.style.color = '';
        submitBtn.style.boxShadow = '';
        submitBtn.disabled = false;
      });
    });
  }

  // --- 7. SUCCESS MODAL CLOSE LOGIC ---
  if (closeModalBtn && successModal) {
    closeModalBtn.addEventListener('click', () => {
      successModal.classList.remove('active');
    });

    // Close when clicking outside card
    successModal.addEventListener('click', (e) => {
      if (e.target === successModal) {
        successModal.classList.remove('active');
      }
    });
  }


});

// Spinner CSS animation injection
const style = document.createElement('style');
style.innerHTML = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);
