import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as ftp from 'basic-ftp';
import dotenv from 'dotenv';

// Configurar dotenv
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Obtener el argumento del nombre del cliente
const clientArg = process.argv[2];

if (!clientArg) {
  console.error('\x1b[31mError: Por favor especifica el nombre del cliente.\x1b[0m');
  console.log('Uso: node scripts/publish.js <nombre-cliente-en-minusculas>');
  console.log('Ejemplo: node scripts/publish.js cliente-ejemplo');
  process.exit(1);
}

const clientNameLower = clientArg.toLowerCase().replace(/\s+/g, '-');
const jsonPath = path.join(rootDir, 'informes', 'data', `${clientNameLower}.json`);
const templatePath = path.join(rootDir, 'templates', 'report-template.html');
const outputDir = path.join(rootDir, 'informes');

// Verificar que existe el JSON de datos
if (!fs.existsSync(jsonPath)) {
  console.error(`\x1b[31mError: No se encontró el archivo de datos en: ${jsonPath}\x1b[0m`);
  console.log(`Por favor crea el archivo JSON en la carpeta informes/data/${clientNameLower}.json`);
  process.exit(1);
}

// Verificar que existe la plantilla
if (!fs.existsSync(templatePath)) {
  console.error(`\x1b[31mError: No se encontró la plantilla en: ${templatePath}\x1b[0m`);
  process.exit(1);
}

// 1. Cargar y parsear datos del JSON
const rawData = fs.readFileSync(jsonPath, 'utf-8');
let data;
try {
  data = JSON.parse(rawData);
} catch (e) {
  console.error('\x1b[31mError: El archivo JSON tiene un formato inválido.\x1b[0m', e.message);
  process.exit(1);
}

// Verificar o generar hash único para el cliente
if (!data.hash) {
  data.hash = Math.random().toString(36).substring(2, 8); // 6 caracteres alfanuméricos
  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`\x1b[32m✔ Se generó y guardó un nuevo ID único para este cliente: ${data.hash}\x1b[0m`);
}

const clientFileName = `${clientNameLower}-${data.hash}`;
const outputPath = path.join(outputDir, `${clientFileName}.html`);

// 2. Leer la plantilla HTML
let html = fs.readFileSync(templatePath, 'utf-8');

// 3. Preparar variables de la plantilla
const clientName = data.clientName;
const category = data.category || 'Servicios';
const instagramUser = data.instagramUser || 'No especificado';
const scores = data.scores || { 
  overall: 50, 
  visualIdentity: 5, 
  socialMedia: 5, 
  audiovisual: 5, 
  website: 5, 
  seoLocal: 5, 
  automation: 5 
};

// Fecha formateada (DD/MM/YYYY)
const today = new Date();
const formattedDate = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

// Salud Visual: Textos y Colores
let scoreText = 'En Riesgo / Requiere Atención';
let scoreColor = '#00EDFF'; // Cian default
if (scores.overall >= 80) {
  scoreText = 'Excelente / Nivel Premium';
  scoreColor = '#39FF14'; // Verde
} else if (scores.overall >= 60) {
  scoreText = 'Favorable / Con Oportunidades';
  scoreColor = '#00EDFF'; // Cian
} else if (scores.overall >= 40) {
  scoreText = 'En Riesgo / Requiere Atención';
  scoreColor = '#FF9900'; // Naranja
} else {
  scoreText = 'Crítico / Requiere Intervención';
  scoreColor = '#FF3B3B'; // Rojo
}

// Calcular Dashoffset para círculo SVG (dasharray = 408.4)
const r = 65;
const circleCircumference = 2 * Math.PI * r; // ~408.4
const strokeDashoffset = circleCircumference - (scores.overall / 100) * circleCircumference;

// Clases de badge para puntuaciones
const getBadgeClass = (score) => {
  if (score >= 8) return ''; // Cian normal
  if (score >= 5) return 'warning'; // Naranja
  return 'critical'; // Rojo
};

// Generar puntos del análisis en formato HTML <li>
const generateListHtml = (points) => {
  if (!points || points.length === 0) return '<li class="analysis-item">Ningún punto crítico identificado.</li>';
  return points.map(point => 
    `<li class="analysis-item"><span class="analysis-item-marker">→</span> <span>${point}</span></li>`
  ).join('\n');
};

// Generar pasos del plan de acción en formato HTML
const generatePlanHtml = (steps) => {
  if (!steps || steps.length === 0) return '<p class="text-secondary">Sin pasos definidos.</p>';
  return steps.map((step, idx) => `
    <div class="plan-step-card">
        <span class="plan-step-num">Paso 0${idx + 1}</span>
        <h4 class="plan-step-title">${step.title}</h4>
        <p class="plan-step-desc">${step.desc}</p>
    </div>
  `).join('\n');
};

