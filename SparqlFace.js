var SparqlFace = {
		config: function(config) {
			this.config = config;
			this.queryService = Object.create(SPARQL);
			this.queryService.Service(RSettings.sparqlProxy, RSettings.sparqlEndpoint);
			this.queryService.setMethod('GET');
			this.updateService = Object.create(SPARQL);
			this.updateService.Service(RSettings.sparqlUpdateProxy, RSettings.sparqlUpdateEndpoint);
			this.updateService.setMethod('POST');
		},
		saveTriple: function(triple) {
			
		},
		nameFromUri: function(uri) {
			return uri.match("[^\/#]+$");
		},
		saveGraph: function(triplesInString) {			
			
			$.ajax("server/save-temp-graph.php"+"?filename=test.ttl", {
			    data : triplesInString,
			    contentType : 'text/plain',
			    type : 'POST',
			    success: this.clearThenLoad.bind(this)
			});
			
		},
		clearThenLoad: function() {
			var updateQuery = "CLEAR GRAPH <http://test>";
			
			$.get("server/sesame-proxy.php?query="+encodeURIComponent(updateQuery), null, this.runLoadQuery.bind(this));
				
			/*
			var query = this.updateService.createQuery();
			query.query(updateQuery, {failure: function(){alert("Saving graph failed - query failure")}, 
				success: this.runLoadQuery.bind(this)});*/
		},
		runLoadQuery: function() {
			var query = this.updateService.createQuery();	
			var updateQuery = "LOAD <http://localhost/rknown/server/test.ttl> INTO GRAPH <http://test>"
				
			$.get("server/sesame-proxy.php?query="+encodeURIComponent(updateQuery));
				
			/*query.query(updateQuery, {failure: function(){alert("Saving graph failed - query failure")}, 
				success: function(json) {
					alert("Graph saved successfully")
				}});*/
			
		}
}