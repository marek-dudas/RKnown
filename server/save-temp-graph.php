<?php
	$purom_filename = $_REQUEST["filename"];
	$purom_file = fopen($purom_filename, "w");
	
	$rdfInput = file_get_contents('php://input');
	
	fwrite($purom_file, $rdfInput);
	
	fclose($purom_file);
	
	echo "done";
?>