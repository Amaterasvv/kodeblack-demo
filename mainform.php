<?php
// mainform.php — obrada 4 forme (kontakt, dojam, mini, newsletter)

// ===== BASIC GUARDRAILS =====
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); exit('Method not allowed'); }

// Anti-spam: honeypot (skriveno polje name="company")
if (!empty($_POST['company'] ?? '')) { exit('OK'); }

// Anti-spam: minimalni delay od 3s ako ima timestamp (name="ts")
if (!empty($_POST['ts'])) {
  $delta = time() - (int)$_POST['ts'];
  if ($delta < 3) { http_response_code(429); exit('Too fast'); }
}

// ===== CONFIG =====
$domain     = 'kodeblackhr.com';           // <-- promijeni
$toEmail    = 'info@kodeblackhr.com';      // <-- promijeni (primatelj)
$siteName   = 'Kode Black';                  // <-- promijeni (naziv sajta)
$fromEmail  = 'no-reply@' . $domain;         // envelope sender zbog SPF/DMARC

// ===== HELPERS =====
function ok_json($msg){ header('Content-Type: application/json'); echo json_encode(['status'=>'ok','message'=>$msg]); exit; }
function err($code,$msg){ http_response_code($code); exit($msg); }
function s($v){ return htmlspecialchars((string)$v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
function normEmail($e){ return filter_var(trim($e), FILTER_VALIDATE_EMAIL) ?: ''; }
function send_mail($to, $subject, $textBody, $htmlBody, $fromAddress, $fromName='',$replyEmail=''){
  $boundary = '=_kb_' . bin2hex(random_bytes(12));

  // --- Headers ---
  $headers   = [];
  $fromName  = $fromName ? trim($fromName) : $fromAddress;
  // siguran From format
  $headers[] = 'From: ' . sprintf('"%s" <%s>', addslashes($fromName), $fromAddress);
  if ($replyEmail) $headers[] = "Reply-To: {$replyEmail}";
  $headers[] = "MIME-Version: 1.0";
  $headers[] = "Content-Type: multipart/alternative; boundary=\"{$boundary}\"";
  // opcionalno: dodatni “good citizen” headeri
  $headers[] = "X-Mailer: PHP/" . phpversion();
  $headers[] = "Date: " . date('r');
  $headers[] = "Message-ID: <" . bin2hex(random_bytes(12)) . "@{$GLOBALS['domain']}>";

  // --- Body ---
  $body  = "--{$boundary}\r\n";
  $body .= "Content-Type: text/plain; charset=UTF-8\r\n\r\n{$textBody}\r\n\r\n";
  $body .= "--{$boundary}\r\n";
  $body .= "Content-Type: text/html; charset=UTF-8\r\n\r\n{$htmlBody}\r\n\r\n";
  $body .= "--{$boundary}--\r\n";

  // -f MORA biti gola adresa (Return-Path)
  return @mail($to, $subject, $body, implode("\r\n", $headers), "-f {$fromAddress}");
}


// ===== ROUTING =====
$form = trim($_POST['form'] ?? ''); // očekujemo: kontakt, dojam, mini, newsletter
if ($form === '') {
  // Ako netko zaboravi dodati form=kontakt, pokušaj prepoznati po poljima
  if (isset($_POST['djelatnost']) && isset($_POST['usluga'])) $form = 'kontakt';
}

// ===== HANDLE: KONTAKT =====
if ($form === 'kontakt') {
  $ime      = trim($_POST['ime'] ?? '');
  $prezime  = trim($_POST['prezime'] ?? '');
  $fullName = trim($ime . ' ' . $prezime);
  $email    = normEmail($_POST['email'] ?? '');
  $telefon  = trim($_POST['telefon'] ?? '');
  $djelat   = trim($_POST['djelatnost'] ?? '');
  $firma    = trim($_POST['firma'] ?? '');          // "da"/"ne"
  $paket    = trim($_POST['usluga'] ?? '');
  $dodatne  = $_POST['dodatne'] ?? [];              // array
  $budzet   = trim($_POST['budzet'] ?? '');
  $poruka   = trim($_POST['poruka'] ?? '');

  if ($fullName === '' || !$email || $poruka === '') err(422, 'Molimo ispunite ime, valjan e-mail i poruku.');

  $dodTxt = '';
  if (is_array($dodatne) && count($dodatne)) $dodTxt = implode(', ', array_map('s', $dodatne));

  $subject = "📩 [$siteName] Kontakt upit — $fullName";
  $text    = "Novi kontakt upit s weba: $siteName\n\n"
           . "Ime i prezime: $fullName\nE-mail: $email\nTelefon: $telefon\n"
           . "Djelatnost: $djelat\nRegistrirana firma: $firma\nPaket: $paket\n"
           . "Dodatne usluge: $dodTxt\nBudžet: € $budzet\n\nPoruka:\n$poruka\n";
  $html    = "<h2>Novi kontakt upit s weba: ".s($siteName)."</h2>"
           . "<p><strong>Ime i prezime:</strong> ".s($fullName)."</p>"
           . "<p><strong>E-mail:</strong> ".s($email)."</p>"
           . ($telefon ? "<p><strong>Telefon:</strong> ".s($telefon)."</p>" : "")
           . "<p><strong>Djelatnost:</strong> ".s($djelat)."</p>"
           . "<p><strong>Registrirana firma:</strong> ".s($firma)."</p>"
           . "<p><strong>Paket:</strong> ".s($paket)."</p>"
           . ($dodTxt ? "<p><strong>Dodatne usluge:</strong> ".s($dodTxt)."</p>" : "")
           . ($budzet ? "<p><strong>Budžet:</strong> € ".s($budzet)."</p>" : "")
           . "<p style='white-space:pre-wrap'><strong>Poruka:</strong><br>".s($poruka)."</p>";

$ok = send_mail(
  $toEmail,
  $subject,
  $text,
  $html,
  'no-reply@' . $domain, // FROM address (envelope i header)
  $siteName,             // FROM name
  $email                 // Reply-To (korisnik)
);
  if ($ok) ok_json('Hvala! Vaša poruka je poslana. Odgovorit ćemo u najkraćem roku.');
  err(500, 'Došlo je do greške pri slanju. Pokušajte kasnije.');
}

// ===== HANDLE: DOJAM =====
if ($form === 'dojam') {
  $ime    = trim($_POST['ime'] ?? '');
  $dojam  = trim($_POST['dojam'] ?? '');
  $rating = trim($_POST['rating'] ?? '');

  if ($dojam === '' || $rating === '') err(422, 'Molimo napišite dojam i odaberite ocjenu.');

  $subject = "⭐ [$siteName] Novi dojam (ocjena: $rating)";
  $text    = "Novi dojam s weba: $siteName\n\nIme: $ime\nOcjena: $rating/5\n\nDojam:\n$dojam\n";
  $html    = "<h2>Novi dojam s weba: ".s($siteName)."</h2>"
           . ($ime ? "<p><strong>Ime:</strong> ".s($ime)."</p>" : "")
           . "<p><strong>Ocjena:</strong> ".s($rating)."/5</p>"
           . "<p style='white-space:pre-wrap'><strong>Dojam:</strong><br>".s($dojam)."</p>";

  $ok = send_mail($toEmail, $subject, $text, $html, "{$siteName} <{$fromEmail}>");
  if ($ok) ok_json('Hvala na dojmu! Puno nam znači.');
  err(500, 'Greška pri slanju dojma. Pokušajte kasnije.');
}

// ===== HANDLE: MINI =====
if ($form === 'mini') {
  $ime     = trim($_POST['ime'] ?? '');
  $email   = normEmail($_POST['email'] ?? '');
  $pitanje = trim($_POST['pitanje'] ?? '');

  if ($ime === '' || !$email || $pitanje === '') err(422, 'Molimo ispunite ime, valjan e-mail i pitanje.');

  $subject = "❓ [$siteName] Mini upit — $ime";
  $text    = "Mini upit s weba: $siteName\n\nIme: $ime\nE-mail: $email\n\nPitanje:\n$pitanje\n";
  $html    = "<h2>Mini upit s weba: ".s($siteName)."</h2>"
           . "<p><strong>Ime:</strong> ".s($ime)."</p>"
           . "<p><strong>E-mail:</strong> ".s($email)."</p>"
           . "<p style='white-space:pre-wrap'><strong>Pitanje:</strong><br>".s($pitanje)."</p>";

  $ok = send_mail($toEmail, $subject, $text, $html, "{$siteName} <{$fromEmail}>", $email);
  if ($ok) ok_json('Poruka je poslana. Hvala vam!');
  err(500, 'Greška pri slanju poruke. Pokušajte kasnije.');
}

// ===== HANDLE: NEWSLETTER =====
if ($form === 'newsletter') {
  $email   = normEmail($_POST['email'] ?? '');
  $consent = !empty($_POST['consent']);
  if (!$email || !$consent) err(422, 'Molimo unesite valjan e-mail i potvrdite privolu.');

  $subject = "📰 [$siteName] Nova newsletter prijava";
  $text    = "Nova newsletter prijava\n\nE-mail: $email\nPrivola: DA\n";
  $html    = "<h2>Nova newsletter prijava</h2>"
           . "<p><strong>E-mail:</strong> ".s($email)."</p>"
           . "<p><strong>Privola:</strong> DA</p>";

  $ok = send_mail($toEmail, $subject, $text, $html, "{$siteName} <{$fromEmail}>", $email);
  if ($ok) ok_json('Hvala! Uspješno ste pretplaćeni.');
  err(500, 'Greška pri prijavi. Pokušajte kasnije.');
}

err(400, 'Nepoznata forma ili krivi podaci.');
