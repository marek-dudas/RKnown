<?php

require_once('connection-settings.php');
require_once 'user-check.php';
require_once('sesame-updater.php');
/*require_once 'vendor/autoload.php';

// Get $id_token via HTTPS POST.

$client = new Google_Client(['client_id' => "756530396830-q4jskj4r11buuj41csvv0fmb62860596.apps.googleusercontent.com"]);

$payload = $client->verifyIdToken($_REQUEST["token"]);
$user_mail = "";
if ($payload) {
  $userid = $payload['sub'];
  $user_mail = $payload['email'];
  // If request specified a G Suite domain:
  //$domain = $payload['hd'];
} else {
  echo "---invalid id token---";
}*/

$query = $_REQUEST["query"];

$validator = new UserValidator();
if(! $validator->isOperationForValidGraph($query) ) {
	header('HTTP/1.1 500 Internal Server Error', true, 500);
	die("Unauthorized access");
}
else sesameSendUpdate($query, $sparql_update_endpoint);


?>