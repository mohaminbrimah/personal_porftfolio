<?php
/**
 * contact.php — Receives POST data from the contact form, validates it,
 * sends email via Formspree (free) or PHP mail(), then redirects back to
 * index.html#contact with ?status=success or ?status=error
 */

require_once __DIR__ . '/config.php'; // Load CONTACT_EMAIL and FORMSPREE_ENDPOINT

/** Redirect browser back to contact section with success/error flag in URL */
function redirect_with_status(string $status): void
{
    header('Location: index.html#contact?status=' . urlencode($status)); // script.js reads ?status=
    exit; // Stop PHP after redirect
}

/** Remove HTML tags and extra whitespace from user input (basic security) */
function clean_field(string $value): string
{
    return trim(strip_tags($value));
}

/** Return true if email format is valid */
function is_valid_email(string $email): bool
{
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/** Send email using PHP built-in mail() — works on many shared hosts */
function send_via_mail(string $to, string $name, string $email, string $subject, string $message, string $phone): bool
{
    $safeSubject = 'Portfolio contact: ' . $subject; // Email subject line
    $body = "Name: {$name}\nEmail: {$email}\nPhone: {$phone}\n\nMessage:\n{$message}"; // Plain-text body
    $headers = "From: Portfolio <noreply@" . ($_SERVER['HTTP_HOST'] ?? 'localhost') . ">\r\n"; // Sender header
    $headers .= "Reply-To: {$name} <{$email}>\r\n"; // Reply goes to visitor's email
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

    return mail($to, $safeSubject, $body, $headers); // true = sent successfully
}

/** Send to Formspree free API using cURL (no mail server needed) */
function send_via_formspree(string $endpoint, array $payload): bool
{
    if (!function_exists('curl_init')) {
        return false; // cURL not available on this server
    }

    $ch = curl_init($endpoint); // Start HTTP request to Formspree
    curl_setopt_array($ch, [
        CURLOPT_POST => true, // POST method
        CURLOPT_POSTFIELDS => http_build_query($payload), // Form fields as query string
        CURLOPT_RETURNTRANSFER => true, // Return response as string
        CURLOPT_HTTPHEADER => ['Accept: application/json'],
        CURLOPT_TIMEOUT => 15, // Max 15 seconds wait
    ]);

    $response = curl_exec($ch); // Execute request
    $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE); // HTTP status (200 = OK)
    curl_close($ch);

    return $response !== false && $httpCode >= 200 && $httpCode < 300; // Success if 2xx
}

// Only accept POST requests (form submit), not direct browser visits
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    redirect_with_status('invalid');
}

// Read and clean each form field (names must match index.html input name="...")
$name = clean_field($_POST['name'] ?? '');
$email = clean_field($_POST['email'] ?? '');
$phone = clean_field($_POST['phone'] ?? '');
$subject = clean_field($_POST['subject'] ?? 'New message');
$message = clean_field($_POST['message'] ?? '');

// Reject if required fields missing or email invalid
if ($name === '' || $email === '' || $message === '' || !is_valid_email($email)) {
    redirect_with_status('error');
}

$sent = false; // Track whether any send method succeeded

// Method 1: Formspree (recommended on free hosting)
if (defined('FORMSPREE_ENDPOINT') && FORMSPREE_ENDPOINT !== '') {
    $sent = send_via_formspree(FORMSPREE_ENDPOINT, [
        'name' => $name,
        'email' => $email,
        'phone' => $phone,
        'subject' => $subject,
        'message' => $message,
        '_replyto' => $email, // Formspree uses this for Reply-To
    ]);
}

// Method 2: PHP mail() if Formspree not configured and real email is set
if (!$sent && defined('CONTACT_EMAIL') && CONTACT_EMAIL !== '' && CONTACT_EMAIL !== 'mohammed.brimah@example.com') {
    $sent = send_via_mail(CONTACT_EMAIL, $name, $email, $subject, $message, $phone);
}

if ($sent) {
    redirect_with_status('success'); // User sees green message on index.html
}

redirect_with_status('error'); // Something failed — user sees red message