// Generar checklist de canales en formato HTML
const generateChecklistHtml = (items) => {
  if (!items || items.length === 0) return '<p class="text-secondary">Sin checklist de presencia digital definido.</p>';
  return items.map(item => `
    <div class="checklist-item">
        <div class="checklist-item-header">
            <span class="checklist-item-title">${item.name}</span>
            <span class="checklist-badge ${item.statusClass}">${item.status}</span>
        </div>
        <p class="checklist-item-desc">${item.desc}</p>
    </div>
  `).join('\n');
};

// Generar impacto y resultados esperados en formato HTML
const generateTransformHtml = (tabData) => {
  if (!tabData) return '<p class="text-secondary">Sin datos de transformación definidos.</p>';
  
  const before = tabData.before || { title: 'Sin título', desc: '', metrics: [] };
  const after = tabData.after || { title: 'Sin título', desc: '', metrics: [] };
  
  const beforeMetricsHtml = before.metrics ? before.metrics.map(m => `
    <div class="transform-metric-item">
        <span class="transform-metric-name">${m.name}</span>
        <span class="transform-metric-val bad">${m.val}</span>
    </div>
  `).join('\n') : '';

  const afterMetricsHtml = after.metrics ? after.metrics.map(m => `
    <div class="transform-metric-item">
        <span class="transform-metric-name">${m.name}</span>
        <span class="transform-metric-val good">${m.val}</span>
    </div>
  `).join('\n') : '';

  return `
    <div class="transform-card before-card">
        <div>
            <span class="transform-label before-label">⚠️ Estado Actual (Fricción)</span>
            <h4 class="transform-card-title">${before.title}</h4>
            <p class="transform-card-desc">${before.desc}</p>
        </div>
        <div class="transform-metrics-list">
            ${beforeMetricsHtml}
        </div>
    </div>
    <div class="transform-card after-card">
        <div>
            <span class="transform-label after-label">📈 Impacto Pro (Resultado)</span>
            <h4 class="transform-card-title">${after.title}</h4>
            <p class="transform-card-desc">${after.desc}</p>
        </div>
        <div class="transform-metrics-list">
            ${afterMetricsHtml}
        </div>
    </div>
  `;
};

// Enlace de WhatsApp
const waPhone = '573169642159'; // Tu número de WhatsApp
const waMessage = `Hola David, acabo de revisar el Informe de Presencia Visual que preparaste para mi negocio ${clientName}. Me interesa discutir el plan de acción para mejorar.`;
const whatsappLink = `https://wa.me/${waPhone}?text=${encodeURIComponent(waMessage)}`;

// Reemplazar marcadores en la plantilla
html = html
  .replaceAll('{{CLIENT_NAME}}', clientName)
  .replaceAll('{{CATEGORY}}', category)
  .replaceAll('{{DATE}}', formattedDate)
  .replaceAll('{{SCORE}}', `${scores.overall}%`)
  .replaceAll('{{STROKE_DASHOFFSET}}', strokeDashoffset.toFixed(2))
  .replaceAll('{{SCORE_TEXT}}', scoreText)
  .replaceAll('{{SCORE_COLOR}}', scoreColor)
  
  // 6 puntuaciones de diagnóstico
  .replaceAll('{{VISUAL_SCORE}}', scores.visualIdentity)
  .replaceAll('{{VISUAL_BADGE_CLASS}}', getBadgeClass(scores.visualIdentity))
  
  .replaceAll('{{SOCIAL_SCORE}}', scores.socialMedia)
  .replaceAll('{{SOCIAL_BADGE_CLASS}}', getBadgeClass(scores.socialMedia))
  
  .replaceAll('{{CONTENT_SCORE}}', scores.audiovisual)
  .replaceAll('{{CONTENT_BADGE_CLASS}}', getBadgeClass(scores.audiovisual))
  
  .replaceAll('{{WEB_SCORE}}', scores.website)
  .replaceAll('{{WEB_BADGE_CLASS}}', getBadgeClass(scores.website))
  
  .replaceAll('{{SEO_SCORE}}', scores.seoLocal)
  .replaceAll('{{SEO_BADGE_CLASS}}', getBadgeClass(scores.seoLocal))
  
  .replaceAll('{{AUTO_SCORE}}', scores.automation)
  .replaceAll('{{AUTO_BADGE_CLASS}}', getBadgeClass(scores.automation))
  
  // Observaciones críticas
  .replaceAll('{{VISUAL_IDENTITY_POINTS}}', generateListHtml(data.analysis.visualIdentity))
  .replaceAll('{{SOCIAL_MEDIA_POINTS}}', generateListHtml(data.analysis.socialMedia))
  .replaceAll('{{CONTENT_POINTS}}', generateListHtml(data.analysis.audiovisual))
  .replaceAll('{{WEBSITE_POINTS}}', generateListHtml(data.analysis.website))
  .replaceAll('{{SEO_POINTS}}', generateListHtml(data.analysis.seoLocal))
  .replaceAll('{{AUTO_POINTS}}', generateListHtml(data.analysis.automation))
  
  // Plan de acción en fases
  .replaceAll('{{ACTION_PLAN_POINTS}}', generatePlanHtml(data.actionPlan))
  
  // Checklist de presencia digital
  .replaceAll('{{CHANNELS_CHECKLIST_HTML}}', generateChecklistHtml(data.channelsSummary))

  // Dashboard interactivo de resultados (Antes vs Después)
  .replaceAll('{{PRESENCIA_RESULTS_HTML}}', generateTransformHtml(data.expectedResults.presencia))
  .replaceAll('{{CAPTACION_RESULTS_HTML}}', generateTransformHtml(data.expectedResults.captacion))
  .replaceAll('{{EFICIENCIA_RESULTS_HTML}}', generateTransformHtml(data.expectedResults.eficiencia))
  
  .replaceAll('{{WHATSAPP_LINK}}', whatsappLink);

