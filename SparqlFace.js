var SparqlFace = {
		config: function(objectSuggestCallback, predicateSuggestCallback, relatedCallback) {
			this.objectSuggestionCallback = objectSuggestCallback;
			this.predicateSuggestionCallback= predicateSuggestCallback;
			this.relatedCallback = relatedCallback;
			this.queryService = Object.create(SPARQL);
			this.queryService.Service(RSettings.sparqlProxy, RSettings.sparqlEndpoint);
			this.queryService.setMethod('GET');
			this.queryService.setToken(RKnown.userToken);
			this.userDbService = Object.create(SPARQL);
            this.userDbService.Service(RSettings.sparqlProxy, RSettings.userDbEndpoint);
            this.userDbService.setMethod('GET');
            this.userDbService.setToken(RKnown.userToken);
		},
		getGraphName: function() {
			return this.nameFromUri(this.currentGraph);
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
            this.model = Object.create(RModel);
            this.model.init();

            var query = "SELECT DISTINCT * FROM <" + graph + "> WHERE {" +
                "?a "+ URIS.rdfType + " "+URIS.rdfsClass + " ; " +
				    URIS.colorPredicate + " ?color ; " +
                "	<http://www.w3.org/2000/01/rdf-schema#label> ?label ." +
                "}";
            this.query(query, this.saveTypesAndContinue.bind(this));
        },

		saveTypesAndContinue: function(json) {
            for(var j=0; j<json.results.bindings.length; j++) {
                var binding = json.results.bindings[j];
                var typeUri = binding["a"].value;
                var typeLabel = binding["label"].value;
                var typeColor = binding["color"].value;
                var type = Object.create(RType);
                type.init(typeUri, typeLabel, typeColor);
                this.model.addType(type);
            }

			var query = "SELECT DISTINCT * FROM <" + this.currentGraph + "> WHERE {" +
					"?a "+ URIS.rKnownTypePredicate + " ?type ;" +
					"	<http://rknown.com/xcoord> ?x ;" +
					"	<http://rknown.com/ycoord> ?y ;" +
					"	<http://www.w3.org/2000/01/rdf-schema#label> ?label ." +
				"OPTIONAL {?a <http://rknown.com/predicate> ?predicateUri .}" +
				"OPTIONAL {?a " + URIS.mainTypePredicate + " ?mainRdfType . " +
						"?mainRdfType "+ URIS.rdfType + " "+URIS.rdfsClass + " ; " +
						URIS.colorPredicate + " ?color ; " +
            			"<http://www.w3.org/2000/01/rdf-schema#label> ?rdfTypeLabel . }" +
					"   FILTER(?type = <http://rknown.com/RKnownObject> || ?type = <http://rknown.com/RKnownRelation> )" +
					"}";
			this.query(query, this.saveObjectsAndContinue.bind(this));
		},
		saveLinksAndContinue: function(json) {
			//this.links = [];
			for(var j=0; j<json.results.bindings.length; j++) {
				var binding = json.results.bindings[j];
				var linkUri =  binding["link"].value;
				var startUri =  binding["a"].value;
				var endUri =  binding["b"].value;
				var start = null;
				var end = null;
				for(var i=0; i<this.model.nodes.length; i++) {
					if(this.model.nodes[i].uri==startUri) start = this.model.nodes[i];
					if(this.model.nodes[i].uri==endUri) end = this.model.nodes[i];
				}
				if(start!=null && end!=null) {
					var link = Object.create(Link);
					link.init(start, end, linkUri, this.nameFromUri(linkUri));
					this.model.addLink(link);
				}
			}
			
			var query = "SELECT DISTINCT * FROM <" +this.currentGraph+"> WHERE {" +
					"?a " + URIS.rKnownTypePredicate + " ?type ;" +
					"	?predicate ?value ." +
					"?predicate <http://www.w3.org/2000/01/rdf-schema#label> ?label . " +
					"FILTER(?type = <http://rknown.com/RKnownObject> || ?type = <http://rknown.com/RKnownRelation> )" +
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
				var node = this.model.getNodeByUri(objUri);
				if(node!=null) node.addValuation(valuation);
			}

            var query = "SELECT DISTINCT * FROM <" +this.currentGraph+"> WHERE {" +
                "?a " + URIS.rKnownTypePredicate + " ?type ;" +
                  	URIS.rdfType + " ?rdfType ." +
                "?rdfType "+URIS.rdfType+ " "+ URIS.rdfsClass + " ;" +
					URIS.rdfsLabel + " ?label; " +
					URIS.colorPredicate + " ?color ." +
                "FILTER(?type = <http://rknown.com/RKnownObject> || ?type = <http://rknown.com/RKnownRelation> )" +
              "}";

            this.query(query, this.saveTypesForNodesAndContinue.bind(this));

			//this.loadGraphCallback(this.model);
		},
    saveTypesForNodesAndContinue: function(json){
        for(var j=0; j<json.results.bindings.length; j++) {
            var binding = json.results.bindings[j];
            var objUri = binding["a"].value;
            var label = binding["label"].value;
            var color = binding["color"].value;
            var typeUri = binding["rdfType"].value;
            var nodeType = Object.create(RType);
            nodeType.init(typeUri, label, color);
            var node = this.model.getNodeByUri(objUri);
            if(node!=null) node.addType(nodeType);
        }

        this.loadGraphCallback(this.model);
	},

		saveObjectsAndContinue: function(json) {
			//this.objects = [];
			for(var j=0; j<json.results.bindings.length; j++) {
				var binding = json.results.bindings[j];
				var object = Object.create(Node);
				var objUri = binding["a"].value;
				var name = binding["label"].value;
				var type = "<"+binding["type"].value+">";

				object.init(objUri, name, type);
                if (typeof binding["predicateUri"] !== 'undefined') {
                	var predicateUri = binding["predicateUri"].value;
                	object.setPredicateUri(predicateUri);
				}
				if (typeof binding["mainRdfType"] !== 'undefined') {
                    var label = binding["rdfTypeLabel"].value;
                    var color = binding["color"].value;
                    var typeUri = binding["mainRdfType"].value;
                    var nodeType = Object.create(RType);
                    nodeType.init(typeUri, label, color);
                    object.addType(nodeType);
				}
				object.x = parseFloat(binding["x"].value);
				object.y = parseFloat(binding["y"].value);
				this.model.addNode(object);
			}
			var query = "SELECT ?a ?link ?b FROM <"+ this.currentGraph +"> WHERE {" +
					"{?a "+ URIS.rKnownTypePredicate + " <http://rknown.com/RKnownObject> ." +
					"?b "+ URIS.rKnownTypePredicate + " <http://rknown.com/RKnownRelation> ." +
					"?a ?link ?b .}" +
					"UNION " +
					"{?a "+ URIS.rKnownTypePredicate + " <http://rknown.com/RKnownRelation> ." +
					"?b "+ URIS.rKnownTypePredicate + " <http://rknown.com/RKnownObject> ." +
					"?a ?link ?b .}" +
                "UNION " +
                "{?a "+ URIS.rKnownTypePredicate + " <http://rknown.com/RKnownRelation> ." +
                "?b "+ URIS.rKnownTypePredicate + " <http://rknown.com/RKnownRelation> ." +
                "?a ?link ?b .}" +
					"}";
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
			var results = []; //this.getAllBindings(json, "a");
            for(var j=0; j<json.results.bindings.length; j++) {
                var binding = json.results.bindings[j];
                var object = Object.create(Node);
                var objUri = binding["a"].value;
                var name = binding["label"].value;
                object.init(objUri, name, URIS.object);
                results.push(object);
            }

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
			var queryText = "SELECT DISTINCT ?graph WHERE { ?graph <http://purl.org/dc/terms/creator> \""+RKnown.userEmail+"\" .}"; //graph ?graph {?s ?p ?o.}

            var query = this.userDbService.createQuery();
            query.query(queryText, {failure: function(){alert("Getting graphs failed.")},
                success: function(json){callback(SparqlFace.getAllBindings(json, "graph"))}});

			//this.runQuery(query, "Getting graphs failed.", function(json){callback(SparqlFace.getAllBindings(json, "graph"))})
		},
		textSearch: function(text, type, callback) {
			this.textSearchCallback = callback;
			var searchQuery = "SELECT ?a ?label WHERE " +
					"{ ?a <http://www.w3.org/2000/01/rdf-schema#label> ?label ." +
					"  ?a "+URIS.rKnownTypePredicate+" "+type+" . " +
					" FILTER(contains(LCASE(?a), LCASE(\""+text+"\")) || contains(LCASE(?label), LCASE(\""+text+"\"))) } LIMIT "+RSettings.suggestionsLimit;
			
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
			var searchQuery = "SELECT DISTINCT ?a ?label WHERE { {?a ?pred "+b+"} " +
				"UNION {"+b+" ?pred ?a} UNION {?a ?pred1 ?c. ?c ?pred2 "+b+".} " +
                "UNION {"+b+" ?pred1 ?c. ?c ?pred2 ?a.}" +
                "?a "+URIS.rKnownTypePredicate+" "+URIS.object+" . " +
                "?a <http://www.w3.org/2000/01/rdf-schema#label> ?label .} " +
                "LIMIT"+RSettings.suggestionsLimit;
			this.runQuery(searchQuery, "Getting related nodes failed - query failure", this.processRelatedNodes.bind(this));
		},
		clearThenLoad: function() {
			var updateQuery = "CLEAR GRAPH <"+ this.currentGraph +">";
			
			$.get("server/sesame-proxy.php?token="+RKnown.userToken+"&query="+encodeURIComponent(updateQuery), null, this.runLoadQuery.bind(this));
				
			/*
			var query = this.updateService.createQuery();
			query.query(updateQuery, {failure: function(){alert("Saving graph failed - query failure")}, 
				success: this.runLoadQuery.bind(this)});*/
		},
		runLoadQuery: function() {
			var updateQuery = "LOAD <http://localhost/rknown/server/graphs/test.ttl> INTO GRAPH <"+ this.currentGraph +">"
				
			$.get("server/sesame-proxy.php?query="+encodeURIComponent(updateQuery)+"&token="+RKnown.userToken, null, this.graphSavedCallback);
				
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
				builder.init(a,b,i,i+1);
				for(var j=1; j<=i; j++) {
					var builder = Object.create(PathBuilder);
					this.builders.push(builder);
					builder.init(a,b,i,j);
				}
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