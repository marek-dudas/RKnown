var SparqlFace = {
		config: function(objectSuggestCallback, predicateSuggestCallback, relatedCallback) {
			this.objectSuggestionCallback = objectSuggestCallback;
			this.predicateSuggestionCallback= predicateSuggestCallback;
			this.relatedCallback = relatedCallback;
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
		processRelatedNodes: function(json) {
			var results = this.getAllBindings(json, "a");
			this.relatedCallback(results);			
		},
		getAllBindings: function(json, placeholder) {
			var results = [];
			for(var j=0; j<json.results.bindings.length; j++) {
				var binding = json.results.bindings[j];
				results.push(binding[placeholder].value);
			}			
			return results;
		},
		textSearch: function(text) {
			var searchQuery = "SELECT ?a WHERE { {?a ?b ?c} UNION {?x ?y ?a} FILTER(contains(?a, \" "+text+"\")) }";
			
			var query = this.queryService.createQuery();
			query.query(searchQuery, {failure: function(){alert("Search failed - query failure")}, 
				success: this.processTextSearch.bind(this)});
		},
		runQuery: function(searchQuery, failureMessage, successCallback) {			
			var query = this.queryService.createQuery();
			query.query(searchQuery, {failure: function(){alert(failureMessage)}, 
				success: successCallback});			
		},
		getAllEntities: function() {
			var searchQuery = "SELECT DISTINCT ?a WHERE { {?a ?b ?c} UNION {?x ?y ?a} FILTER(!isLiteral(?a))}";
			this.runQuery(searchQuery, "Getting entity list failed - query failure", this.processObjectSuggestions.bind(this));
		},
		getAllPredicates: function() {
			var searchQuery = "SELECT DISTINCT ?a WHERE { {?b ?a ?c} UNION {?x ?a ?y} }";
			this.runQuery(searchQuery, "Getting predicate list failed - query failure", this.processPredicateSuggestions.bind(this));
		},
		getRelatedNodes: function(node) {
			var b = "<"+node.uri+">"
			var searchQuery = "SELECT DISTINCT ?a WHERE { {?a ?pred "+b+"} UNION {"+b+" ?pred ?a} UNION {?a ?pred1 ?c. ?c ?pred2 "+b+".} UNION {"+b+" ?pred1 ?c. ?c ?pred2 ?a.}" +
					"?a <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://rknown.com/RKnownObject> . }";
			this.runQuery(searchQuery, "Getting related nodes failed - query failure", this.processRelatedNodes.bind(this));
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