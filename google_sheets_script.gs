/**
 * ==============================================================================
 * SISTEMA DE TELEMETRÍA Y EVENT-STREAM - DAVID DESIGN CO
 * Archivo: Código para Google Apps Script (Extensiones > Apps Script en tu Hoja)
 * Hoja Vinculada: https://docs.google.com/spreadsheets/d/1y0OPHsae3IOvys9jFIp8mf0PBv1tlM7SxrKoDx6BbY0/edit
 * ==============================================================================
 */

const SHEET_NAME = 'Eventos_Detalle';

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
    const events = Array.isArray(payload) ? payload : (payload.events ? payload.events : [payload]);

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

