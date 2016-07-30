<?php 

$query = $_REQUEST["query"];

$ch = curl_init();
if($ch === FALSE) {
	echo "Failed to initialize curl";
	die;
}

$ch = curl_init();
curl_setopt($ch,CURLOPT_URL,"http://localhost:8080/openrdf-sesame/repositories/rknown/statements");
curl_setopt($ch,CURLOPT_RETURNTRANSFER,true);
curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/x-www-form-urlencoded'));
curl_setopt($ch, CURLOPT_POST, TRUE);
curl_setopt($ch, CURLOPT_POSTFIELDS, "update=$query");

$output=curl_exec($ch);
curl_close($ch);
echo $output;

?>