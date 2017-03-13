<?php 

require_once('connection-settings.php');

function sesameSendUpdate($query, $endpoint) {
	
	$ch = curl_init();
	if($ch === FALSE) {
		echo "Failed to initialize curl";
		die;
	}
	
	$ch = curl_init();
	curl_setopt($ch,CURLOPT_URL,$endpoint);
	curl_setopt($ch,CURLOPT_RETURNTRANSFER,true);
	curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/x-www-form-urlencoded'));
	curl_setopt($ch, CURLOPT_POST, TRUE);
	curl_setopt($ch, CURLOPT_POSTFIELDS, "update=$query");
	
	$output=curl_exec($ch);
	curl_close($ch);
	echo $output;
	echo "sesame update success <br>";
	echo "query was: $query";
}

?>