// 4. Guardar archivo localmente
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}
fs.writeFileSync(outputPath, html, 'utf-8');
console.log(`\x1b[32m✔ Informe compilado localmente en: ${outputPath}\x1b[0m`);

// 5. Conectarse a FTP y subir a Hostinger
const client = new ftp.Client();
// Timeout en ms
client.ftp.verbose = false;

async function uploadFile() {
  console.log('Estableciendo conexión FTP con Hostinger...');
  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      port: parseInt(process.env.FTP_PORT || '21'),
      secure: false // Cambiar a true si usas FTPS implícito, normal en Hostinger es estándar
    });

    console.log('Conexión establecida. Subiendo archivo...');
    // Dado que el usuario FTP ya está anclado en /public_html/informes,
    // subimos el archivo local directamente en la raíz "/" del FTP
    await client.uploadFrom(outputPath, `${clientFileName}.html`);
    console.log('\x1b[32m✔ ¡Archivo subido exitosamente a Hostinger!\x1b[0m');
  } catch (err) {
    console.error('\x1b[31mError al subir por FTP:\x1b[0m', err.message);
    process.exit(1);
  } finally {
    client.close();
  }

  // 6. Generar enlaces y mensajes de salida
  const baseUrl = process.env.BASE_URL || 'https://davidiseñador.es/informes';
  const publicReportUrl = `${baseUrl}/${clientFileName}.html`;
  
  // Mensaje de WhatsApp predeterminado para enviarle al cliente prospecto
  const contactName = data.contactName || clientName.split(' ')[0];
  const prospectMessage = `👋 ¡Hola, ${contactName}! ¿Cómo estás? Espero que súper bien. ✨

Mi nombre es David Muñoz, diseñador de marca y consultor digital. Estuve analizando la presencia en internet de *${clientName}* y me pareció genial lo que hacen. 📱

Sin embargo, identifiqué un par de detalles en su ficha de Google y redes sociales que podrían estar limitando su visibilidad y la captación de nuevos clientes locales.

Por eso, preparé un *informe de tu presencia digital* detallado y 100% exclusivo para ustedes, donde explico los puntos a mejorar y los resultados que podrían alcanzar (como atraer clientes de mayor nivel adquisitivo y recibir reservas directas). Puedes verlo aquí:

🔗 ${publicReportUrl}

Al final del informe hay un botón para agendar una llamada rápida de 15 minutos sin costo por si desean conversar sobre cómo implementarlo. 🗓️ ¡Un saludo!`;
  
  console.log('\n======================================================');
  console.log('\x1b[34mINFORME PUBLICADO Y LISTO\x1b[0m');
  console.log('======================================================');
  console.log(`\n🔗 \x1b[36mEnlace público del informe:\x1b[0m\n${publicReportUrl}\n`);
  console.log('💬 \x1b[36mMensaje sugerido para WhatsApp:\x1b[0m');
  console.log('------------------------------------------------------');
  console.log(prospectMessage);
  console.log('------------------------------------------------------\n');
}

uploadFile();
