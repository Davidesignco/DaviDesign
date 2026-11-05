/**
 * ==============================================================================
 * GOOGLE APPS SCRIPT: REGISTRO DE PEDIDOS - BOLAS DE NAVIDAD PERSONALIZADAS
 * David Muñoz Diseñador
 * ==============================================================================
 * 
 * HOJA VINCULADA:
 * https://docs.google.com/spreadsheets/d/16w32vpv4p3jvhXKzV16iiVrZ1VEJV99cgQ3PtWCrT8o/edit
 * ID DE LA HOJA: 16w32vpv4p3jvhXKzV16iiVrZ1VEJV99cgQ3PtWCrT8o
 * 
 * ORDEN DE COLUMNAS ACTUALIZADO (CON ESTADO DE PRODUCCIÓN DESPLEGABLE):
 * 1. Fecha (DD/MM/AAAA)
 * 2. Número de Pedido (Código BN-XXXX)
 * 3. Tipo de Bola (BN001 Copos, BN003 Muñeco, BN004 Mascota, etc.)
 * 4. Nombre a Grabar en Madera (Limpio, sin emojis)
 * 5. Estado de Producción (Menú Desplegable: Nuevo, Diseñado, Enviado a impresión, Recogido, Enviado)
 * 6. Nombre Cliente
 * 7. Teléfono / WhatsApp
 * 8. Departamento
 * 9. Ciudad
 * 10. Dirección Completa
 * 11. Notas de Entrega
 * 12. Estado Pago (💬 WHATSAPP / ✅ PAGADO_WOMPI)
 * 13. Total a Pagar ($ COP)
 * 14. Total Bolas en el Pedido
 * 15. ID Transacción Wompi
 * ==============================================================================
 */

var SPREADSHEET_ID = '16w32vpv4p3jvhXKzV16iiVrZ1VEJV99cgQ3PtWCrT8o';

function getSheetInstance() {
  var ss = null;
  if (SPREADSHEET_ID) {
    try {
      ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    } catch (e) {
      console.warn('No se pudo abrir por ID, intentando getActiveSpreadsheet:', e);
    }
  }
  if (!ss) {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }
  if (!ss) {
    throw new Error('No se pudo acceder a la hoja de cálculo. Verifica el SPREADSHEET_ID: ' + SPREADSHEET_ID);
  }
  return ss.getSheetByName('Pedidos Bolas') || ss.getSheets()[0];
}

