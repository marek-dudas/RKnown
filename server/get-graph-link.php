<?php 

require_once 'user-check.php';

$graph = $_REQUEST['graph'];

$validator = new UserValidator();
$validator->validateToken();
if(! $validator->userOwnsGraph($graph) ) {
	header('HTTP/1.1 500 Internal Server Error', true, 500);
	die("Unauthorized access");
}
else {
	$graph_uri_only = preg_replace("/[<>]/", "", $graph);
	echo $app_location."?graphid=".($validator->getGraphUuid($graph))."&graphurl=".$graph_uri_only;
}

?>