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
 * 7. Envío en segundo plano (Beacon / keepalive) sin afectar la velocidad de carga.
 * ==============================================================================
 */

(function () {
  'use strict';

  // Configuración del Endpoint de Google Apps Script Web App
  const CONFIG = {
    endpoint: window.DMG_TELEMETRY_URL || 'https://script.google.com/macros/s/AKfycby6PUUADw9y3dFVlGWzh88GoHiVfOTYVb3wuNUvPJHz91JXkuHYJ8_BseDdqKQap8rj/exec',
    flushIntervalMs: 6000,
    minTimeSecondsToLog: 2, // Ignora scrolls fugaces menores a 2 segundos
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
    // Si la página tiene etiqueta de título o data-page
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
    if (window.location.pathname === '/' || window.location.pathname.includes('index')) return 'Portafolio Principal';
    return title.split('—')[0].split('|')[0].trim() || window.location.pathname;
  }

  function logEvent(opts) {
    opts = opts || {};
    const ev = {
      Fecha_Hora: formatDateTime(),
      ID_Usuario: userId,
      ID_Sesion: sessionId,
      Nro_Visita: visitCount,
      Pagina: opts.pagina || getPageName(),
      Seccion: opts.seccion || 'General',
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

    // Si es un evento crítico (Compra, WhatsApp, Formulario), envía de inmediato
    if (['COMPRA', 'CLIC_WHATSAPP', 'FORM_DATOS'].includes(ev.Tipo_Evento)) {
      flush();
    }
  }

  function flush() {
    const url = CONFIG.endpoint || window.DMG_TELEMETRY_URL;
    if (!url || eventQueue.length === 0) return;

    const payload = JSON.stringify({ events: eventQueue.splice(0, eventQueue.length) });

    // Intento con sendBeacon primero (óptimo para no congelar navegación)
    let sent = false;
    if (navigator.sendBeacon) {
      try {
        const blob = new Blob([payload], { type: 'text/plain;charset=UTF-8' });
        sent = navigator.sendBeacon(url, blob);
      } catch (e) {
        sent = false;
      }
    }

    if (!sent) {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: payload,
        mode: 'no-cors',
        keepalive: true
      }).catch(() => {});
    }
  }

  // Enviar eventos periódicamente
  setInterval(flush, CONFIG.flushIntervalMs);

  // Enviar al ocultar pestaña o cerrar ventana
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

  // --- 5. RASTREO PRECISO DE SECCIONES (TIEMPO POR SECCIÓN) ---
  let activeSectionEl = null;
  let activeSectionName = '';
  let activeSectionStartTime = Date.now();

  function getSectionFriendlyName(el) {
    if (!el) return 'Desconocida';
    if (el.getAttribute('data-telemetry-name')) {
      return el.getAttribute('data-telemetry-name');
    }

    const id = (el.id || '').toLowerCase();
    const className = (el.className || '').toLowerCase();

    if (className.includes('xmas-hero-section') || className.includes('hero') || id === 'hero') {
      return 'Hero Principal';
    }
    if (id === 'modelos') return 'Catálogo de Modelos';
    if (id === 'simulador') return 'Simulador Interactivo';
    if (id === 'reviews') return 'Opiniones y Reseñas';
    if (id === 'faq') return 'Preguntas Frecuentes';
    if (id === 'contacto') return 'Contacto y Ubicación';

    // Intenta buscar el primer h2 o h3 dentro de la sección
    const heading = el.querySelector('h1, h2, h3');
    if (heading && heading.textContent) {
      const txt = heading.textContent.replace(/\s+/g, ' ').trim();
      if (txt.length > 0 && txt.length < 35) return txt;
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
  }

  function resumeCurrentSection() {
    if (activeSectionEl) {
      activeSectionStartTime = Date.now();
    }
  }

  function initSectionObserver() {
    const sections = document.querySelectorAll('section, header.xmas-hero-section, footer, [data-telemetry-section]');
    if (!sections || sections.length === 0) return;

    // Usamos IntersectionObserver para detectar qué sección ocupa el foco del visitante
    const observer = new IntersectionObserver(
      entries => {
        // Encontrar la sección más visible
        let maxVisibleEntry = null;
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.25) {
            if (!maxVisibleEntry || entry.intersectionRatio > maxVisibleEntry.intersectionRatio) {
              maxVisibleEntry = entry;
            }
          }
        });

        if (maxVisibleEntry && maxVisibleEntry.target !== activeSectionEl) {
          endCurrentSection();
          activeSectionEl = maxVisibleEntry.target;
          activeSectionName = getSectionFriendlyName(activeSectionEl);
          activeSectionStartTime = Date.now();
        }
      },
      {
        threshold: [0.25, 0.5, 0.75]
      }
    );

    sections.forEach(s => observer.observe(s));
  }

  // --- 6. AUTO-CAPTURA DE DATOS DEL CLIENTE EN FORMULARIOS ---
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

  // --- 7. API GLOBAL DMG_Telemetry ---
  window.DMG_Telemetry = {
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

  // Inicializar al cargar el DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initSectionObserver();
      initAutoCaptureForms();
    });
  } else {
    initSectionObserver();
    initAutoCaptureForms();
  }
})();

