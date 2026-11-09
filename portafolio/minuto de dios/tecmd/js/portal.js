/* ==========================================================================
   PORTAL DEL CANDIDATO JAVASCRIPT - TEC MD
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // --- 1. SCROLL-REACTIVE NAVBAR HIDING ---
  const navbar = document.getElementById('navbar');
  let lastScrollY = window.scrollY;
  const hideThreshold = 150;

  if (navbar) {
    window.addEventListener('scroll', () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > hideThreshold) {
        if (currentScrollY > lastScrollY) {
          // Scrolling Down -> Hide navbar
          navbar.classList.add('nav-hidden');
        } else {
          // Scrolling Up -> Show navbar
          navbar.classList.remove('nav-hidden');
        }
      } else {
        // Near top -> Show navbar
        navbar.classList.remove('nav-hidden');
      }

      lastScrollY = currentScrollY;
    }, { passive: true });
  }

  // --- 2. DEVICE MOCKUP SWITCHER (LANDING PAGE) ---
  const webMockupDisplay = document.getElementById('web-mockup-display');
  const webDeviceBtns = document.querySelectorAll('.web-device-btn');

  if (webMockupDisplay && webDeviceBtns.length > 0) {
    webDeviceBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const device = btn.getAttribute('data-device');

        // Reset classes
        webMockupDisplay.classList.remove('show-desktop', 'show-tablet', 'show-mobile');
        webDeviceBtns.forEach(b => b.classList.remove('active'));

        // Apply new device
        webMockupDisplay.classList.add(`show-${device}`);
        btn.classList.add('active');
      });
    });
  }

  // --- 3. DEVICE MOCKUP SWITCHER (WIREFRAME) ---
  const wireframeMockupDisplay = document.getElementById('wireframe-mockup-display');
  const wireframeDeviceBtns = document.querySelectorAll('.wireframe-device-btn');

  if (wireframeMockupDisplay && wireframeDeviceBtns.length > 0) {
    wireframeDeviceBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const device = btn.getAttribute('data-device');

        // Reset classes
        wireframeMockupDisplay.classList.remove('show-desktop', 'show-tablet', 'show-mobile');
        wireframeDeviceBtns.forEach(b => b.classList.remove('active'));

        // Apply new device
        wireframeMockupDisplay.classList.add(`show-${device}`);
        btn.classList.add('active');
      });
    });
  }

  // --- 4. PORTAL ACCORDIONS ---
  const accordions = document.querySelectorAll('.portal-accordion-header');
  if (accordions.length > 0) {
    accordions.forEach(header => {
      header.addEventListener('click', () => {
        const item = header.parentElement;
        const body = item.querySelector('.portal-accordion-body');
        const isActive = item.classList.contains('active');

        // Close all other items
        document.querySelectorAll('.portal-accordion-item').forEach(i => {
          i.classList.remove('active');
          const b = i.querySelector('.portal-accordion-body');
          if (b) b.style.maxHeight = '0';
        });

        // Toggle current item
        if (!isActive) {
          item.classList.add('active');
          body.style.maxHeight = body.scrollHeight + 'px';
        }
      });
    });
  }

  // --- 5. EMAIL SIMULATOR TEMPLATES ---
  // Embedded templates as strings to prevent file:// CORS blocks in local browser testing
  const emailStudentTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inscripción Exitosa - Diplomado en IA Aplicada a la Educación</title>
  <style>
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; }
      .content-padding { padding: 25px 20px !important; }
      .benefit-item { padding-bottom: 20px !important; }
      .cta-button {
        width: 100% !important;
        box-sizing: border-box !important;
        display: block !important;
        line-height: 45px !important;
        height: auto !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: Arial, sans-serif; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f6f9; padding: 20px 0;">
    <tr>
      <td align="center">
        <table border="0" cellpadding="0" cellspacing="0" width="600" class="email-container" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.06); border-collapse: collapse;">
          
          <!-- CABECERA -->
          <tr>
            <td align="center" style="padding: 0; line-height: 0; background-color: #212844;">
              <a href="https://tecmd.edu.co" target="_blank" style="text-decoration: none;">
                <img src="assets/email.png" alt="TEC MD - Diplomado en IA" width="600" style="display: block; border: 0; outline: none; text-decoration: none; width: 100%; max-width: 600px; height: auto;">
              </a>
            </td>
          </tr>
          
          <!-- CUERPO -->
          <tr>
            <td class="content-padding" style="padding: 40px; color: #333333; font-family: Arial, sans-serif; font-size: 15px; line-height: 1.6;">
              <h2 style="color: #212844; font-size: 20px; font-weight: bold; margin-top: 0; margin-bottom: 15px; font-family: Arial, sans-serif;">
                ¡Hola <span id="student-name-placeholder">Estudiante</span>!
              </h2>
              <p style="margin: 0 0 20px 0;">
                Tu preinscripción en nuestra plataforma se ha completado con éxito. Has dado el primer paso para dominar las herramientas que están transformando la educación y preparándote para liderar el aula del futuro.
              </p>
              
              <h3 style="color: #212844; font-size: 16px; font-weight: bold; margin: 30px 0 15px 0; font-family: Arial, sans-serif;">
                ¿Cómo potenciarás tus habilidades en este diplomado?
              </h3>
              
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 35px;">
                <tr>
                  <td class="benefit-item" style="padding-bottom: 15px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td width="24" valign="top" style="color: #ffcc00; font-size: 18px; font-weight: bold; line-height: 1; padding-top: 2px;">⚡</td>
                        <td style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.5; color: #555555; padding-left: 10px;">
                          <strong>Automatización Inteligente:</strong> Ahorra tiempo automatizando la calificación, el diseño de cuestionarios y la preparación de clases.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td class="benefit-item" style="padding-bottom: 15px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td width="24" valign="top" style="color: #ffcc00; font-size: 18px; font-weight: bold; line-height: 1; padding-top: 2px;">⚡</td>
                        <td style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.5; color: #555555; padding-left: 10px;">
                          <strong>Personalización Adaptativa:</strong> Aprende a diseñar contenido modular y actividades personalizadas adaptadas a cada alumno.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td>
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td width="24" valign="top" style="color: #ffcc00; font-size: 18px; font-weight: bold; line-height: 1; padding-top: 2px;">⚡</td>
                        <td style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.5; color: #555555; padding-left: 10px;">
                          <strong>Creación Multimedia:</strong> Genera imágenes explicativas, videos didácticos y avatares virtuales sin necesidad de ser un editor profesional.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 25px 0;">
                Un asesor académico de admisiones de <strong>TEC MD</strong> se comunicará contigo al número celular que registraste para formalizar tu proceso de matrícula, ayudarte con el plan de estudios e informarte sobre becas.
              </p>
              
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8f9fc; border-left: 4px solid #ffcc00; margin-bottom: 35px; border-collapse: collapse;">
                <tr>
                  <td style="padding: 15px 20px; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.5; color: #666666; font-style: italic;">
                    "La tecnología no reemplazará a los educadores, pero los educadores que usan tecnología reemplazarán a los que no la usan."
                  </td>
                </tr>
              </table>
              
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a class="cta-button" href="https://wa.me/573169642159?text=Hola!%20Esta%20es%20una%20prueba%20de%20registro%20al%20Diplomado%20en%20IA%20de%20TEC%20MD." target="_blank" style="background-color: #25D366; border-radius: 6px; color: #ffffff; display: inline-block; font-family: Arial, sans-serif; font-size: 15px; font-weight: bold; line-height: 50px; text-align: center; text-decoration: none; width: 260px; -webkit-text-size-adjust: none; box-shadow: 0 4px 10px rgba(37,211,102,0.3);">Chatear por WhatsApp</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- PIE DE PÁGINA -->
          <tr>
            <td align="center" style="background-color: #f4f6f9; padding: 25px; font-family: Arial, sans-serif; font-size: 12px; line-height: 1.6; color: #888888; border-top: 1px solid #eef1f5;">
              <p style="margin: 0 0 8px 0; font-weight: bold; color: #555555;">Politécnico Minuto de Dios - TEC MD</p>
              <p style="margin: 0 0 15px 0;">Este es un mensaje de notificación de registro automatizado.</p>
              <p style="margin: 0;">
                <a href="#" style="color: #212844; text-decoration: underline;">Tratamiento de Datos</a> | 
                <a href="#" style="color: #212844; text-decoration: underline;">Dar de baja</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const emailAdminTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Nuevo Registro - Diplomado en IA Aplicada a la Educación</title>
</head>
<body style="font-family: Arial, sans-serif; color: #333333; background-color: #f4f6f9; margin: 0; padding: 20px;">
  <div style="max-width: 600px; background-color: #ffffff; border-radius: 8px; padding: 30px; margin: 0 auto; border: 1px solid #dddddd; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 25px;">
      <tr>
        <td style="background-color: #212844; padding: 20px; border-radius: 6px; text-align: center;">
          <h2 style="color: #ffcc00; margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 0.5px;">¡Nuevo Lead Registrado!</h2>
        </td>
      </tr>
    </table>
    
    <p style="font-size: 15px; line-height: 1.5; margin-bottom: 20px;">
      Se ha recibido una nueva solicitud de admisión desde el formulario de la Landing Page del <strong>Diplomado en Inteligencia Artificial Aplicada a la Educación</strong>:
    </p>
    
    <table border="0" cellpadding="12" cellspacing="0" width="100%" style="border-collapse: collapse; font-size: 14px; margin-bottom: 25px; border: 1px solid #eef1f5;">
      <tr style="background-color: #f9fbfd; border-bottom: 1px solid #eef1f5;">
        <td width="35%" style="font-weight: bold; color: #555555;">Nombre Completo:</td>
        <td style="color: #333333; font-weight: bold;"><span id="admin-lead-name">Carlos</span> Gómez</td>
      </tr>
      <tr style="border-bottom: 1px solid #eef1f5;">
        <td style="font-weight: bold; color: #555555;">Correo Electrónico:</td>
        <td style="color: #333333;"><a href="#" style="color: #212844; text-decoration: none; font-weight: bold;">carlos.gomez@email.com</a></td>
      </tr>
      <tr style="background-color: #f9fbfd; border-bottom: 1px solid #eef1f5;">
        <td style="font-weight: bold; color: #555555;">Teléfono Celular:</td>
        <td style="color: #333333; font-weight: bold;">+57 301 234 5678</td>
      </tr>
      <tr style="border-bottom: 1px solid #eef1f5;">
        <td style="font-weight: bold; color: #555555;">Tipo de Documento:</td>
        <td style="color: #333333;">CC</td>
      </tr>
      <tr style="background-color: #f9fbfd;">
        <td style="font-weight: bold; color: #555555;">Número de Documento:</td>
        <td style="color: #333333; font-weight: bold;">1.023.456.789</td>
      </tr>
    </table>
    
    <div style="padding: 15px; background-color: #f4f6f9; border-radius: 6px; font-size: 12px; color: #666666; text-align: center;">
      Este correo ha sido generado de forma automatizada por el servidor local de la landing page de admisiones.
      <br><strong>Fecha de registro:</strong> 10/06/2026 11:22:45
    </div>
    
  </div>
</body>
</html>
  `;

  // --- 6. SIMULATOR INTERACTIVITY ---
  const iframeStudent = document.getElementById('iframe-student');
  const iframeAdmin = document.getElementById('iframe-admin');
  const inputName = document.getElementById('sim-name-input');
  const emailTabs = document.querySelectorAll('.email-sim-tab');

  function renderTemplates(name) {
    const cleanName = name.trim() || 'Estudiante';
    
    // Student email render
    if (iframeStudent) {
      const doc = iframeStudent.contentDocument || iframeStudent.contentWindow.document;
      doc.open();
      // Replace name inside template
      let html = emailStudentTemplate.replace('id="student-name-placeholder">Estudiante', `id="student-name-placeholder">${cleanName}`);
      doc.write(html);
      doc.close();
    }

    // Admin email render
    if (iframeAdmin) {
      const doc = iframeAdmin.contentDocument || iframeAdmin.contentWindow.document;
      doc.open();
      // Replace name inside template
      let html = emailAdminTemplate.replace('id="admin-lead-name">Carlos', `id="admin-lead-name">${cleanName}`);
      doc.write(html);
      doc.close();
    }
  }

  // Initial render
  if (iframeStudent || iframeAdmin) {
    // Wait for frames to load
    setTimeout(() => {
      renderTemplates('Estudiante');
    }, 300);
  }

  // Event listener on input name
  if (inputName) {
    inputName.addEventListener('input', (e) => {
      renderTemplates(e.target.value);
    });
  }

  // Switch between student and admin email previews
  if (emailTabs.length > 0) {
    emailTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetView = tab.getAttribute('data-view');
        
        emailTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const studentWrapper = document.getElementById('student-preview-wrapper');
        const adminWrapper = document.getElementById('admin-preview-wrapper');

        if (targetView === 'student') {
          if (studentWrapper) studentWrapper.style.display = 'block';
          if (adminWrapper) adminWrapper.style.display = 'none';
        } else {
          if (studentWrapper) studentWrapper.style.display = 'none';
          if (adminWrapper) adminWrapper.style.display = 'block';
        }
      });
    });
  }

  // --- 4. LIGHTBOX GALLERY MODAL ---
  const galleryCards = document.querySelectorAll('#panel-diseno .gallery-card');
  const lightboxModal = document.getElementById('lightboxModal');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxTitle = document.getElementById('lightboxTitle');
  const lightboxDesc = document.getElementById('lightboxDesc');
  const closeBtn = document.getElementById('lightboxCloseBtn');
  const prevBtn = document.getElementById('lightboxPrevBtn');
  const nextBtn = document.getElementById('lightboxNextBtn');

  let currentGalleryIdx = 0;
  const galleryItems = [];

  // Populate galleryItems dynamically from DOM
  if (galleryCards.length > 0 && lightboxModal) {
    galleryCards.forEach((card, index) => {
      const imgEl = card.querySelector('.gallery-preview img');
      const titleEl = card.querySelector('.gallery-title');
      const descEl = card.querySelector('.gallery-desc');
      const toolsStr = card.getAttribute('data-tools') || '';
      const tools = toolsStr.split(',').map(t => t.trim()).filter(t => t);

      if (imgEl) {
        galleryItems.push({
          img: imgEl.getAttribute('src'),
          alt: imgEl.getAttribute('alt') || '',
          title: titleEl ? titleEl.textContent.trim() : '',
          desc: descEl ? descEl.textContent.trim() : '',
          tools: tools
        });

        // Add click event to open lightbox on the entire card click
        card.addEventListener('click', () => {
          openLightbox(index);
        });
      }
    });

    const openLightbox = (index) => {
      currentGalleryIdx = index;
      updateLightboxContent();
      lightboxModal.classList.add('open');
      lightboxModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden'; // Lock body scroll
    };

    const closeLightbox = () => {
      lightboxModal.classList.remove('open');
      lightboxModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = ''; // Restore body scroll
    };

    const updateLightboxContent = () => {
      const item = galleryItems[currentGalleryIdx];
      if (item && lightboxImg && lightboxTitle && lightboxDesc) {
        const compSlider = document.getElementById('lightboxComparisonSlider');
        const sliderImageOver = document.getElementById('sliderImageOver');
        const sliderHandle = document.getElementById('sliderHandle');

        if (currentGalleryIdx === 1 && compSlider && sliderImageOver && sliderHandle) {
          // Hide single image, show comparison slider
          lightboxImg.style.display = 'none';
          compSlider.style.display = 'flex';
          
          // Reset slider handle and clip to 50%
          sliderImageOver.style.clipPath = 'polygon(0 0, 50% 0, 50% 100%, 0 100%)';
          sliderHandle.style.left = '50%';
        } else {
          // Show single image, hide comparison slider
          lightboxImg.style.display = 'block';
          if (compSlider) compSlider.style.display = 'none';
          
          lightboxImg.setAttribute('src', item.img);
          lightboxImg.setAttribute('alt', item.alt);
        }

        lightboxTitle.textContent = item.title;
        lightboxDesc.textContent = item.desc;

        // Render tools tags dynamically
        const toolsContainer = document.getElementById('lightboxTools');
        if (toolsContainer) {
          toolsContainer.innerHTML = '';
          item.tools.forEach(tool => {
            const tag = document.createElement('span');
            tag.className = 'lightbox-tool-tag';
            tag.textContent = tool;
            toolsContainer.appendChild(tag);
          });
        }
      }
    };

    // --- COMPARISON SLIDER DRAG LOGIC ---
    const sliderWrapper = document.getElementById('sliderWrapper');
    const sliderImageOver = document.getElementById('sliderImageOver');
    const sliderHandle = document.getElementById('sliderHandle');

    if (sliderWrapper && sliderImageOver && sliderHandle) {
      let isDragging = false;

      const startDrag = (e) => {
        isDragging = true;
      };

      const stopDrag = () => {
        isDragging = false;
      };

      const drag = (e) => {
        if (!isDragging) return;

        if (e.type === 'touchmove' && e.cancelable) {
          e.preventDefault();
        }

        const rect = sliderWrapper.getBoundingClientRect();
        let clientX;
        
        if (e.type === 'touchmove') {
          clientX = e.touches[0].clientX;
        } else {
          clientX = e.clientX;
        }

        let x = clientX - rect.left;
        let percent = (x / rect.width) * 100;

        if (percent < 0) percent = 0;
        if (percent > 100) percent = 100;

        sliderImageOver.style.clipPath = `polygon(0 0, ${percent}% 0, ${percent}% 100%, 0 100%)`;
        sliderHandle.style.left = `${percent}%`;
      };

      // Mouse Events
      sliderHandle.addEventListener('mousedown', startDrag);
      window.addEventListener('mouseup', stopDrag);
      window.addEventListener('mousemove', drag);

      // Touch Events
      sliderHandle.addEventListener('touchstart', startDrag, { passive: true });
      window.addEventListener('touchend', stopDrag);
      window.addEventListener('touchmove', drag, { passive: false });
    }

    // Close triggers
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeLightbox();
      });
    }
    lightboxModal.addEventListener('click', (e) => {
      if (e.target === lightboxModal) {
        closeLightbox();
      }
    });

    // Nav triggers
    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentGalleryIdx = (currentGalleryIdx - 1 + galleryItems.length) % galleryItems.length;
        updateLightboxContent();
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentGalleryIdx = (currentGalleryIdx + 1) % galleryItems.length;
        updateLightboxContent();
      });
    }

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (lightboxModal.classList.contains('open')) {
        if (e.key === 'Escape') {
          closeLightbox();
        } else if (e.key === 'ArrowLeft') {
          prevBtn && prevBtn.click();
        } else if (e.key === 'ArrowRight') {
          nextBtn && nextBtn.click();
        }
      }
    });
  }

  // --- 7. FLOATING LANDING CTA ---
  const panelDiseno = document.getElementById('panel-diseno');
  const panelLanding = document.getElementById('panel-landing');
  const floatingLandingCTA = document.getElementById('floatingLandingCTA');

  if (panelDiseno && panelLanding && floatingLandingCTA) {
    const updateCtaVisibility = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      
      // Calculate middle of panel-diseno (graphic pieces section)
      const disenoMiddle = panelDiseno.offsetTop + (panelDiseno.offsetHeight / 2);
      
      // Calculate start of panel-landing
      const landingTop = panelLanding.offsetTop;

      // Show when scroll position is past the middle of panel-diseno, but hide once panel-landing is in view
      if (scrollY + (windowHeight / 2) >= disenoMiddle && scrollY + windowHeight < landingTop + 100) {
        floatingLandingCTA.classList.add('visible');
      } else {
        floatingLandingCTA.classList.remove('visible');
      }
    };

    window.addEventListener('scroll', updateCtaVisibility, { passive: true });
    window.addEventListener('resize', updateCtaVisibility, { passive: true });
    
    // Initial check on load
    updateCtaVisibility();
  }

});
