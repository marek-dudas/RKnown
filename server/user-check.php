<?php 
require_once 'vendor/autoload.php';
require_once 'external/sparqllib.php';
require_once 'sesame-updater.php';

// Get $id_token via HTTPS POST.

class UserValidator {
	private $user_mail;
	
	function validateToken() {
		$client = new Google_Client(['client_id' => "756530396830-q4jskj4r11buuj41csvv0fmb62860596.apps.googleusercontent.com"]);
		
		$payload = $client->verifyIdToken($_REQUEST["token"]);
		$this->user_mail = "";
		if ($payload) {
			$userid = $payload['sub'];
			$this->user_mail = $payload['email'];
			// If request specified a G Suite domain:
			//$domain = $payload['hd'];
		} else {
			echo "---invalid id token---";
		}
		
	}
	
	function getUserMail() { return $this->user_mail; }
	
	function isQueryForValidGraph($query) {
		$this->validateToken($_REQUEST["token"]);
		
		$output_array = null;
		$graph = "";
		$matches = preg_match("/FROM\s*(<.*>)\s*WHERE/i", $query, $output_array);
		
		if($matches === 1) {
			if($output_array != null && count($output_array) == 2) {
				$graph = $output_array[1];
				return $this->userOwnsGraph($graph);
			}
			else return false;
		}
		else {
			//TODO !!!!!!!!! neeed to have valid query patterns list here !!!!!!!!!!!
			return true;
		}
				
	}
	
	//note: bad naming, it now determines whether user has read access to the graph
	function userOwnsGraph($graph) {
		global $users_endpoint;
		$db = sparql_connect( $users_endpoint );
		if( !$db ) { print sparql_errno() . ": " . sparql_error(). "\n"; exit; }
		
		sparql_ns( "dcterms","http://purl.org/dc/terms/" );		
		sparql_ns ( "rknown", "http://rknown.com/");
		
		$sparql = "SELECT * WHERE { ".
				  "{ $graph dcterms:creator \"".($this->user_mail)."\" . } ".
				  "UNION { $graph rknown:viewer \"".($this->user_mail)."\" . } } LIMIT 5";
		$result = sparql_query( $sparql );
		if( !$result ) { print sparql_errno() . ": " . sparql_error(). "\n"; exit; }
		
		$fields = sparql_field_array( $result );
		
		if(sparql_num_rows( $result )>=1) return true;
		else {
			echo "access check query was: $sparql";
			return false;
		}
	}
	
	function graphExists($graph) {
		global $users_endpoint;
		$db = sparql_connect( $users_endpoint );
		if( !$db ) { print sparql_errno() . ": " . sparql_error(). "\n"; exit; }
		
		sparql_ns( "dcterms","http://purl.org/dc/terms/" );
				
		$sparql = "SELECT * WHERE { $graph dcterms:creator ?someOne . } LIMIT 5";
		$result = sparql_query( $sparql );
		if( !$result ) { print sparql_errno() . ": " . sparql_error(). "\n"; exit; }
		
		if(sparql_num_rows( $result )>0) return true;
		else return false;
	}
	
	function getGraphUuid($graph) {
		global $users_endpoint;
		$db = sparql_connect( $users_endpoint );
		if( !$db ) { print sparql_errno() . ": " . sparql_error(). "\n"; exit; }
		
		sparql_ns ( "rknown", "http://rknown.com/");
		
		$sparql = "SELECT * WHERE { $graph rknown:graph-id ?graphid . }";
		$result = sparql_query( $sparql );
		if( !$result ) { print sparql_errno() . ": " . sparql_error(). "\n" . "query was: $sparql"; exit; }
		
		/*
		$fields = sparql_field_array( $result );
		print "<p>Number of rows: ".sparql_num_rows( $result )." results.</p>";
		print "<table class='example_table'>";
		print "<tr>";
		foreach( $fields as $field )
		{
			print "<th>$field</th>";
		}
		print "</tr>";
		while( $row = sparql_fetch_array( $result ) )
		{
			print "<tr>";
			foreach( $fields as $field )
			{
				print "<td>$row[$field]</td>";
			}
			print "</tr>";
		}
		print "</table>";*/
		
		
		$bindings = sparql_fetch_array( $result );
		if( !$bindings ) echo "Error retrieving graphid";
		else return $bindings["graphid"];
	}
	
	function recordGraphForUser($graph) {
		global $user_update_endpoint;
		$recordGraphQuery = "INSERT { $graph <http://purl.org/dc/terms/creator> \"".($this->user_mail)."\" . ".
							" $graph <http://rknown.com/graph-id> ?uuid . } ".
							"WHERE { BIND(UUID() AS ?uuid) }";
		sesameSendUpdate($recordGraphQuery, $user_update_endpoint);
	}
	
	function isOperationForValidGraph($query) {
		$this->validateToken($_REQUEST["token"]);
		$output_array = null;
		$graph = "";
		$matches = preg_match("/GRAPH\s*(<.*>)/i", $query, $output_array);
		
		if($output_array != null && count($output_array) == 2) {
			$graph = $output_array[1];
		}
		else return false;
		
		if(preg_match("/^CLEAR/i", $query)===1) {
			if($this->graphExists($graph)) {
				return $this->userOwnsGraph($graph);
			}
			else return true;		
		}
		
		else if(preg_match("/^LOAD/i", $query)===1) {
			if($this->graphExists($graph)) {
				return $this->userOwnsGraph($graph);
			}
			else {
				$this->recordGraphForUser($graph);
				return true;
			}
		}
	}
}



?>