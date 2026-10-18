<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Solo permitir solicitudes POST
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Método no permitido. Use POST."]);
    exit;
}

// Obtener datos (soportar JSON y Form-Data)
$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, TRUE);

if (json_last_error() === JSON_ERROR_NONE) {
    $nombres = isset($input["nombres"]) ? trim($input["nombres"]) : "";
    $apellidos = isset($input["apellidos"]) ? trim($input["apellidos"]) : "";
    $celular = isset($input["celular"]) ? trim($input["celular"]) : "";
    $email = isset($input["email"]) ? trim($input["email"]) : "";
    $tipo_documento = isset($input["tipo_documento"]) ? trim($input["tipo_documento"]) : "";
    $identificacion = isset($input["identificacion"]) ? trim($input["identificacion"]) : "";
} else {
    $nombres = isset($_POST["nombres"]) ? trim($_POST["nombres"]) : "";
    $apellidos = isset($_POST["apellidos"]) ? trim($_POST["apellidos"]) : "";
    $celular = isset($_POST["celular"]) ? trim($_POST["celular"]) : "";
    $email = isset($_POST["email"]) ? trim($_POST["email"]) : "";
    $tipo_documento = isset($_POST["tipo_documento"]) ? trim($_POST["tipo_documento"]) : "";
    $identificacion = isset($_POST["identificacion"]) ? trim($_POST["identificacion"]) : "";
}

// Validar campos requeridos
if (empty($nombres) || empty($apellidos) || empty($celular) || empty($email) || empty($tipo_documento) || empty($identificacion)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Todos los campos marcados con asterisco (*) son obligatorios."]);
    exit;
}

// Validar correo
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "El formato del correo electrónico no es válido."]);
    exit;
}

// Autodetectar protocolo y dominio para cargar las imágenes correctamente en el correo
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? "https://" : "http://";
$domain = $protocol . $_SERVER['HTTP_HOST'];

// Rutas de las plantillas HTML
$template_estudiante_path = __DIR__ . "/templates/email_estudiante.html";
$template_admin_path = __DIR__ . "/templates/email_admin.html";

// Cargar plantillas o fallback a error
if (!file_exists($template_estudiante_path) || !file_exists($template_admin_path)) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error interno: No se encontraron las plantillas de correo."]);
    exit;
}

$html_estudiante = file_get_contents($template_estudiante_path);
$html_admin = file_get_contents($template_admin_path);

// Reemplazar placeholders del Estudiante y convertir rutas relativas de imágenes en absolutas para el correo
$html_estudiante = str_replace(
    ["{{nombre}}", "../assets/"],
    [htmlspecialchars($nombres), $domain . "/tecmd/assets/"],
    $html_estudiante
);


// Reemplazar placeholders del Administrador
$fecha_registro = date("d/m/Y H:i:s");
$html_admin = str_replace(
    ["{{nombre}}", "{{apellido}}", "{{email}}", "{{celular}}", "{{tipo_documento}}", "{{identificacion}}", "{{fecha}}"],
    [htmlspecialchars($nombres), htmlspecialchars($apellidos), htmlspecialchars($email), htmlspecialchars($celular), htmlspecialchars($tipo_documento), htmlspecialchars($identificacion), $fecha_registro],
    $html_admin
);

// Configuración de destinatarios
$to_admin = "davidesign93@gmail.com";
$to_student = $email;

// Asuntos codificados en UTF-8 para evitar caracteres extraños en los gestores
$subject_admin = "=?UTF-8?B?" . base64_encode("[Nuevo Registro] - Diplomado IA: " . $nombres . " " . $apellidos) . "?=";
$subject_student = "=?UTF-8?B?" . base64_encode("¡Todo listo, " . $nombres . "! Tu 'Power Up' en IA Educativa comienza hoy") . "?=";

// Cabeceras de correo para formato HTML en UTF-8
$headers_admin = "MIME-Version: 1.0\r\n";
$headers_admin .= "Content-Type: text/html; charset=UTF-8\r\n";
$headers_admin .= "From: TEC MD Admisiones <no-reply@" . $_SERVER['HTTP_HOST'] . ">\r\n";
$headers_admin .= "Reply-To: " . $email . "\r\n";
$headers_admin .= "X-Mailer: PHP/" . phpversion() . "\r\n";

$headers_student = "MIME-Version: 1.0\r\n";
$headers_student .= "Content-Type: text/html; charset=UTF-8\r\n";
$headers_student .= "From: TEC MD Admisiones <admisiones@tecmd.edu.co>\r\n";
$headers_student .= "Reply-To: admisiones@tecmd.edu.co\r\n";
$headers_student .= "X-Mailer: PHP/" . phpversion() . "\r\n";

// Parámetro adicional para el sobre del remitente (-f) para evitar ser catalogados como spam en algunos servidores
$envelope_sender = "-fno-reply@" . $_SERVER['HTTP_HOST'];

// Enviar correos
$mail_admin_sent = mail($to_admin, $subject_admin, $html_admin, $headers_admin, $envelope_sender);
$mail_student_sent = mail($to_student, $subject_student, $html_estudiante, $headers_student, $envelope_sender);

if ($mail_admin_sent && $mail_student_sent) {
    echo json_encode(["success" => true, "message" => "Inscripción completada y correos enviados exitosamente."]);
} else if ($mail_admin_sent) {
    // Si al menos llegó al administrador para que David no pierda el contacto
    echo json_encode([
        "success" => true, 
        "message" => "Inscripción registrada en la administración. Sin embargo, hubo un problema al despachar el correo de confirmación al alumno."
    ]);
} else {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "El servidor no pudo procesar el envío de correos. Inténtelo más tarde."]);
}
?>
