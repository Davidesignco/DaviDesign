/**
 * ==============================================================================
 * GOOGLE APPS SCRIPT: REGISTRO DE PEDIDOS EN GOOGLE SHEETS + DRIVE + WOMPI
 * David Muñoz Diseñador — Landing Etiquetas Escolares
 * ==============================================================================
 * 
 * LIBRO VINCULADO:
 * https://docs.google.com/spreadsheets/d/1JIfiq_nCBTFZifMvlfeE6Eb2LPrSBJ-QILLfEtGeykw/edit
 * 
 * CARPETA EN GOOGLE DRIVE:
 * 📁 pedidos/
 *    └── 📁 etiquetas escolares/ (ID: 1AsXwq1DF1j6IQuvhD2zfiBpnjWW7m0AC)
 *        └── 📁 YYYY-MM-DD/
 *            └── 📁 [CODIGO_PEDIDO]/ (ej: PED-3923)
 *                ├── 🖼️ [REFERENCIA]_Diseno.jpg (Vista previa del diseño)
 *                ├── 🖼️ Foto_Cliente_[CODIGO].png (si subió foto/logo)
 *                └── 📄 Resumen_[CODIGO].txt (Ficha técnica completa de producción)
 * 
 * 24 COLUMNAS EXACTAS (LIMPIAS Y SIN REDUNDANCIAS):
 * 1. Fecha
 * 2. Código Pedido
 * 3. Estado de Pago       <-- [✅ PAGADO / ⏳ PENDIENTE / 💬 WHATSAPP]
 * 4. ID Transacción Wompi <-- [12237446-1793350524-44769]
 * 5. Producto / Pack
 * 6. Cantidad
 * 7. Texto 1
 * 8. Texto 2
 * 9. Texto 3
 * 10. Texto 4
 * 11. Color Fondo
 * 12. Color Texto
 * 13. Estampado
 * 14. Icono
 * 15. Tipografía
 * 16. Observaciones Diseño
 * 17. Enlace Diseño en Drive
 * 18. Enlace Foto Cliente Drive
 * 19. Cliente
 * 20. WhatsApp
 * 21. Ciudad
 * 22. Departamento
 * 23. Dirección
 * 24. Total a Pagar
 * 
 * INSTRUCCIONES DE ACTUALIZACIÓN:
 * 1. Abre https://script.google.com en tu proyecto.
 * 2. Selecciona todo el código, bórralo y pega este archivo completo.
 * 3. Guarda (Ctrl + S).
 * 4. Clic en "Implementar" (arriba a la derecha) > "Gestionar implementaciones".
 * 5. Clic en el icono del Lápiz (Editar) > en Versión elige "Nueva versión" > Clic en "Implementar".
 */

// ── CONFIGURACIÓN DE ACCESOS Y CREDENCIALES WOMPI PRODUCCIÓN ──
const ID_CARPETA_DRIVE = '1AsXwq1DF1j6IQuvhD2zfiBpnjWW7m0AC';
const ID_HOJA_CALCULO = '1JIfiq_nCBTFZifMvlfeE6Eb2LPrSBJ-QILLfEtGeykw';
const EMAIL_NOTIFICACION = 'davidesign93@gmail.com';

// ── CREDENCIALES WOMPI PRODUCCIÓN REAL ──
// NOTA DE SEGURIDAD PARA GITHUB: La llave privada nunca debe subirse a Git.
const WOMPI_PUB_KEY = 'pub_prod_pdLghBPNVVInC8u9oP3Ko0ffhQYou76T';
const WOMPI_PRV_KEY = 'prv_prod_TU_LLAVE_PRIVADA_AQUI'; // No requerida en frontend ni en este script
const WOMPI_EVENTS_SECRET = 'prod_events_ha3SjYG9Bxbg143hFYuI6Izg0sCaFHEp';
const WOMPI_INTEGRITY_SECRET = 'prod_integrity_EHFQ80YqnNr0D8cAmBiw5Rg5xPvPevsi';

