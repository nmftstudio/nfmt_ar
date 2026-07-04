<?php
/**
 * NMFT STUDIO — mail.php
 * Recibe los datos del formulario de contacto (fetch desde index.html)
 * y envía un email real a hola@nmft.ar usando la función nativa mail()
 * de PHP, disponible en cualquier hosting cPanel.
 *
 * Subir a la raíz de public_html/ (mismo nivel que index.html).
 */

header('Content-Type: application/json; charset=utf-8');

// ---- Solo aceptamos POST ----
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Método no permitido.']);
    exit;
}

// ---- Leemos el body: soporta JSON (fetch) o form-data clásico ----
$raw  = file_get_contents('php://input');
$json = json_decode($raw, true);
$input = is_array($json) ? $json : $_POST;

/**
 * Limpia un valor de una sola línea (evita inyección de cabeceras
 * de email vía \r\n en campos como nombre o email).
 */
function clean_line($str) {
    $str = (string) $str;
    $str = str_replace(["\r", "\n"], '', $str);
    return trim($str);
}

$name        = clean_line($input['name'] ?? '');
$email       = clean_line($input['email'] ?? '');
$projectType = clean_line($input['projectType'] ?? 'No especificado');
$msg         = trim((string) ($input['msg'] ?? ''));

// ---- Validaciones ----
$errores = [];
if ($name === '') {
    $errores[] = 'nombre';
}
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errores[] = 'email';
}
if ($msg === '') {
    $errores[] = 'mensaje';
}

if (!empty($errores)) {
    http_response_code(422);
    echo json_encode([
        'ok'    => false,
        'error' => 'Revisá estos campos antes de enviar: ' . implode(', ', $errores) . '.'
    ]);
    exit;
}

// ---- Destino ----
$to      = 'hola@nmft.ar';
$subject = 'Nueva consulta desde nmft.ar — ' . $name;

// ---- Cuerpo del mensaje ----
$body  = "Nueva consulta recibida desde el formulario de contacto de nmft.ar\n\n";
$body .= "Nombre: {$name}\n";
$body .= "Email: {$email}\n";
$body .= "Tipo de proyecto: {$projectType}\n\n";
$body .= "Mensaje:\n{$msg}\n\n";
$body .= "---\n";
$body .= "Enviado el " . date('d/m/Y H:i') . " desde nmft.ar\n";

// ---- Cabeceras anti-spam básicas ----
// El From usa un dominio propio (evita que muchos filtros marquen el
// correo como spoof) y el Reply-To apunta al visitante, para poder
// responderle directamente tocando "Responder".
$headers   = [];
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-Type: text/plain; charset=UTF-8';
$headers[] = 'From: NMFT STUDIO <no-reply@nmft.ar>';
$headers[] = 'Reply-To: ' . $email;
$headers[] = 'X-Mailer: PHP/' . phpversion();

$enviado = @mail($to, $subject, $body, implode("\r\n", $headers));

if ($enviado) {
    echo json_encode(['ok' => true]);
} else {
    http_response_code(500);
    echo json_encode([
        'ok'    => false,
        'error' => 'No pudimos enviar el email en este momento. Probá de nuevo más tarde o escribinos por WhatsApp.'
    ]);
}
