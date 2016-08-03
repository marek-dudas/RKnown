var SparqlFace = {
		config: function(objectSuggestCallback, predicateSuggestCallback) {
			this.objectSuggestionCallback = objectSuggestCallback;
			this.predicateSuggestionCallback= predicateSuggestCallback;
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
		processObjectSuggestions: function(json) {
			var results = this.getAllBindings(json, "a");
			this.objectSuggestionCallback(results);
		},
		processPredicateSuggestions: function(json) {
			var results = this.getAllBindings(json, "a");
			this.predicateSuggestionCallback(results);			
		},
		getAllBindings: function(json, placeholder) {
			var results = [];
			for(var j=0; j<json.results.bindings.length; j++) {
				var binding = json.results.bindings[j];
				results.push(binding["a"].value);
			}			
			return results;
		},
		textSearch: function(text) {
			var searchQuery = "SELECT ?a WHERE { {?a ?b ?c} UNION {?x ?y ?a} FILTER(contains(?a, \" "+text+"\")) }";
			
			var query = this.queryService.createQuery();
			query.query(searchQuery, {failure: function(){alert("Search failed - query failure")}, 
				success: this.processTextSearch.bind(this)});
		},
		getAllEntities: function() {
			var searchQuery = "SELECT DISTINCT ?a WHERE { {?a ?b ?c} UNION {?x ?y ?a} FILTER(!isLiteral(?a))}";
			
			var query = this.queryService.createQuery();
			query.query(searchQuery, {failure: function(){alert("Getting entity list failed - query failure")}, 
				success: this.processObjectSuggestions.bind(this)});
		},
		getAllPredicates: function() {
			var searchQuery = "SELECT DISTINCT ?a WHERE { {?b ?a ?c} UNION {?x ?a ?y} }";
			
			var query = this.queryService.createQuery();
			query.query(searchQuery, {failure: function(){alert("Getting entity list failed - query failure")}, 
				success: this.processPredicateSuggestions.bind(this)});
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