const ENCABEZADOS_OFICIALES = [
  'Fecha',
  'Código Pedido',
  'Estado de Pago',
  'ID Transacción Wompi',
  'Producto / Pack',
  'Cantidad',
  'Texto 1',
  'Texto 2',
  'Texto 3',
  'Texto 4',
  'Color Fondo',
  'Color Texto',
  'Estampado',
  'Icono',
  'Tipografía',
  'Observaciones Diseño',
  'Enlace Diseño en Drive',
  'Enlace Foto Cliente Drive',
  'Cliente',
  'WhatsApp',
  'Ciudad',
  'Departamento',
  'Dirección',
  'Total a Pagar'
];

/**
 * Asegura que la fila 1 tenga exactamente las 24 columnas limpias.
 */
function asegurarCabeceras(sheet) {
  const lastCol = sheet.getLastColumn();
  const lastRow = sheet.getLastRow();

  if (lastRow === 0 || lastCol === 0) {
    sheet.appendRow(ENCABEZADOS_OFICIALES);
    sheet.setFrozenRows(1);
    estilarCabeceras(sheet, ENCABEZADOS_OFICIALES.length);
    return;
  }

  const cabecerasActuales = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(c => c.toString().trim());
  const tieneObsoletas = cabecerasActuales.indexOf('Renglón / Item') !== -1 || cabecerasActuales.indexOf('Material') !== -1 || cabecerasActuales.indexOf('Carpeta Drive Pedido') !== -1;
  const faltanPago = cabecerasActuales.indexOf('Estado de Pago') === -1 || cabecerasActuales.indexOf('ID Transacción Wompi') === -1;

  if (tieneObsoletas || faltanPago || cabecerasActuales.length !== ENCABEZADOS_OFICIALES.length) {
    sheet.getRange(1, 1, 1, ENCABEZADOS_OFICIALES.length).setValues([ENCABEZADOS_OFICIALES]);
    sheet.setFrozenRows(1);
    estilarCabeceras(sheet, ENCABEZADOS_OFICIALES.length);
  }
}

function estilarCabeceras(sheet, numCols) {
  try {
    const headerRange = sheet.getRange(1, 1, 1, numCols);
    headerRange.setBackground('#0f172a');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    headerRange.setFontSize(10);
    headerRange.setHorizontalAlignment('center');
    sheet.getRange(1, 3, 1, 2).setBackground('#047857'); // Columnas C y D destacadas
  } catch (e) {}
}

/**
 * Endpoint GET para diagnóstico rápido en el navegador
 */
