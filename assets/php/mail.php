<?php
/**
 * NMFT STUDIO — mail.php
 * Recibe los datos del formulario de contacto (fetch desde index.html)
 * y envía un email real a hola@nmft.ar usando la función nativa mail()
 * de PHP, disponible en cualquier hosting cPanel.
 *
 * Ubicación: public_html/assets/php/mail.php
 * (el front-end lo llama vía fetch('/assets/php/mail.php')).
 *
 * Protección anti-spam: honeypot ("website") + límite de envíos por IP.
 * Los datos de control de envíos se guardan en assets/php/data/, carpeta
 * bloqueada por completo vía .htaccess.
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

// ---- Honeypot: campo "website" invisible para personas ----
// Los bots que auto-completan formularios suelen llenar todos los
// inputs, incluido este, que un visitante real nunca ve ni toca.
// Si viene con contenido, respondemos "ok" (para no delatar el
// mecanismo al bot) pero no enviamos ningún email.
$honeypot = clean_line($input['website'] ?? '');
if ($honeypot !== '') {
    echo json_encode(['ok' => true]);
    exit;
}

// ---- Límite de envíos por IP ----
// Evita que un mismo origen inunde el formulario: mínimo 20 segundos
// entre envíos y máximo 8 envíos por IP por día. Si la carpeta de datos
// no está disponible o no se puede escribir, no bloqueamos el envío
// (preferimos no perder una consulta real a un cliente por un problema
// de permisos del hosting).
function check_rate_limit() {
    $dataDir = __DIR__ . '/data';
    if (!is_dir($dataDir) || !is_writable($dataDir)) {
        return ['ok' => true];
    }

    $ip   = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $file = $dataDir . '/rl_' . hash('sha256', $ip) . '.json';

    $fp = @fopen($file, 'c+');
    if ($fp === false) {
        return ['ok' => true];
    }

    flock($fp, LOCK_EX);
    $contents = stream_get_contents($fp);
    $data = json_decode($contents, true);
    if (!is_array($data)) {
        $data = ['last' => 0, 'day' => date('Y-m-d'), 'count' => 0];
    }

    $now = time();
    $today = date('Y-m-d');

    // Reinicia el contador diario si cambió el día.
    if ($data['day'] !== $today) {
        $data['day'] = $today;
        $data['count'] = 0;
    }

    $result = ['ok' => true];

    if ($now - (int) $data['last'] < 20) {
        $result = ['ok' => false, 'error' => 'Ya recibimos tu consulta. Esperá unos segundos antes de volver a enviar.'];
    } elseif ((int) $data['count'] >= 8) {
        $result = ['ok' => false, 'error' => 'Alcanzaste el límite de envíos por hoy. Escribinos directamente por WhatsApp.'];
    } else {
        $data['last'] = $now;
        $data['count'] = (int) $data['count'] + 1;
    }

    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode($data));
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);

    return $result;
}

$rateLimit = check_rate_limit();
if (!$rateLimit['ok']) {
    http_response_code(429);
    echo json_encode(['ok' => false, 'error' => $rateLimit['error']]);
    exit;
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
