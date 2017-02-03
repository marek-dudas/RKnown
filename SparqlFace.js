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
		nameFromUri: function(uri) {
			return uri.match("[^\/#]+$");
		},
		query: function(queryText, callback) {
			var query = this.queryService.createQuery();
			query.query(queryText, {failure: function(){alert("Query failed:"+queryText)}, 
				success: callback});
		},
		saveGraph: function(triplesInString) {						
			$.ajax("server/save-temp-graph.php"+"?filename=test.ttl", {
			    data : triplesInString,
			    contentType : 'text/plain',
			    type : 'POST',
			    success: this.clearThenLoad.bind(this)
			});			
		},
		loadGraph: function(user, graph, callback) {
			this.loadGraphCallback = callback;
			this.currentGraph = graph;
			var query = "SELECT DISTINCT * FROM <" + graph + "> WHERE {" +
					"?a <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://rknown.com/RKnownObject> ;" +
					"	<http://rknown.com/xcoord> ?x ;" +
					"	<http://rknown.com/ycoord> ?y ;" +
					"	<http://www.w3.org/2000/01/rdf-schema#label> ?label .}";
			this.query(query, this.saveObjectsAndContinue.bind(this));
		},
		saveLinksAndContinue: function(json) {
			this.links = [];
			for(var j=0; j<json.results.bindings.length; j++) {
				var binding = json.results.bindings[j];
				var linkUri =  binding["link"].value;
				var startUri =  binding["a"].value;
				var endUri =  binding["b"].value;
				var start = null;
				var end = null;
				for(var i=0; i<this.objects.length; i++) {
					if(this.objects[i].uri==startUri) start = this.objects[i];
					if(this.objects[i].uri==endUri) end = this.objects[i];
				}
				if(start!=null && end!=null) {
					var link = Object.create(Link);
					link.init(start, end, linkUri, this.nameFromUri(linkUri));
					this.links.push(link);
				}
			}
			
			var query = "SELECT DISTINCT * FROM <" +this.currentGraph+"> WHERE {" +
					"?a <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://rknown.com/RKnownObject> ;" +
					"	?predicate ?value ." +
					"?predicate <http://www.w3.org/2000/01/rdf-schema#label> ?label . " +
					"FILTER(?predicate != <http://rknown.com/xcoord> && ?predicate != <http://rknown.com/ycoord> && ?predicate != <http://www.w3.org/2000/01/rdf-schema#label>)" +
					"FILTER(isLiteral(?value))" +
					"}";
			
			this.query(query, this.saveLiteralsAndContinue.bind(this));
			
		},
		loadLiteralsForObject: function(node) {
			var query = "SELECT DISTINCT * WHERE { <" +node.uri+"> ?predicate ?value ." +
			"?predicate <http://www.w3.org/2000/01/rdf-schema#label> ?label . " +
			"FILTER(?predicate != <http://rknown.com/xcoord> && ?predicate != <http://rknown.com/ycoord> && ?predicate != <http://www.w3.org/2000/01/rdf-schema#label>)" +
			"FILTER(isLiteral(?value))" +
			"}";
			this.query(query, function(json) {
				for(var j=0; j<json.results.bindings.length; j++) {
					var binding = json.results.bindings[j];
					var predicate = Object.create(Node);
					var valuation = Object.create(Valuation);
					var predicateName = binding["label"].value;
					var predicateUri = binding["predicate"].value;
					var value = binding["value"].value;
					predicate.init(predicateUri, predicateName);
					valuation.setPredicate(predicate);
					valuation.setValue(value);
					node.addValuation(valuation);
				}
			});
		},
		saveLiteralsAndContinue: function(json) {
			for(var j=0; j<json.results.bindings.length; j++) {
				var binding = json.results.bindings[j];
				var predicate = Object.create(Node);
				var valuation = Object.create(Valuation);
				var objUri = binding["a"].value;
				var predicateName = binding["label"].value;
				var predicateUri = binding["predicate"].value;
				var value = binding["value"].value;
				predicate.init(predicateUri, predicateName);
				valuation.setPredicate(predicate);
				valuation.setValue(value);
				for(var i=0; i<this.objects.length; i++) {
					if(this.objects[i].uri == objUri) {
						this.objects[i].addValuation(valuation);
					}
				}
			}
			this.loadGraphCallback(this.objects, this.links);
		},
		
		saveObjectsAndContinue: function(json) {
			this.objects = [];
			for(var j=0; j<json.results.bindings.length; j++) {
				var binding = json.results.bindings[j];
				var object = Object.create(Node);
				var objUri = binding["a"].value;
				var name = binding["label"].value;
				object.init(objUri, name);
				object.x = parseFloat(binding["x"].value);
				object.y = parseFloat(binding["y"].value);
				this.objects.push(object);
			}
			var query = "SELECT ?a ?link ?b FROM <"+ this.currentGraph +"> WHERE {" +
					"?a <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://rknown.com/RKnownObject> ." +
					"?b <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://rknown.com/RKnownObject> ." +
					"?a ?link ?b . }";
			this.query(query, this.saveLinksAndContinue.bind(this))
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
		getGraphs: function(callback) {
			var query = "SELECT DISTINCT ?graph WHERE { graph ?graph {?s ?p ?o.}}";
			this.runQuery(query, "Getting graphs failed.", function(json){callback(SparqlFace.getAllBindings(json, "graph"))})
		},
		textSearch: function(text, type, callback) {
			this.textSearchCallback = callback;
			var searchQuery = "SELECT ?a ?label WHERE " +
					"{ ?a <http://www.w3.org/2000/01/rdf-schema#label> ?label ." +
					"  ?a <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "+type+" . " +
					" FILTER(contains(?a, \""+text+"\") || contains(?label, \""+text+"\")) }";
			
			var query = this.queryService.createQuery();
			query.query(searchQuery, {failure: function(){alert("Search failed - query failure")}, 
				success: this.processTextSearch.bind(this)});
		},
		processTextSearch: function(json) {
			this.objects = [];
			for(var j=0; j<json.results.bindings.length; j++) {
				var binding = json.results.bindings[j];
				var object = Object.create(Node);
				var objUri = binding["a"].value;
				var objName = binding["label"].value;
				object.init(objUri, objName);
				this.objects.push(object);
			}
			this.textSearchCallback(this.objects);
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
			var updateQuery = "CLEAR GRAPH <"+ this.currentGraph +">";
			
			$.get("server/sesame-proxy.php?query="+encodeURIComponent(updateQuery), null, this.runLoadQuery.bind(this));
				
			/*
			var query = this.updateService.createQuery();
			query.query(updateQuery, {failure: function(){alert("Saving graph failed - query failure")}, 
				success: this.runLoadQuery.bind(this)});*/
		},
		runLoadQuery: function() {
			var query = this.updateService.createQuery();	
			var updateQuery = "LOAD <http://localhost/rknown/server/test.ttl> INTO GRAPH <"+ this.currentGraph +">"
				
			$.get("server/sesame-proxy.php?query="+encodeURIComponent(updateQuery), null, this.graphSavedCallback);
				
			/*query.query(updateQuery, {failure: function(){alert("Saving graph failed - query failure")}, 
				success: function(json) {
					alert("Graph saved successfully")
				}});*/
			
		},
		initLinkFinding: function() {
			this.processedBuilders = 0;
			this.builders = [];
		},
		findLinksBetween: function(a, b) {
			for(var i=1; i<RSettings.maxPathLength; i++) {
				var builder = Object.create(PathBuilder);
				this.builders.push(builder);
				builder.init(a,b,i);
			}
			/*var query1a = "SELECT * WHERE { " +
					"<[a]> ?l1 <[b]> . }";
			var query1b = "SELECT * WHERE { " +
					"<[b]> ?l1 <[a]> . }";
			var query2a = "SELECT * WHERE { " +
					"<[a]> ?l1 ?o1 ." +
					"?o1 ?l2 <[b]> . }";
			var query2a = "SELECT * WHERE { " +
					"<[b]> ?l1 ?o1 ." +
					"?o1 ?l2 <[a]> . }";*/
			
		},
		pathBuilderProcessed: function() {
			this.processedBuilders++;
			if(this.processedBuilders == this.builders.length) {
				for(var i=0; i<this.builders.length; i++) {
					if(this.builders[i].pathFound)
					{
						for(var p=0; p<this.builders[i].placeholders.length; p++) {
							var pLink = this.builders[i].placeholders[p];				
							RKnown.control.addEntityFromUri(pLink.s);
							RKnown.control.addEntityFromUri(pLink.o);
							RKnown.control.addLinkFromUri(this.stripBrackets(pLink.s), 
									this.stripBrackets(pLink.p), 
									this.stripBrackets(pLink.o));
						}
					}
				}
			}
			RKnown.control.view.updateView();
		},
		stripBrackets: function(uri) {
			return uri.replace(/[<>]/g,"");
		}
}