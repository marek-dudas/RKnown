var Node = {
		init: function(uri, name) {
			this.selected = false;
			this.name = name;
			this.uri = SparqlFace.stripBrackets(uri);
			this.id = -1;
			this.visible = true;
			this.typeNode = false;
			this.width = RSettings.nodeWidth;
			this.height = RSettings.nodeHeight;
			this.valuations = [];
		},
		
		brUri: function() {
			return "<"+this.uri+">";
		},
		
		setTypeNode: function() {
			this.typeNode = true;
		},
		
		equals: function(node) {
			return this.uri == node.uri;
		},
		
		triplify: function() {
			if(this.visible == false) return "";
			var tripleString = "<"+this.uri+"> <http://rknown.com/xcoord> "+this.x+" . ";
			tripleString += "<"+this.uri+"> <http://rknown.com/ycoord> "+this.y+" . ";
			tripleString += "<"+this.uri+"> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://rknown.com/RKnownObject> . ";
			tripleString += "<"+this.uri+"> <http://www.w3.org/2000/01/rdf-schema#label> \""+this.name+"\" . ";
			
			for(var i=0; i<this.valuations.length; i++) {
				tripleString += "<"+this.uri+"> <"+this.valuations[i].predicate.uri+"> \""+this.valuations[i].value+"\" .";
				tripleString += "<"+this.valuations[i].predicate.uri+"> <http://www.w3.org/2000/01/rdf-schema#label> \""+this.valuations[i].predicate.name+"\" ;" +
						"				<http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://www.w3.org/2002/07/owl#DataProperty> .";
			}
			
			return tripleString;
		},
		
		copy: function() {
			var nodeCopy = Object.create(Node);
			nodeCopy.init(this.uri, this.name);
			return nodeCopy;
		},
		
		getComment: function() {
			return "this is some entity";
		},
		
		addValuation: function(valuation) {
			this.valuations.push(valuation);
		}
		
} 

var Valuation = {
		setPredicate: function(node) {
			this.predicate = node;
		},
		setValue: function(value) {
			this.value = value;
		},
		init: function(predicate, value) {
			this.predicate = predicate;
			this.value = value;
		}
}

var Triple = {
		init: function(subject, predicate, object) {
			this.s = subject;
			this.p = predicate;
			this.o = object;
		},
		create: function(subject, predicate, object) {
			var triple = Object.create(Triple);
			triple.init(subject, predicate, object);
			return triple;			
		},
		str: function() {
			return "<"+this.s+"> <"+this.p+ "> <"+this.o+"> .";
		}
}

var Link = {	
		init: function(start, end, uri, name) {
			this.type = "link";
			this.start = start;
			this.end = end;
			this.source = start;
			this.target = end;
			this.from = start;
			this.to = end;
			this.right = true;
			this.left = false;
			this.id = -1;
			this.name = name;
			this.uri = SparqlFace.stripBrackets(uri);
			this.startUri;
			this.endUri;
		},
		triplify: function() {
			var triples = Triple.create(this.start.uri, this.uri, this.end.uri).str();
			triples += Triple.create(this.uri, "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
					"http://www.w3.org/2002/07/owl#ObjectProperty").str();
			triples += "<"+this.uri+"> <http://www.w3.org/2000/01/rdf-schema#label> \""+this.name+"\" .";
			return triples;
		},
		setEnd: function(end) {
			this.end = end;
			this.target = end;
		},
		setUri: function(uri) {
			this.uri = uri;
		},
		setName: function(name){
			this.name = name;
		},
		dashed: function() {
			return "";
		}
}

var RModel = {
		init: function() {
			this.links = [];
			this.nodes = [];
			this.idCounter = 10;
			this.name = "";
			this.oldId = null;
			this.vocabs = [];
			this.created = Date.now();
		},

 		addNode: function(node) {
			node.id = this.idCounter++;
			this.nodes.push(node);
		},
		
		removeNode: function(node) {  
			for(var i=0; i<this.links.length; i++){
				if(this.links[i].connectedTo(node)) {
					this.links.splice(i,1);
					i--;
				}
			}
			this.nodes.splice(this.nodes.indexOf(node),1);
		},
 
		removeLink: function(link) {
			this.links.splice(this.links.indexOf(link),1);
			//this.updateBTypeLevels();
		},

		empty: function() {
			while(this.links.length) {
				this.links.pop();
			}
			while(this.nodes.length) {
				this.nodes.pop();
			}
		},
		
		addLink: function(link) {
			link.id = this.idCounter++;
			this.links.push(link);
		},

		getNodeById: function(id) {
			for(var i=0; i<this.nodes.length; i++){
				if(this.nodes[i].id==id) return this.nodes[i];
			}
			return null;
		},
		
		getNodeByUri: function(uri) {
			for(var i=0; i<this.nodes.length; i++){
				if(this.nodes[i].uri==uri) return this.nodes[i];
			}
			return null;			
		},
		
		linkExists: function(fromUri, toUri) {
			for(var i=0; i<this.links.length; i++) {
				if(this.links[i].from.uri == fromUri && this.links[i].to.uri == toUri) return true;
			}
			return false;
		},
		
		addLinkByUris: function(linkUri, linkName, fromUri, toUri) {
			if(!this.linkExists(fromUri, toUri)) {
				var newLink = Object.create(Link);
				newLink.init(this.getNodeByUri(fromUri), this.getNodeByUri(toUri), linkUri, linkName);
				this.addLink(newLink);
			}
		},

		updateCounter: function(idToCheck) {
			if(idToCheck>=this.idCounter) this.idCounter=idToCheck+1;
		},
		
		getRdf: function() {
			var rdf = "";
			for(var i=0; i<this.links.length; i++) rdf+=this.links[i].triplify();
			for(var i=0; i<this.nodes.length; i++) rdf+=this.nodes[i].triplify();
			return rdf;
		},

		getLinks: function() {
			return this.links;
		},

		getNodes: function() {
			return this.nodes;
		},
		
		buildFromRdf: function(rdfData) {
			
		},
};