function doPost(e) {
  try {
    var rawData = e.postData ? e.postData.contents : null;
    if (!rawData) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'No payload' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var data = JSON.parse(rawData);
    var sheet = getSheetInstance();

    // 1. Crear cabeceras si la hoja está vacía
    if (sheet.getLastRow() === 0) {
      var headers = [
        'Fecha',
        'Número de Pedido',
        'Tipo de Bola',
        'Nombre a Grabar en Madera',
        'Estado de Producción',
        'Nombre Cliente',
        'Teléfono / WhatsApp',
        'Departamento',
        'Ciudad',
        'Dirección Completa',
        'Notas de Entrega',
        'Estado Pago',
        'Total a Pagar',
        'Total Bolas Pedido',
        'ID Transacción Wompi'
      ];
      sheet.appendRow(headers);

      // Estilizar cabecera (Azul oscuro + Dorado de Navidad)
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground('#0a1128');
      headerRange.setFontColor('#ffd700');
      headerRange.setFontWeight('bold');
      headerRange.setFontSize(10);
      headerRange.setHorizontalAlignment('center');
      sheet.setFrozenRows(1);
    }

    // Datos del pedido
    var fechaStr = data.fecha || Utilities.formatDate(new Date(), 'America/Bogota', 'dd/MM/yyyy');
    var codigo = data.codigo_pedido || 'BN-' + Math.floor(1000 + Math.random() * 9000);
    var estadoPago = data.estado_pago || '💬 WHATSAPP';
    var totalPagar = data.total_pagar || '$0 COP';
    var totalBolas = data.total_bolas || 0;
    var cliente = data.nombre_cliente || '';
    var whatsapp = data.whatsapp || '';
    var depto = data.departamento || '';
    var ciudad = data.ciudad || '';
    var direccion = data.direccion || '';
    var notas = data.notas || '';
    var transaccionWompi = data.id_transaccion_wompi || '';

    // Lista de bolas: { numero: 1, modelo: 'BN003 - Muñeco Festivo', nombre: 'Andrea' }
    var listaBolas = data.bolas || [];
    if (listaBolas.length === 0) {
      listaBolas.push({
        numero: 1,
        modelo: data.modelo_principal || 'BN001',
        nombre: 'Personalizado'
      });
    }

    var rowsToAdd = [];

    // Función para limpiar cualquier emoji o símbolo gráfico no apto para láser
    function limpiarTextoLaser(txt) {
      if (!txt) return '';
      return String(txt).replace(/[^\p{L}\p{N}\s#\-\.]/gu, '').trim();
    }

    // Renglón 1: Fecha, Código, Bola #1 (Tipo + Nombre + Estado) y datos del cliente
    var primeraBola = listaBolas[0];
    rowsToAdd.push([
      fechaStr,
      codigo,
      primeraBola.modelo || '',
      limpiarTextoLaser(primeraBola.nombre),
      'Nuevo', // Estado de producción inicial por defecto
      cliente,
      whatsapp,
      depto,
      ciudad,
      direccion,
      notas,
      estadoPago,
      totalPagar,
      totalBolas,
      transaccionWompi
    ]);

    // Renglones 2 a N: Código de pedido, Tipo de bola, Nombre a grabar y Estado (dejando en blanco datos del cliente)
    for (var i = 1; i < listaBolas.length; i++) {
      var bola = listaBolas[i];
      rowsToAdd.push([
        '', // Fecha vacía
        codigo, // Código de pedido para rápida referencia visual
        bola.modelo || '',
        limpiarTextoLaser(bola.nombre),
        'Nuevo', // Estado de producción inicial
        '', // Cliente vacío
        '', // WhatsApp vacío
        '', // Depto vacío
        '', // Ciudad vacío
        '', // Dirección vacío
        '', // Notas vacío
        '', // Estado pago vacío
        '', // Total vacío
        '', // Total bolas vacío
        ''  // Wompi vacío
      ]);
    }

    // Insertar el bloque de renglones en la hoja
    var startRow = sheet.getLastRow() + 1;
    sheet.getRange(startRow, 1, rowsToAdd.length, rowsToAdd[0].length).setValues(rowsToAdd);

    // ── CREAR MENÚ DESPLEGABLE EN LA COLUMNA 5 (ESTADO DE PRODUCCIÓN) ──
    var estadosProduccion = ['Nuevo', 'Diseñado', 'Enviado a impresión', 'Recogido', 'Enviado'];
    var reglaValidacion = SpreadsheetApp.newDataValidation()
      .requireValueInList(estadosProduccion, true)
      .setAllowInvalid(false)
      .build();

    var rangoEstado = sheet.getRange(startRow, 5, rowsToAdd.length, 1);
    rangoEstado.setDataValidation(reglaValidacion);
    rangoEstado.setHorizontalAlignment('center');

    // Formatear visualmente el bloque del pedido (borde inferior sutil para delimitar pedidos)
    var orderRange = sheet.getRange(startRow, 1, rowsToAdd.length, rowsToAdd[0].length);
    orderRange.setBorder(null, null, true, null, null, null, '#94a3b8', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);

    SpreadsheetApp.flush();

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      codigo: codigo,
      filas_insertadas: rowsToAdd.length
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var sheet = getSheetInstance();
    return ContentService.createTextOutput('API Bolas de Navidad activa y conectada a la hoja: ' + sheet.getName());
  } catch (err) {
    return ContentService.createTextOutput('Error de conexión a la hoja: ' + err.toString());
  }
}
