<?php
ini_set('display_startup_errors', 1);
ini_set('display_errors', 1);
error_reporting(-1);

	$purom_filename = $_REQUEST["filename"];
	$purom_file = fopen("graphs/".$purom_filename, "w");
	
	$rdfInput = file_get_contents('php://input');
	
	fwrite($purom_file, $rdfInput);
	
	fclose($purom_file);
	
	echo "done";
?>