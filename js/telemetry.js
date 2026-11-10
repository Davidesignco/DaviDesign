/**
 * ==============================================================================
 * SISTEMA UNIVERSAL DE TELEMETRÍA Y EVENT-STREAM - DAVID DESIGN CO
 * Archivo: js/telemetry.js
 * 
 * Funcionalidades:
 * 1. Rastreo granular por secciones con tiempo exacto de permanencia (segundos).
 * 2. Identificación persistente (ID_Usuario en localStorage, ID_Sesion en sessionStorage).
 * 3. Captura automática de geolocalización (País, Departamento, Ciudad) vía GeoJS.
 * 4. Detección de dispositivo, navegador, sistema operativo y tipo de red (WiFi/4G).
 * 5. Atribución de tráfico (Instagram, Facebook Ads, Google, UTMs, fbclid).
 * 6. Captura de datos de contacto (Nombre y Teléfono al interactuar o autocompletar).
 * 7. Seguimiento de profundidad de scroll (25%, 50%, 75%, 90%).
 * 8. Seguimiento de interacciones ricas: historias, pestañas, modales, cotizadores, CTAs.
 * 9. Envío en segundo plano (Fetch keepalive / Beacon) sin afectar la velocidad.
 * ==============================================================================
 */

(function () {
  'use strict';

  // Configuración del Endpoint de Google Apps Script Web App
  const CONFIG = {
    endpoint: window.DMG_TELEMETRY_URL || 'https://script.google.com/macros/s/AKfycby6PUUADw9y3dFVlGWzh88GoHiVfOTYVb3wuNUvPJHz91JXkuHYJ8_BseDdqKQap8rj/exec',
    flushIntervalMs: 2500,
    minTimeSecondsToLog: 1.5, // Registra vistas a partir de 1.5s de permanencia
    geoApiUrl: 'https://get.geojs.io/v1/ip/geo.json'
  };

  // --- 1. IDENTIFICADORES Y SESIÓN ---
  function getOrSetStorage(storage, key, generator) {
    try {
      let val = storage.getItem(key);
      if (!val) {
        val = generator();
        storage.setItem(key, val);
      }
      return val;
    } catch (e) {
      return generator();
    }
  }

  function generateId(prefix) {
    const timePart = Date.now().toString(36);
    const randPart = Math.random().toString(36).substring(2, 7);
    return `${prefix}-${timePart}-${randPart}`.toUpperCase();
  }

  // ID persistente de usuario (permanece meses/años)
  const userId = getOrSetStorage(localStorage, 'dmg_uid', () => generateId('USR'));

  // ID de sesión (se renueva cada vez que cierra y vuelve a abrir el navegador)
  let isNewSession = false;
  let sessionId;
  try {
    sessionId = sessionStorage.getItem('dmg_sid');
    if (!sessionId) {
      sessionId = generateId('SES');
      sessionStorage.setItem('dmg_sid', sessionId);
      isNewSession = true;
    }
  } catch (e) {
    sessionId = generateId('SES');
  }

  // --- FILTRO Y EXCLUSIÓN DE ADMINISTRADOR / DISPOSITIVOS DE DAVID ---
  const EXCLUDED_IDS = [
    'SES-MWB1GEQ4-ZHT41', // Ordenador David
    'SES-MWB4KEQF-W4QYW'  // Móvil David
  ];

  let isExcluded = false;
  try {
    const urlParams = new URLSearchParams(window.location.search);
    // Si la URL lleva ?admin=1, ?exclude=1 o coincide con los IDs, se marca permanentemente este dispositivo
    if (urlParams.has('admin') || urlParams.has('exclude') || urlParams.get('test') === 'admin') {
      localStorage.setItem('dmg_exclude_admin', 'true');
    }
    if (EXCLUDED_IDS.includes(sessionId) || localStorage.getItem('dmg_exclude_admin') === 'true') {
      isExcluded = true;
      localStorage.setItem('dmg_exclude_admin', 'true');
    }
  } catch (e) {}

  // Contador de visitas del usuario
  let visitCount = 1;
  try {
    const rawVisits = parseInt(localStorage.getItem('dmg_visits') || '0', 10);
    if (isNewSession) {
      visitCount = rawVisits + 1;
      localStorage.setItem('dmg_visits', visitCount.toString());
    } else {
      visitCount = rawVisits || 1;
    }
  } catch (e) {
    visitCount = 1;
  }

  // Datos conocidos del cliente (Nombre y Teléfono)
  let customerName = '';
  let customerPhone = '';
  try {
    customerName = localStorage.getItem('dmg_name') || '';
    customerPhone = localStorage.getItem('dmg_phone') || '';
  } catch (e) {}

  // --- 2. DETECCIÓN DE CONTEXTO TÉCNICO Y ATRIBUCIÓN DE CAMPAÑAS ---
  function detectDevice() {
    const ua = navigator.userAgent || '';
    let os = 'Otro';
    if (/iPad|iPhone|iPod/.test(ua)) os = 'iOS';
    else if (/Android/.test(ua)) os = 'Android';
    else if (/Windows NT/.test(ua)) os = 'Windows';
    else if (/Macintosh/.test(ua)) os = 'Mac';
    else if (/Linux/.test(ua)) os = 'Linux';

    let devType = 'Desktop';
    if (/Mobi|Android|iPhone/i.test(ua)) devType = 'Móvil';
    else if (/iPad|Tablet/i.test(ua)) devType = 'Tablet';

    return `${devType} (${os})`;
  }

  function detectNetwork() {
    try {
      const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (conn && conn.effectiveType) {
        return conn.effectiveType.toUpperCase(); // e.g., '4G', '3G'
      }
      return navigator.onLine ? 'Online' : 'Offline';
    } catch (e) {
      return 'N/A';
    }
  }

  function detectTrafficSource() {
    const ref = document.referrer ? document.referrer.toLowerCase() : '';
    if (!ref) return 'Directo / Orgánico';
    if (ref.includes('instagram.com')) return 'Instagram';
    if (ref.includes('facebook.com') || ref.includes('fb.com')) return 'Facebook';
    if (ref.includes('google.')) return 'Google Búsqueda';
    if (ref.includes('whatsapp') || ref.includes('wa.me')) return 'WhatsApp Chat';
    if (ref.includes('tiktok.com')) return 'TikTok';
    try {
      return new URL(document.referrer).hostname;
    } catch (e) {
      return ref.substring(0, 30);
    }
  }

  // Atribución persistente y separada de campañas (Meta, TikTok, Google)
  let campaignData = {
    campName: 'Orgánico',
    campId: 'N/A',
    adName: 'N/A'
  };

  try {
    const params = new URLSearchParams(window.location.search);
    const hasAnyAdParam = params.has('utm_campaign') || params.has('campaign_id') || params.has('utm_content') || params.has('fbclid') || params.has('gclid');

    if (hasAnyAdParam) {
      campaignData.campName = params.get('utm_campaign') || params.get('campaign_name') || (params.get('fbclid') ? 'Meta Ads (fbclid)' : 'Campaña Sin Nombre');
      campaignData.campId = params.get('campaign_id') || params.get('cid') || (params.get('fbclid') ? params.get('fbclid').substring(0, 16) : 'N/A');
      campaignData.adName = params.get('utm_content') || params.get('ad_name') || params.get('ad_id') || 'N/A';

      sessionStorage.setItem('dmg_camp_name', campaignData.campName);
      sessionStorage.setItem('dmg_camp_id', campaignData.campId);
      sessionStorage.setItem('dmg_ad_name', campaignData.adName);
    } else {
      campaignData.campName = sessionStorage.getItem('dmg_camp_name') || 'Orgánico';
      campaignData.campId = sessionStorage.getItem('dmg_camp_id') || 'N/A';
      campaignData.adName = sessionStorage.getItem('dmg_ad_name') || 'N/A';
    }
  } catch (e) {}

  // --- 3. GEOLOCALIZACIÓN SILENCIOSA ---
  let geoData = {
    country: 'Colombia',
    region: '',
    city: ''
  };

  try {
    const cachedGeo = sessionStorage.getItem('dmg_geo');
    if (cachedGeo) {
      geoData = JSON.parse(cachedGeo);
    } else {
      fetch(CONFIG.geoApiUrl)
        .then(res => res.json())
        .then(data => {
          if (data) {
            geoData = {
              country: data.country || 'Colombia',
              region: data.region || '',
              city: data.city || ''
            };
            sessionStorage.setItem('dmg_geo', JSON.stringify(geoData));
          }
        })
        .catch(() => {});
    }
  } catch (e) {}

  // --- 4. COLA DE EVENTOS Y ENVÍO ---
  const eventQueue = [];

  function formatDateTime(date) {
    const d = date || new Date();
    const pad = n => (n < 10 ? '0' + n : n);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  function getPageName() {
    const bodyPage = document.body && document.body.getAttribute('data-telemetry-page');
    if (bodyPage) return bodyPage;

    const title = document.title || '';
    if (title.includes('Navidad') || window.location.pathname.includes('bolas_navidad')) return 'Bolas de Navidad';
    if (title.includes('Eventos') || window.location.pathname.includes('eventos')) return 'Cobertura Eventos';
    if (title.includes('Etiquetas') || window.location.pathname.includes('etiquetas')) return 'Etiquetas Escolares';
    if (title.includes('Producción') || window.location.pathname.includes('produccion')) return 'Producción Gráfica';
    if (title.includes('Diseño') || window.location.pathname.includes('planes-diseno')) return 'Planes de Diseño';
    if (title.includes('Instagrowth') || window.location.pathname.includes('instagrowth')) return 'Instagrowth';
    if (title.includes('Automatización') || window.location.pathname.includes('automatizacion')) return 'Automatización';
    if (title.includes('Web') || window.location.pathname.includes('web-premium')) return 'Web Premium';
    if (window.location.pathname.includes('portafolio')) return 'Portafolio Principal';
    if (window.location.pathname === '/' || window.location.pathname.includes('index')) return 'Home Principal';
    return title.split('—')[0].split('|')[0].trim() || window.location.pathname;
  }

  function logEvent(opts) {
    if (isExcluded) return;
    opts = opts || {};
    const ev = {
      Fecha_Hora: formatDateTime(),
      ID_Usuario: userId,
      ID_Sesion: sessionId,
      Nro_Visita: visitCount,
      Pagina: opts.pagina || getPageName(),
      Seccion: opts.seccion || activeSectionName || 'General',
      Tiempo_Segundos: typeof opts.tiempo === 'number' ? Math.round(opts.tiempo) : 0,
      Tipo_Evento: opts.tipo || 'ACCION',
      Detalle_Evento: opts.detalle || '',
      Cliente_Nombre: opts.nombre || customerName,
      Cliente_Telefono: opts.telefono || customerPhone,
      Pais: geoData.country || 'Colombia',
      Region_Depto: geoData.region || '',
      Ciudad: geoData.city || '',
      Dispositivo: detectDevice(),
      Tipo_Red: detectNetwork(),
      Origen_Trafico: detectTrafficSource(),
      Campana_Nombre: campaignData.campName || 'Orgánico',
      Campana_ID: campaignData.campId || 'N/A',
      Anuncio_Nombre: campaignData.adName || 'N/A'
    };

    eventQueue.push(ev);

    // Eventos prioritarios se despachan de inmediato
    const immediateEvents = ['COMPRA', 'CLIC_WHATSAPP', 'FORM_DATOS', 'FORM_DIAGNOSTICO', 'FORM_COTIZACION', 'FORM_LEAD', 'LLEGADA_WEB'];
    if (immediateEvents.includes(ev.Tipo_Evento)) {
      flush();
    }
  }

  function flush() {
    if (isExcluded) return;
    const url = CONFIG.endpoint;
    if (!url || eventQueue.length === 0) return;

    const itemsToSend = eventQueue.splice(0, eventQueue.length);
    const payload = JSON.stringify({ events: itemsToSend });

    // En navegadores modernos y móviles, fetch con no-cors y keepalive sigue redirects 302 sin problema
    try {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: payload,
        mode: 'no-cors',
        keepalive: true
      }).catch(err => {
        console.warn('[Telemetry] Error en fetch:', err);
      });
    } catch (e) {
      if (navigator.sendBeacon) {
        try {
          const blob = new Blob([payload], { type: 'text/plain;charset=UTF-8' });
          navigator.sendBeacon(url, blob);
        } catch (be) {}
      }
    }
  }

  // Intervalo periódico de sincronización
  setInterval(flush, CONFIG.flushIntervalMs);

  // Al ocultar pestaña o salir
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      endCurrentSection();
      flush();
    } else {
      resumeCurrentSection();
    }
  });

  window.addEventListener('pagehide', () => {
    endCurrentSection();
    flush();
  });

  window.addEventListener('beforeunload', () => {
    endCurrentSection();
    flush();
  });

  // --- 5. RASTREO PRECISO DE SECCIONES (PIXELS VISIBLES EN PANTALLA) ---
  let activeSectionEl = null;
  let activeSectionName = '';
  let activeSectionStartTime = Date.now();
  let lastMilestoneLoggedSeconds = 0;

  function getSectionFriendlyName(el) {
    if (!el) return 'General';
    if (el.getAttribute('data-telemetry-name')) {
      return el.getAttribute('data-telemetry-name');
    }

    const id = (el.id || '').toLowerCase();
    const className = (el.className || '').toLowerCase();

    if (className.includes('hero') || id === 'inicio' || id === 'pagehero') return 'Hero Principal';
    if (className.includes('profile-header')) return 'Perfil y Biografía';
    if (className.includes('highlights') || className.includes('stories')) return 'Historias Destacadas';
    if (className.includes('tab-bar')) return 'Barra de Pestañas';
    if (id === 'pane-posts' || id === 'grid-tab') return 'Feed de Proyectos';
    if (id === 'pane-cv' || id === 'cv-tab') return 'Currículum y Trayectoria';
    if (id === 'reels-tab' || className.includes('reels-container')) return 'Reels y Formato Vertical';
    if (id === 'web-tab') return 'Diseño y Desarrollo Web';
    if (id === 'modelos' || id === 'catalogopacks') return 'Catálogo de Modelos y Packs';
    if (id === 'simulador') return 'Simulador Interactivo';
    if (id === 'casos-uso') return 'Casos de Uso e Integraciones';
    if (id === 'proceso' || id === 'metodologia') return 'Metodología de Trabajo';
    if (id === 'planes' || id === 'tarifas') return 'Planes y Tarifas';
    if (id === 'cotizador' || id === 'calculadora' || id === 'solicitud' || id === 'diagnostico' || id === 'checkout-section') return 'Cotizador / Formulario';
    if (id === 'reviews' || id === 'testimonios' || id === 'opiniones') return 'Opiniones y Reseñas';
    if (id === 'faq') return 'Preguntas Frecuentes';
    if (id === 'contacto' || id === 'confianza') return 'Contacto y Confianza';
    if (el.tagName === 'FOOTER') return 'Pie de Página';

    // Buscar encabezado visible
    const heading = el.querySelector('h1, h2, h3, .section-title, .section-label');
    if (heading && heading.textContent) {
      const txt = heading.textContent.replace(/\s+/g, ' ').trim();
      if (txt.length > 0 && txt.length < 40) return txt;
    }

    return id ? `Sección #${id}` : 'Sección Contenido';
  }

  function endCurrentSection() {
    if (!activeSectionEl || !activeSectionStartTime) return;
    const elapsedSeconds = (Date.now() - activeSectionStartTime) / 1000;
    if (elapsedSeconds >= CONFIG.minTimeSecondsToLog) {
      logEvent({
        tipo: 'VISTA_SECCION',
        seccion: activeSectionName,
        tiempo: elapsedSeconds,
        detalle: `Permanencia de ${Math.round(elapsedSeconds)}s en ${activeSectionName}`
      });
    }
    activeSectionEl = null;
    activeSectionStartTime = 0;
    lastMilestoneLoggedSeconds = 0;
  }

  function resumeCurrentSection() {
    if (activeSectionEl) {
      activeSectionStartTime = Date.now();
      lastMilestoneLoggedSeconds = 0;
    }
  }

  function updateActiveSection() {
    const selector = 'section, header, footer, [data-telemetry-section], [data-telemetry-name], .profile-header, .highlights-container, .tab-bar, .tab-content.active';
    const sections = document.querySelectorAll(selector);
    if (!sections || sections.length === 0) return;

    const vHeight = window.innerHeight || document.documentElement.clientHeight;
    let bestEl = null;
    let maxVisiblePx = 0;

    sections.forEach(s => {
      // Ignorar elementos ocultos o no visibles
      if (s.offsetParent === null && s.style.display === 'none') return;

      const rect = s.getBoundingClientRect();
      const visibleTop = Math.max(0, rect.top);
      const visibleBottom = Math.min(vHeight, rect.bottom);
      const visiblePx = Math.max(0, visibleBottom - visibleTop);

      if (visiblePx > maxVisiblePx) {
        maxVisiblePx = visiblePx;
        bestEl = s;
      }
    });

    if (bestEl && maxVisiblePx >= 60) {
      if (bestEl !== activeSectionEl) {
        endCurrentSection();
        activeSectionEl = bestEl;
        activeSectionName = getSectionFriendlyName(activeSectionEl);
        activeSectionStartTime = Date.now();
        lastMilestoneLoggedSeconds = 0;
      } else {
        // Hito de lectura continua (cada 20 segundos de lectura continua en la misma sección)
        const elapsed = (Date.now() - activeSectionStartTime) / 1000;
        if (elapsed - lastMilestoneLoggedSeconds >= 20) {
          lastMilestoneLoggedSeconds = elapsed;
          logEvent({
            tipo: 'VISTA_SECCION',
            seccion: activeSectionName,
            tiempo: elapsed,
            detalle: `Lectura activa de ${Math.round(elapsed)}s en ${activeSectionName}`
          });
        }
      }
    }
  }

  function initSectionObserver() {
    updateActiveSection();

    let scrollTimeout = null;
    window.addEventListener('scroll', () => {
      if (!scrollTimeout) {
        scrollTimeout = setTimeout(() => {
          scrollTimeout = null;
          updateActiveSection();
        }, 150);
      }
    }, { passive: true });

    setInterval(updateActiveSection, 2000);
  }

  // --- 6. RASTREO DE PROFUNDIDAD DE SCROLL (25%, 50%, 75%, 90%) ---
  function initScrollDepthTracking() {
    const milestones = [
      { depth: 25, reached: false },
      { depth: 50, reached: false },
      { depth: 75, reached: false },
      { depth: 90, reached: false }
    ];

    window.addEventListener('scroll', () => {
      const docHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.offsetHeight
      );
      const winHeight = window.innerHeight || document.documentElement.clientHeight;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const totalScrollable = docHeight - winHeight;

      if (totalScrollable <= 0) return;

      const currentPercent = Math.round((scrollTop / totalScrollable) * 100);

      milestones.forEach(m => {
        if (!m.reached && currentPercent >= m.depth) {
          m.reached = true;
          logEvent({
            tipo: 'DESPLAZAMIENTO',
            seccion: activeSectionName || 'Navegación',
            detalle: `Profundidad de scroll: ${m.depth}% de la página`
          });
        }
      });
    }, { passive: true });
  }

  // --- 7. AUTO-CAPTURA DE DATOS DEL CLIENTE EN FORMULARIOS ---
  function initAutoCaptureForms() {
    document.addEventListener(
      'blur',
      e => {
        const target = e.target;
        if (!target || !target.tagName) return;

        const nameAttr = (target.name || '').toLowerCase();
        const idAttr = (target.id || '').toLowerCase();
        const autoAttr = (target.autocomplete || '').toLowerCase();
        const val = (target.value || '').trim();

        if (!val) return;

        let identified = false;

        // Detección de Nombre
        if (autoAttr === 'name' || nameAttr.includes('name') || idAttr.includes('name') || nameAttr.includes('nombre') || idAttr.includes('nombre')) {
          if (val.length >= 3 && val !== customerName) {
            customerName = val;
            try { localStorage.setItem('dmg_name', customerName); } catch (e) {}
            identified = true;
          }
        }

        // Detección de Teléfono
        if (autoAttr === 'tel' || nameAttr.includes('tel') || idAttr.includes('tel') || nameAttr.includes('phone') || idAttr.includes('phone') || nameAttr.includes('whatsapp') || idAttr.includes('whatsapp')) {
          if (val.length >= 7 && val !== customerPhone) {
            customerPhone = val;
            try { localStorage.setItem('dmg_phone', customerPhone); } catch (e) {}
            identified = true;
          }
        }

        if (identified) {
          logEvent({
            tipo: 'FORM_DATOS',
            seccion: activeSectionName || 'Formulario',
            detalle: `Datos detectados: ${customerName ? 'Nombre' : ''} ${customerPhone ? 'Teléfono' : ''}`.trim(),
            nombre: customerName,
            telefono: customerPhone
          });
        }
      },
      true
    );
  }

  // --- 8. AUTO-CAPTURA DE CLICS EN BOTONES DE WHATSAPP ---
  function initWhatsAppClickTracking() {
    document.addEventListener('click', function (e) {
      const link = e.target.closest && e.target.closest('a[href*="wa.me"], a[href*="whatsapp.com"]');
      if (link) {
        const text = (link.textContent || '').replace(/\s+/g, ' ').trim() || 'Botón WhatsApp';
        const href = link.getAttribute('href') || '';
        let msg = '';
        try {
          const u = new URL(href, window.location.href);
          msg = u.searchParams.get('text') || '';
        } catch (err) {}

        logEvent({
          tipo: 'CLIC_WHATSAPP',
          seccion: activeSectionName || 'General',
          detalle: `Clic en WhatsApp: ${text.substring(0, 35)}${msg ? ' (Msg: ' + msg.substring(0, 35) + '...)' : ''}`
        });
        flush();
      }
    }, true);
  }

  // --- 9. AUTO-CAPTURA DE HISTORIAS, PESTAÑAS, PROYECTOS, CALCULADORAS Y CTAS ---
  function initRichInteractionsTracking() {
    // Clics interactivos en la interfaz
    document.addEventListener('click', function (e) {
      const target = e.target;
      if (!target) return;

      // A) Clic en Historias Destacadas (Instagram Highlights)
      const storyItem = target.closest && target.closest('.highlight-item, [onclick*="openStories"]');
      if (storyItem) {
        const label = storyItem.querySelector('.highlight-label') ? storyItem.querySelector('.highlight-label').textContent.trim() : 'Historia';
        logEvent({
          tipo: 'VER_HISTORIA',
          seccion: 'Historias Destacadas',
          detalle: `Abrió historia: ${label}`
        });
        flush();
        return;
      }

      // B) Clic en Pestañas (CV, Posts, Reels, Web)
      const tabBtn = target.closest && target.closest('.tab-button, [onclick*="switchTab"]');
      if (tabBtn) {
        const label = (tabBtn.textContent || '').replace(/\s+/g, ' ').trim();
        logEvent({
          tipo: 'CAMBIO_PESTANA',
          seccion: 'Barra de Pestañas',
          detalle: `Pestaña activa: ${label}`
        });
        flush();
        return;
      }

      // C) Clic en Proyecto para abrir Modal
      const projItem = target.closest && target.closest('.grid-item, .reel-item, .web-item, [onclick*="openModal"]');
      if (projItem) {
        const titleEl = projItem.querySelector('.project-title, .grid-overlay span, h3');
        const title = titleEl ? titleEl.textContent.trim() : 'Proyecto';
        logEvent({
          tipo: 'VER_PROYECTO',
          seccion: 'Feed de Proyectos',
          detalle: `Abrió proyecto: ${title}`
        });
        flush();
        return;
      }

      // D) Clic en Botón Like dentro del modal
      const likeBtn = target.closest && target.closest('#likeBtn');
      if (likeBtn) {
        logEvent({
          tipo: 'LIKE_PROYECTO',
          seccion: 'Modal Proyecto',
          detalle: 'Dio Me Gusta a un proyecto'
        });
        flush();
        return;
      }

      // E) Clic en Botones CTA (Diagnóstico, Cotizar, Solicitar, Ver Planes)
      const ctaBtn = target.closest && target.closest('.nav-cta, .floating-cta, .btn-primary, .btn-cta-ig, a[href^="#diagnostico"], a[href^="#cotizador"], a[href^="#planes"], a[href^="#tarifas"]');
      if (ctaBtn && !ctaBtn.href.includes('wa.me')) {
        const txt = (ctaBtn.textContent || '').replace(/\s+/g, ' ').trim();
        if (txt.length > 0 && txt.length < 40) {
          logEvent({
            tipo: 'CLIC_CTA',
            seccion: activeSectionName || 'Navegación',
            detalle: `Clic CTA: ${txt}`
          });
          flush();
        }
      }
    }, true);

    // Cambios en calculadoras, cotizadores y chips en tiempo real
    document.addEventListener('change', function (e) {
      const target = e.target;
      if (!target) return;

      const form = target.closest && target.closest('form');
      const formId = form ? form.id : '';

      // Si pertenece a alguna calculadora conocida
      if (['quoteCalculatorForm', 'prodQuoteForm', 'webQuoteForm', 'autoQuoteForm'].includes(formId)) {
        const formName = formId === 'quoteCalculatorForm' ? 'Calculadora Eventos'
          : formId === 'prodQuoteForm' ? 'Cotizador Producción'
          : formId === 'webQuoteForm' ? 'Cotizador Web'
          : 'Diagnóstico Automatización';

        const label = target.name || target.id || target.className || 'Opción';
        const val = target.type === 'checkbox' ? (target.checked ? 'Marcado' : 'Desmarcado') : (target.value || '').substring(0, 30);

        logEvent({
          tipo: 'INTERACCION_COTIZADOR',
          seccion: activeSectionName || 'Cotizador',
          detalle: `${formName}: ${label} = ${val}`
        });
      }
    }, true);
  }

  // --- 10. API GLOBAL DMG_Telemetry ---
  window.DMG_Telemetry = {
    isExcluded: isExcluded,
    excludeCurrentDevice: function() {
      try {
        localStorage.setItem('dmg_exclude_admin', 'true');
        isExcluded = true;
        console.log('[Telemetry] Dispositivo excluido permanentemente.');
      } catch (e) {}
    },
    setEndpoint: function (url) {
      CONFIG.endpoint = url;
      window.DMG_TELEMETRY_URL = url;
    },
    identify: function (data) {
      if (!data) return;
      if (data.name) {
        customerName = data.name.trim();
        try { localStorage.setItem('dmg_name', customerName); } catch (e) {}
      }
      if (data.phone) {
        customerPhone = data.phone.trim();
        try { localStorage.setItem('dmg_phone', customerPhone); } catch (e) {}
      }
      logEvent({
        tipo: 'FORM_DATOS',
        seccion: activeSectionName || 'Identificación',
        detalle: 'Cliente identificado',
        nombre: customerName,
        telefono: customerPhone
      });
    },
    trackEvent: function (tipo, seccion, detalle, tiempo) {
      logEvent({
        tipo: tipo || 'ACCION',
        seccion: seccion || activeSectionName || 'General',
        detalle: detalle || '',
        tiempo: tiempo || 0,
        nombre: customerName,
        telefono: customerPhone
      });
    },
    flush: flush
  };

  // --- 11. INICIALIZACIÓN ---
  function startup() {
    if (isExcluded) {
      console.log('[Telemetry] Dispositivo de Administrador (David) omitido de telemetría.');
      return;
    }
    initSectionObserver();
    initScrollDepthTracking();
    initAutoCaptureForms();
    initWhatsAppClickTracking();
    initRichInteractionsTracking();

    setTimeout(() => {
      logEvent({
        tipo: 'LLEGADA_WEB',
        seccion: activeSectionName || 'Hero Principal',
        detalle: `Visita iniciada en ${getPageName()}`
      });
      flush();
    }, 400);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startup);
  } else {
    startup();
  }
})();
