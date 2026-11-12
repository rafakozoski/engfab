<?php
// Formulário de orçamento da home ENGFAB. Envia para o e-mail da ENGFAB com o anexo (até 2 MB).
header('Content-Type: application/json; charset=utf-8');

$destino   = 'teste@engfab.com.br'; // TESTE TEMPORÁRIO: voltar para contato@engfab.com.br depois do teste
$remetente = 'site@engfab.com.br'; // remetente do mesmo domínio do servidor, para o e-mail não cair no spam

function responder($ok, $msg, $code = 200) {
    http_response_code($code);
    echo json_encode(['ok' => $ok, 'msg' => $msg]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') responder(false, 'Método inválido.', 405);

// campo escondido contra robôs
if (!empty($_POST['site'])) responder(true, 'Recebido.');

function campo($nome, $max = 200) {
    $v = trim((string)($_POST[$nome] ?? ''));
    $v = str_replace(["\r", "\n"], ' ', $v);
    return mb_substr($v, 0, $max);
}

$nome     = campo('nome');
$email    = campo('email');
$telefone = campo('telefone', 40);
$cidade   = campo('cidade', 120);
$origem   = campo('origem', 80);
$mensagem = mb_substr(trim((string)($_POST['mensagem'] ?? '')), 0, 5000);

if ($nome === '' || $telefone === '' || $cidade === '' || $origem === '' || $mensagem === '') {
    responder(false, 'Preencha todos os campos obrigatórios.', 422);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) responder(false, 'Confira o e-mail informado.', 422);

$corpo  = "Novo pedido de orçamento pelo site\n\n";
$corpo .= "Nome: $nome\nE-mail: $email\nTelefone: $telefone\nCidade: $cidade\nComo nos encontrou: $origem\n\n";
$corpo .= "Mensagem:\n$mensagem\n";

$assunto = '=?UTF-8?B?' . base64_encode("Orçamento pelo site | $nome") . '?=';
$limite  = md5(uniqid('', true));
$headers  = "From: ENGFAB Site <$remetente>\r\n";
$headers .= "Reply-To: $email\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: multipart/mixed; boundary=\"$limite\"\r\n";

$msg  = "--$limite\r\n";
$msg .= "Content-Type: text/plain; charset=UTF-8\r\n";
$msg .= "Content-Transfer-Encoding: base64\r\n\r\n";
$msg .= chunk_split(base64_encode($corpo)) . "\r\n";

if (!empty($_FILES['anexo']['name']) && $_FILES['anexo']['error'] !== UPLOAD_ERR_NO_FILE) {
    $arq = $_FILES['anexo'];
    if ($arq['error'] !== UPLOAD_ERR_OK) responder(false, 'Não foi possível receber o anexo.', 422);
    if ($arq['size'] > 2 * 1024 * 1024) responder(false, 'O anexo passa de 2 MB.', 422);
    $permitidos = ['pdf','jpg','jpeg','png','webp','heic','dwg','dxf','step','stp','igs','iges','zip','doc','docx','xls','xlsx'];
    $ext = strtolower(pathinfo($arq['name'], PATHINFO_EXTENSION));
    if (!in_array($ext, $permitidos, true)) responder(false, 'Tipo de arquivo não aceito.', 422);
    $nomeArq = preg_replace('/[^A-Za-z0-9._-]/', '_', basename($arq['name']));
    $msg .= "--$limite\r\n";
    $msg .= "Content-Type: application/octet-stream; name=\"$nomeArq\"\r\n";
    $msg .= "Content-Transfer-Encoding: base64\r\n";
    $msg .= "Content-Disposition: attachment; filename=\"$nomeArq\"\r\n\r\n";
    $msg .= chunk_split(base64_encode(file_get_contents($arq['tmp_name']))) . "\r\n";
}
$msg .= "--$limite--";

if (mail($destino, $assunto, $msg, $headers, "-f$remetente")) {
    responder(true, 'Mensagem enviada. Retornamos em breve.');
}
responder(false, 'Não conseguimos enviar agora. Chame no WhatsApp ou ligue (41) 3056-7005.', 500);
