/**
 * ==============================================================================
 * SISTEMA DE TELEMETRÍA Y EVENT-STREAM - DAVID DESIGN CO
 * Archivo: Código para Google Apps Script (Extensiones > Apps Script en tu Hoja)
 * Hoja Vinculada: https://docs.google.com/spreadsheets/d/1y0OPHsae3IOvys9jFIp8mf0PBv1tlM7SxrKoDx6BbY0/edit
 * ==============================================================================
 */

const SHEET_NAME = 'Eventos_Detalle';

// Lista de sesiones o usuarios excluidos (Administrador / Pruebas de David)
const EXCLUDED_IDS = [
  'SES-MWB1GEQ4-ZHT41', // Ordenador David
  'SES-MWB4KEQF-W4QYW'  // Móvil David
];

// Estructura oficial de 20 columnas (Stream de Eventos con Atribución Detallada)
const HEADERS = [
  'Fecha_Hora',
  'ID_Usuario',
  'ID_Sesion',
  'Nro_Visita',
  'Pagina',
  'Seccion',
  'Tiempo_Segundos',
  'Tipo_Evento',
  'Detalle_Evento',
  'Cliente_Nombre',
  'Cliente_Telefono',
  'Pais',
  'Region_Depto',
  'Ciudad',
  'Dispositivo',
  'Tipo_Red',
  'Origen_Trafico',
  'Campana_Nombre',
  'Campana_ID',
  'Anuncio_Nombre'
];

/**
 * Recibe eventos vía POST desde el script de la web (js/telemetry.js)
 */
function doPost(e) {
  try {
    // Bloqueo de concurrencia: si varios visitantes interactúan a la vez, se encolan sin sobreescribirse
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);

    // Si la pestaña no existe, la crea automáticamente
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
    }

    // Si la hoja está nueva o vacía, inicializa los encabezados con diseño elegante
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#0f172a'); // Slate / Azul oscuro moderno
      headerRange.setFontColor('#ffffff'); // Texto blanco
      headerRange.setHorizontalAlignment('center');
      headerRange.setWrap(false);
      sheet.setFrozenRows(1);
    }

    if (!e || !e.postData || !e.postData.contents) {
      lock.releaseLock();
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'No payload received' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const payload = JSON.parse(e.postData.contents);
    const rawEvents = Array.isArray(payload) ? payload : (payload.events ? payload.events : [payload]);

    // Omitir automáticamente eventos de las sesiones o usuarios de David (administrador)
    const events = rawEvents.filter(function(ev) {
      const sId = (ev.ID_Sesion || '').trim();
      const uId = (ev.ID_Usuario || '').trim();
      return !EXCLUDED_IDS.includes(sId) && !EXCLUDED_IDS.includes(uId);
    });

    if (events.length === 0) {
      lock.releaseLock();
      return ContentService.createTextOutput(JSON.stringify({ status: 'ignored', message: 'Eventos del administrador omitidos exitosamente' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const rowsToAppend = events.map(function(ev) {
      return [
        ev.Fecha_Hora || Utilities.formatDate(new Date(), 'America/Bogota', 'yyyy-MM-dd HH:mm:ss'),
        ev.ID_Usuario || '',
        ev.ID_Sesion || '',
        typeof ev.Nro_Visita === 'number' ? ev.Nro_Visita : (parseInt(ev.Nro_Visita, 10) || 1),
        ev.Pagina || '',
        ev.Seccion || '',
        typeof ev.Tiempo_Segundos === 'number' ? ev.Tiempo_Segundos : (parseInt(ev.Tiempo_Segundos, 10) || 0),
        ev.Tipo_Evento || '',
        ev.Detalle_Evento || '',
        ev.Cliente_Nombre || '',
        ev.Cliente_Telefono || '',
        ev.Pais || '',
        ev.Region_Depto || '',
        ev.Ciudad || '',
        ev.Dispositivo || '',
        ev.Tipo_Red || '',
        ev.Origen_Trafico || '',
        ev.Campana_Nombre || '',
        ev.Campana_ID || '',
        ev.Anuncio_Nombre || ''
      ];
    });

    if (rowsToAppend.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, rowsToAppend.length, HEADERS.length).setValues(rowsToAppend);
    }

    lock.releaseLock();

    return ContentService.createTextOutput(JSON.stringify({ status: 'success', added: rowsToAppend.length }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Permite verificar en el navegador que el Web App está activo y funcionando
 */
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ 
    status: 'online', 
    timestamp: Utilities.formatDate(new Date(), 'America/Bogota', 'yyyy-MM-dd HH:mm:ss'),
    message: 'Endpoint de Telemetría DavidDesignCO activo y listo para recibir datos.' 
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * FUNCIÓN DE LIMPIEZA AUTOMÁTICA:
 * Elimina de la hoja todas las filas históricas que correspondan a tus sesiones de prueba.
 * Para ejecutarla: En el editor de Apps Script, selecciona la función 'limpiarRegistrosPrueba' arriba y haz clic en 'Ejecutar'.
 */
function limpiarRegistrosPrueba() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return;

  let borradas = 0;
  // Recorrer de abajo hacia arriba para borrar las filas sin desfase de índices
  for (let i = data.length - 1; i >= 1; i--) {
    const sesId = String(data[i][2] || '').trim(); // Columna C (ID_Sesion)
    const usrId = String(data[i][1] || '').trim(); // Columna B (ID_Usuario)
    if (EXCLUDED_IDS.includes(sesId) || EXCLUDED_IDS.includes(usrId)) {
      sheet.deleteRow(i + 1);
      borradas++;
    }
  }
  Logger.log('Filas de prueba eliminadas: ' + borradas);
}
