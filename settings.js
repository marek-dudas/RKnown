var RSettings = {
		nodeWidth: 100,
		nodeHeight: 40,
		emptyNodeWidth: 30,
		emptyNodeHeight: 30,
		relatedNodesCanvasWidth: 320,
		uriBase: "http://rknown.com/data/",
		graphUriBase: "http://rknown.com/graph/",
		maxPathLength: 3,
		suggestionsLimit: 10,
		defaultNodeColor: "#ddd",
	    suggestionWaitTime: 200
}

var URIS = {
    relation: "<http://rknown.com/RKnownRelation>",
	object: "<http://rknown.com/RKnownObject>",
	type: "<http://rknown.com/RKnownType>",
	rKnownTypePredicate: "<http://rknown.com/type>",
	mainTypePredicate: "<http://rknown.com/mainType>",
	colorPredicate: "<http://rknown.com/color>",
	rdfType: '<http://www.w3.org/1999/02/22-rdf-syntax-ns#type>',
	rdfsClass: "<http://www.w3.org/2000/01/rdf-schema#Class>",
	rdfsLabel: "<http://www.w3.org/2000/01/rdf-schema#label>",
	relatedToPredicate: "<http://rknown.com/relatedTo>"
}