function doGet(e) {
  try {
    const ss = SpreadsheetApp.openById(ID_HOJA_CALCULO);
    const sheet = ss.getSheets()[0];
    asegurarCabeceras(sheet);

    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

    let ultimosPedidos = [];
    if (lastRow > 1) {
      const numRows = Math.min(5, lastRow - 1);
      const rows = sheet.getRange(lastRow - numRows + 1, 1, numRows, lastCol).getValues();
      ultimosPedidos = rows.map(r => ({
        fecha: r[0],
        codigo: r[1],
        estado_pago: r[2],
        transaccion_wompi: r[3],
        producto: r[4],
        cliente: r[18],
        total: r[23]
      }));
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'online',
      mensaje: 'Google Apps Script de David Muñoz — 24 Columnas Optimizadas',
      hoja: sheet.getName(),
      total_filas: lastRow,
      columnas_activas: headers,
      ultimos_pedidos: ultimosPedidos
    }, null, 2)).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Endpoint POST principal
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(25000);

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'No payload received' })).setMimeType(ContentService.MimeType.JSON);
    }

    const rawData = e.postData.contents;
    let data;
    try {
      data = JSON.parse(rawData);
    } catch (eJson) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Invalid JSON' })).setMimeType(ContentService.MimeType.JSON);
    }

    // =========================================================================
    // CASO A: WEBHOOK DIRECTO DE EVENTOS WOMPI
    // =========================================================================
    if (data.event === 'transaction.updated' && data.data && data.data.transaction) {
      return procesarEventoWompi(data.data.transaction);
    }

    // ── FILTRO ANTI-FILAS FALSAS ─────────────────────────────────────────────
    // Si la petición NO tiene nombre de cliente real Y tampoco es un webhook reconocido,
    // es un ping o petición vacía: la descartamos para NO crear filas inexistentes.
    const nombreCliente = (data.nombre_cliente || '').toString().trim();
    if (!nombreCliente) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'ignored',
        mensaje: 'Petición descartada: No contiene datos de cliente obligatorios.'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // =========================================================================
    // CASO B: REGISTRO / ACTUALIZACIÓN DE PEDIDO REAL DESDE LA WEB
    // =========================================================================
    const timeZone = Session.getScriptTimeZone() || 'America/Bogota';
    const tipoEtiqueta = (data.tipo_etiqueta || 'ETN001').toString().trim().toUpperCase();
    const codigoPedido = (data.codigo_pedido || ('PED-' + Utilities.formatDate(new Date(), timeZone, 'HHmmss'))).toString().trim();
    const fechaRegistro = data.fecha_registro || Utilities.formatDate(new Date(), timeZone, 'dd/MM/yyyy, hh:mm:ss a');

    // 1. Conectar a Google Sheets y asegurar las 24 cabeceras
    let ss;
    try {
      ss = SpreadsheetApp.openById(ID_HOJA_CALCULO);
    } catch (eOpen) {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    }
    if (!ss) throw new Error("No se pudo conectar a la hoja: " + ID_HOJA_CALCULO);

    let sheet = ss.getSheetByName('Etiquetas Escolares') || ss.getSheetByName('Etiquetas_Escolares') || ss.getSheetByName('Pedidos') || ss.getSheets()[0];
    asegurarCabeceras(sheet);

    // Determinar valores de pago
    let estadoPagoTexto = '💬 WhatsApp (Coordinar)';
    let estadoColorBg = '#f1f5f9';
    let estadoColorFg = '#0f172a';
    let transaccionIdTexto = data.id_transaccion_wompi || 'N/A';

    const rawEstado = (data.estado_pago || '').toString().toUpperCase();
    if (rawEstado.indexOf('PAGADO') !== -1 || rawEstado.indexOf('APPROVED') !== -1) {
      estadoPagoTexto = '✅ PAGADO';
      estadoColorBg = '#10b981';
      estadoColorFg = '#ffffff';
    } else if (rawEstado.indexOf('PENDIENTE') !== -1 || rawEstado.indexOf('PENDING') !== -1) {
      estadoPagoTexto = '⏳ PENDIENTE BANCO';
      estadoColorBg = '#f59e0b';
      estadoColorFg = '#ffffff';
    } else if (rawEstado.indexOf('INICIANDO') !== -1 || rawEstado.indexOf('WOMPI') !== -1) {
      estadoPagoTexto = '⏳ Iniciando Wompi';
      estadoColorBg = '#e0f2fe';
      estadoColorFg = '#0369a1';
    }

    // 2. Gestionar carpeta en Google Drive para guardar Imagen y Resumen TXT
    let enlaceVistaPreviaDrive = 'Sin vista previa';
    let enlaceFotoClienteDrive = 'Sin foto propia';

    let orderFolder = null;
    try {
      let baseFolder;
      try {
        baseFolder = DriveApp.getFolderById(ID_CARPETA_DRIVE);
      } catch (err) {
        baseFolder = DriveApp.getRootFolder();
      }

      const fechaCarpeta = Utilities.formatDate(new Date(), timeZone, 'yyyy-MM-dd');
      let dateFolder;
      const dateIter = baseFolder.getFoldersByName(fechaCarpeta);
      if (dateIter.hasNext()) {
        dateFolder = dateIter.next();
      } else {
        dateFolder = baseFolder.createFolder(fechaCarpeta);
      }

      const orderIter = dateFolder.getFoldersByName(codigoPedido);
      if (orderIter.hasNext()) {
        orderFolder = orderIter.next();
      } else {
        orderFolder = dateFolder.createFolder(codigoPedido);
      }
      orderFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

      // Guardar imagen del diseño en alta resolución
      if (data.vista_previa_base64 && data.vista_previa_base64.indexOf('base64,') !== -1) {
        try {
          const parts = data.vista_previa_base64.split('base64,');
          const mimeMatch = data.vista_previa_base64.match(/data:([^;]+);/);
          const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
          const ext = (mimeType.indexOf('png') !== -1) ? 'png' : 'jpg';
          // Eliminar versión previa si existía para mantener la carpeta limpia
          const existingImg = orderFolder.getFilesByName(`${tipoEtiqueta}_Diseno.${ext}`);
          while (existingImg.hasNext()) {
            existingImg.next().setTrashed(true);
          }

          const base64Data = parts[1];
          const decodedBlob = Utilities.newBlob(
            Utilities.base64Decode(base64Data),
            mimeType,
            `${tipoEtiqueta}_Diseno.${ext}`
          );
          const file = orderFolder.createFile(decodedBlob);
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          enlaceVistaPreviaDrive = file.getUrl();
        } catch (errImg) {
          enlaceVistaPreviaDrive = 'Error guardando diseño: ' + errImg.toString();
        }
      } else {
        // Si no vino imagen en este request (ej: actualización de pago), buscar si ya existía en la carpeta
        try {
          const files = orderFolder.getFiles();
          while (files.hasNext()) {
            const f = files.next();
            if (f.getName().indexOf('_Diseno') !== -1) {
              enlaceVistaPreviaDrive = f.getUrl();
              break;
            }
          }
        } catch (eFind) {}
      }

      // Guardar foto propia si el cliente subió una
      if (data.foto_cliente_base64 && data.foto_cliente_base64.indexOf('base64,') !== -1) {
        try {
          const base64Photo = data.foto_cliente_base64.split('base64,')[1];
          const photoExt = (data.foto_cliente_nombre && data.foto_cliente_nombre.split('.').pop()) || 'png';
          const photoName = `Foto_Cliente_${codigoPedido}.${photoExt}`;

          const existingPhoto = orderFolder.getFilesByName(photoName);
          while (existingPhoto.hasNext()) {
            existingPhoto.next().setTrashed(true);
          }

          const photoBlob = Utilities.newBlob(
            Utilities.base64Decode(base64Photo),
            'image/' + photoExt,
            photoName
          );
          const photoFile = orderFolder.createFile(photoBlob);
          photoFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          enlaceFotoClienteDrive = photoFile.getUrl();
        } catch (errPhoto) {
          enlaceFotoClienteDrive = 'Error foto: ' + errPhoto.toString();
        }
      }

      // Guardar o actualizar archivo Resumen_[CODIGO].txt con la ficha completa de producción
      try {
        const itemResumen = (data.items && data.items[0]) || {};
        const txtFicha =
          `=================================================================\n` +
          `FICHA TÉCNICA DE PRODUCCIÓN — PEDIDO: ${codigoPedido}\n` +
          `FECHA DE REGISTRO: ${fechaRegistro}\n` +
          `ESTADO DEL PAGO: ${estadoPagoTexto} (Transacción: ${transaccionIdTexto})\n` +
          `TOTAL A PAGAR: ${data.total_pagar || '$0'}\n` +
          `=================================================================\n\n` +
          `DATOS DE ENVÍO Y CONTACTO:\n` +
          `- Cliente: ${data.nombre_cliente || ''}\n` +
          `- WhatsApp: ${data.whatsapp || ''}\n` +
          `- Ciudad / Dpto: ${data.ciudad || ''}, ${data.departamento || ''}\n` +
          `- Dirección: ${data.direccion || ''}\n` +
          `- Observaciones cliente: ${data.observaciones_cliente || 'Ninguna'}\n\n` +
          `DETALLES DE LA ETIQUETA / PRODUCTO:\n` +
          `- Producto: ${data.pack_principal || itemResumen.producto || ''}\n` +
          `- Cantidad de paquetes: ${data.cantidad_paquetes || 1}\n` +
          `- Texto 1 (Principal): ${data.texto_1 || data.nombre_en_etiqueta || ''}\n` +
          `- Texto 2 (Subtexto): ${data.texto_2 || ''}\n` +
          `- Texto 3 (Grado / Teléfono): ${data.texto_3 || data.grado_colegio || ''}\n` +
          `- Texto 4 (Adicional): ${data.texto_4 || ''}\n` +
          `- Color Fondo: ${data.color_fondo || ''}\n` +
          `- Color Texto: ${data.color_texto || ''}\n` +
          `- Estampado: ${data.estampado || ''}\n` +
          `- Icono: ${data.icono || ''}\n` +
          `- Tipografía: ${data.fuente || ''}\n\n` +
          `ENLACES EN DRIVE:\n` +
          `- Diseño final: ${enlaceVistaPreviaDrive}\n` +
          `- Foto del cliente: ${enlaceFotoClienteDrive}\n`;

        const existingTxt = orderFolder.getFilesByName(`Resumen_${codigoPedido}.txt`);
        while (existingTxt.hasNext()) {
          existingTxt.next().setTrashed(true);
        }
        orderFolder.createFile(`Resumen_${codigoPedido}.txt`, txtFicha, MimeType.PLAIN_TEXT);
      } catch (errTxt) {}

    } catch (errDriveGeneral) {}

    // 3. Si el pedido YA existía en la hoja (ej: pasa a PAGADO), actualizamos la fila existente
    const dataRange = sheet.getDataRange().getValues();
    let filasActualizadas = 0;

    for (let r = 1; r < dataRange.length; r++) {
      const codEnFila = (dataRange[r][1] || '').toString().trim();
      if (codEnFila === codigoPedido) {
        const rowNum = r + 1;

        // Actualizar Columna C (3): Estado de Pago
        const cellEstado = sheet.getRange(rowNum, 3);
        cellEstado.setValue(estadoPagoTexto);
        cellEstado.setBackground(estadoColorBg);
        cellEstado.setFontColor(estadoColorFg);
        cellEstado.setFontWeight('bold');

        // Actualizar Columna D (4): ID Transacción Wompi
        if (data.id_transaccion_wompi) {
          const cellId = sheet.getRange(rowNum, 4);
          cellId.setValue(data.id_transaccion_wompi);
          cellId.setFontFamily('Courier New');
        }

        // Si llegó la imagen de diseño, actualizar Columna Q (17)
        if (enlaceVistaPreviaDrive && enlaceVistaPreviaDrive.indexOf('http') === 0) {
          sheet.getRange(rowNum, 17).setValue(enlaceVistaPreviaDrive);
        }

        filasActualizadas++;
      }
    }

    if (filasActualizadas > 0) {
      SpreadsheetApp.flush();
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        accion: 'actualizado',
        codigo_pedido: codigoPedido,
        filas_actualizadas: filasActualizadas,
        nuevo_estado: estadoPagoTexto,
        transaccion: transaccionIdTexto,
        url_diseno: enlaceVistaPreviaDrive
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 4. Si es un pedido nuevo, insertamos la fila con las 24 columnas exactas
    const item = (data.items && data.items[0]) || {
      producto: data.pack_principal || 'Pack Principal',
      cantidad: data.cantidad_paquetes || 1,
      texto_1: data.texto_1 || data.nombre_en_etiqueta || '',
      texto_2: data.texto_2 || data.nombre_en_etiqueta || '',
      texto_3: data.texto_3 || data.grado_colegio || '',
      texto_4: data.texto_4 || '',
      color_fondo: data.color_fondo || '',
      color_texto: data.color_texto || '',
      estampado: data.estampado || '',
      icono: data.icono || '',
      fuente: data.fuente || '',
      observaciones: data.observaciones_cliente || ''
    };

    sheet.appendRow([
      fechaRegistro,                                // 1. Fecha
      codigoPedido,                                 // 2. Código Pedido
      estadoPagoTexto,                              // 3. Estado de Pago
      transaccionIdTexto,                           // 4. ID Transacción Wompi
      item.producto,                                // 5. Producto / Pack
      item.cantidad || 1,                           // 6. Cantidad
      item.texto_1 || item.nombre_en_etiqueta || '',// 7. Texto 1
      item.texto_2 || item.nombre_en_etiqueta || '',// 8. Texto 2
      item.texto_3 || item.grado_colegio || '',     // 9. Texto 3
      item.texto_4 || '',                           // 10. Texto 4
      item.color_fondo || '',                       // 11. Color Fondo
      item.color_texto || '',                       // 12. Color Texto
      item.estampado || '',                         // 13. Estampado
      item.icono || '',                             // 14. Icono
      item.fuente || '',                            // 15. Tipografía
      item.observaciones || data.observaciones_cliente || '', // 16. Observaciones Diseño
      enlaceVistaPreviaDrive,                       // 17. Enlace Diseño en Drive
      enlaceFotoClienteDrive,                       // 18. Enlace Foto Cliente Drive
      data.nombre_cliente,                          // 19. Cliente
      data.whatsapp,                                // 20. WhatsApp
      data.ciudad,                                  // 21. Ciudad
      data.departamento,                            // 22. Departamento
      data.direccion,                               // 23. Dirección
      data.total_pagar                              // 24. Total a Pagar
    ]);

    const newRowNum = sheet.getLastRow();

    // Formatear celda de Estado de Pago
    const cellEstado = sheet.getRange(newRowNum, 3);
    cellEstado.setBackground(estadoColorBg);
    cellEstado.setFontColor(estadoColorFg);
    cellEstado.setFontWeight('bold');

    // Formatear celda ID de Transacción
    sheet.getRange(newRowNum, 4).setFontFamily('Courier New');

    SpreadsheetApp.flush();

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      codigo_pedido: codigoPedido,
      fecha_registro: fechaRegistro,
      estado: estadoPagoTexto,
      transaccion: transaccionIdTexto,
      url_diseno: enlaceVistaPreviaDrive
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Procesa webhooks de Wompi (URL de Eventos)
 */
function procesarEventoWompi(transaction) {
  const ref = (transaction.reference || '').toString().trim();
  const status = transaction.status;
  const transId = transaction.id || '';
  const amountCOP = transaction.amount_in_cents ? (transaction.amount_in_cents / 100).toLocaleString('es-CO') : '0';

  const codigoPedido = ref.indexOf('-') !== -1 ? ref.split('-').slice(0, 2).join('-') : ref;

  let ss = SpreadsheetApp.openById(ID_HOJA_CALCULO);
  let sheet = ss.getSheets()[0];
  asegurarCabeceras(sheet);

  const dataRange = sheet.getDataRange().getValues();
  let filasActualizadas = 0;

  for (let r = 1; r < dataRange.length; r++) {
    const codEnFila = (dataRange[r][1] || '').toString().trim();
    if (codEnFila === codigoPedido || codEnFila === ref) {
      const rowNum = r + 1;
      const cellEstado = sheet.getRange(rowNum, 3); // Columna C: Estado de Pago
      const cellId = sheet.getRange(rowNum, 4);     // Columna D: ID Transacción Wompi

      if (status === 'APPROVED') {
        cellEstado.setValue('✅ PAGADO');
        cellEstado.setBackground('#10b981');
        cellEstado.setFontColor('#ffffff');
        cellEstado.setFontWeight('bold');

        cellId.setValue(transId);
        cellId.setFontFamily('Courier New');
        filasActualizadas++;
      } else if (status === 'DECLINED') {
        cellEstado.setValue('❌ RECHAZADO');
        cellEstado.setBackground('#ef4444');
        cellEstado.setFontColor('#ffffff');
      } else if (status === 'PENDING') {
        cellEstado.setValue('⏳ PENDIENTE BANCO');
        cellEstado.setBackground('#f59e0b');
        cellEstado.setFontColor('#ffffff');
      }
    }
  }

  // Notificar por correo a David si fue aprobado
  if (status === 'APPROVED') {
    try {
      MailApp.sendEmail({
        to: EMAIL_NOTIFICACION,
        subject: `🎉 ¡PAGO APROBADO WOMPI! [${codigoPedido}] - $${amountCOP} COP`,
        htmlBody: `
          <div style="font-family:Arial,sans-serif; padding:20px; border:2px solid #10b981; border-radius:12px; max-width:600px;">
            <h2 style="color:#10b981; margin-top:0;">¡Pago Confirmado por Wompi! 🎉</h2>
            <p style="font-size:16px;">La transacción ha sido aprobada exitosamente por el banco:</p>
            <ul>
              <li><strong>Código de Pedido:</strong> ${codigoPedido}</li>
              <li><strong>ID Transacción:</strong> ${transId}</li>
              <li><strong>Total Pagado:</strong> $${amountCOP} COP</li>
              <li><strong>Estado:</strong> APROBADO</li>
            </ul>
            <p>La fila de tu Google Sheet ha sido actualizada automáticamente a <strong style="color:#10b981;">✅ PAGADO</strong>.</p>
          </div>
        `
      });
    } catch (eMail) {}
  }

  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    event: 'wompi_transaction_processed',
    codigo_pedido: codigoPedido,
    filas_actualizadas: filasActualizadas
  })).setMimeType(ContentService.MimeType.JSON);
}
