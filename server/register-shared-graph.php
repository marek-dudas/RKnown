<?php 
require_once 'user-check.php';

$graphid = $_REQUEST['graphid'];

$validator = new UserValidator();
$validator->validateToken();

	$query = "INSERT {?graph <http://rknown.com/viewer> \"".($validator->getUserMail())."\" .} WHERE {".
			"?graph <http://rknown.com/graph-id> <$graphid> .}";
	sesameSendUpdate($query, $user_update_endpoint);



?>