var Node = {
		init: function(uri, name) {
			this.selected = false;
			this.name = name;
			this.uri = uri;
			this.id = -1;
			this.visible = true;
		},
		
		equals: function(node) {
			return this.uri == node.uri;
		},
		
		triplify: function() {
			if(this.visible == false) return "";
			var tripleString = "<"+this.uri+"> <http://rknown.com/xcoord> "+this.x+" .";
			tripleString += "<"+this.uri+"> <http://rknown.com/ycoord> "+this.y+" .";
			return tripleString;
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
			this.right = true;
			this.left = false;
			this.id = -1;
			this.name = name;
			this.uri = uri;
		},
		triplify: function() {
			return Triple.create(this.start.uri, this.uri, this.end.uri).str();
		},
		setEnd: function(end) {
			this.end = end;
			this.target = end;
		},
		setUri: function(uri) {
			this.uri = uri;
			this.name = SparqlFace.nameFromUri(uri);
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
			this.updateBTypeLevels();
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

