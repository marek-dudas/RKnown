var Node = {
		init: function(uri, name, type) {
			this.selected = false;
			this.name = name;
			this.uri = SparqlFace.stripBrackets(uri);
			this.id = -1;
			this.visible = true;
			this.typeNode = false;
			this.width = RSettings.nodeWidth;
			this.height = RSettings.nodeHeight;
			this.valuations = [];
			this.type = URIS.object;
			this.types = [];
            this.predicateUri = null;
            this.color = RSettings.defaultNodeColor;
            this.mainType = null;
			if(type != null) this.type = type;
		},

		addType: function(type) {
			typeExists = false;
			for(var i=0; i<this.types.length; i++) if(this.types[i].uri == type.uri) typeExists = true;
			if(typeExists == false && this.types.length == 0 && this.color == RSettings.defaultNodeColor) {
                this.color = type.color;
                this.mainType = type;
            }
			if(typeExists == false) this.types.push(type);
		},
		
		brUri: function() {
			return "<"+this.uri+">";
		},

	setPredicateUri: function(uri) {
		this.predicateUri = uri;
	},
		
		setTypeNode: function() {
			this.typeNode = true;
		},
		
		equals: function(node) {
			return this.uri == node.uri;
		},
		
		triplify: function(model) {
			if(this.visible == false) return "";
			var tripleString = "<"+this.uri+"> <http://rknown.com/xcoord> "+this.x+" . \r\n";
			tripleString += "<"+this.uri+"> <http://rknown.com/ycoord> "+this.y+" . \r\n";
			tripleString += "<"+this.uri+"> " + URIS.rKnownTypePredicate + " " +this.type+" . \r\n";
			tripleString += "<"+this.uri+"> <http://www.w3.org/2000/01/rdf-schema#label> \""+this.name+"\" . \r\n";
            if(this.predicateUri!=null) {
                tripleString += "<"+this.uri+"> <http://rknown.com/predicate> <"+this.predicateUri+"> . \r\n" +
                    "<"+this.predicateUri+"> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://www.w3.org/2002/07/owl#ObjectProperty>;\r\n" +
                      "<http://www.w3.org/2000/01/rdf-schema#label> \"" + this.name + "\" . \r\n" ;
            }

            if(this.mainType != null) {
            	tripleString +=  "<"+this.uri+"> " + URIS.mainTypePredicate + " <" + this.mainType.uri + "> . ";
			}

			for(var i=0; i<this.types.length; i++) {
            	tripleString += "<"+this.uri+"> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <"+this.types[i].uri+"> . \r\n";
            }
			
			for(var i=0; i<this.valuations.length; i++) {
				tripleString += "<"+this.uri+"> <"+this.valuations[i].predicate.uri+"> \""+this.valuations[i].value+"\" .\r\n";
				tripleString += "<"+this.valuations[i].predicate.uri+"> <http://www.w3.org/2000/01/rdf-schema#label> \""+this.valuations[i].predicate.name+"\" ;\r\n" +
						"				<http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://www.w3.org/2002/07/owl#DataProperty> . \r\n";
			}

			if(this.type == URIS.relation) {
			    var link = model.getRelationFor(this);
			    if(link!=null) tripleString += link.triplify();
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
			this.s = SparqlFace.stripBrackets(subject);
			this.p = SparqlFace.stripBrackets(predicate);
			this.o = SparqlFace.stripBrackets(object);
		},
		create: function(subject, predicate, object) {
			var triple = Object.create(Triple);
			triple.init(subject, predicate, object);
			return triple;			
		},
		str: function() {
			if(this.o.match(/^".*"$/g)!=null)
                return "<"+this.s+"> <"+this.p+ "> "+this.o+" .\r\n";
			else return "<"+this.s+"> <"+this.p+ "> <"+this.o+"> .\r\n";
		}
}

/*
var Link = {
		init: function(start, end) {
			this.start = start;
			this.end = end;
			this.source = start;
			this.target = end;
			this.from = start;
			this.to = end;
			this.right = true;
			this.left = false;
			this.id = -1;
		},
		dashed: function() {
			return "";
		}
}*/

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
			/*this.startUri;
			this.endUri;*/
		},
		triplify: function() {
			var triples = Triple.create(this.start.uri, this.uri, this.end.uri).str();
			triples += Triple.create(this.uri, "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
					"http://www.w3.org/2002/07/owl#ObjectProperty").str();
			triples += "<"+this.uri+"> <http://www.w3.org/2000/01/rdf-schema#label> \""+this.name+"\" .\r\n";
			return triples;
		},
		setEnd: function(end) {
			this.end = end;
			this.target = end;
			this.to = end;
		},
		setUri: function(uri) {
			this.uri = uri;
		},
		setName: function(name){
			this.name = name;
		},
		dashed: function() {
			return "";
		},
    connectedTo: function(node) {
        if (this.start == node || this.end == node) return true;
        else return false;
    }
}

var RType = {
	init: function(uri, label, color) {
		this.uri = uri;
		this.label = label;
		this.color = color;
	},
	setColor: function(color) {
		this.color = color;
	},
	getColor: function() {
		return this.color;
	},
	triplify: function() {
		var triples = Triple.create(this.uri, URIS.rdfType, URIS.rdfsClass).str();
		triples += Triple.create(this.uri, URIS.rdfsLabel, "\""+this.label+"\"").str();
		triples += Triple.create(this.uri, URIS.colorPredicate, "\""+this.color+"\"").str();
		return triples;
	}
}

var RModel = {
		init: function() {
			this.links = [];
			this.nodes = [];
			this.relations = [];
			this.idCounter = 10;
			this.name = "";
			this.oldId = null;
			this.vocabs = [];
			this.created = Date.now();
			this.types = [];
			this.typeColors = d3.scale.category20();
		},

		addType: function(type) {
			this.types.push(type);
		},

		addTypeToNode: function(node, type) {
			var color = null;
			for(var i=0; i<this.types.length; i++) {
				if(this.types[i].uri == type.uri) {
					color = this.types[i].color;
				}
			}
			if(color == null) {
				color = this.typeColors(this.types.length % 20);
				this.types.push(type);
			}
			type.setColor(color);
			node.addType(type);
		},

 		addNode: function(node) {
			node.id = this.idCounter++;
			this.nodes.push(node);
		},
		
		addSimpleLink: function(from, to) {
			var link = Object.create(Link);
			link.init(from, to, "<http://rknown.com/RKnownLink>", "");
			link.id = this.idCounter++;
			this.links.push(link);
		},
		
		removeNode: function(node) {
		    var index = this.nodes.indexOf(node);
		    if(index>=0) {
                for (var i = 0; i < this.links.length; i++) {
                    if (this.links[i].connectedTo(node)) {
                        this.links.splice(i, 1);
                        i--;
                    }
                }
                this.nodes.splice(this.nodes.indexOf(node), 1);
            }
		},
 
		removeLink: function(link) {
		    var index = this.links.indexOf(link);
			if(index>=0) this.links.splice(this.links.indexOf(link),1);
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
		
		getEntityUriBase: function() {
			return RSettings.uriBase;
		},
		
		addLink: function(link) {
			link.id = this.idCounter++;
			this.links.push(link);
		},
		
		addRelationLink: function(link) {
			link.id = this.idCounter++;
			var linkNode = Object.create(Node);
			var linkNodeUri = this.getEntityUriBase() + SparqlFace.getGraphName() + "/" + 
				SparqlFace.nameFromUri(link.from.uri) + "-" + SparqlFace.nameFromUri (link.uri) + "-" +
				SparqlFace.nameFromUri(link.to.uri) + "-" + link.id;
			linkNode.init(linkNodeUri, link.name, "<http://rknown.com/RKnownRelation>");
			linkNode.setPredicateUri(link.uri);
			var connection = Object.create(Link);
			connection.init(link.from, link.to, "", "");
			var middle = connection.getMiddlePoint();
			linkNode.x = middle.x;
			linkNode.y = middle.y;
			this.addNode(linkNode);
			this.addSimpleLink(link.from, linkNode);
			this.addSimpleLink(linkNode, link.to);
			this.relations.push(link);
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
		    /*
			for(var i=0; i<this.links.length; i++) {
				if(this.links[i].from.uri == fromUri && this.links[i].to.uri == toUri) return true;
			}
			return false;*/
		    for(var i=0; i<this.nodes.length; i++) {
		        var node = this.nodes[i];
		        if(node.type==URIS.relation) {
		            var link = this.getRelationFor(node);
                    if(link.from.uri == fromUri && link.to.uri == toUri) return true;
                }
            }
            return false;
		},
		
		addLinkByUris: function(linkUri, linkName, fromUri, toUri) {
			if(!this.linkExists(fromUri, toUri)) {
				var newLink = Object.create(Link);
				newLink.init(this.getNodeByUri(fromUri), this.getNodeByUri(toUri), linkUri, linkName);
				this.addRelationLink(newLink);
			}
		},

		updateCounter: function(idToCheck) {
			if(idToCheck>=this.idCounter) this.idCounter=idToCheck+1;
		},
		
		getRdf: function() {
			var rdf = "";
			for(var i=0; i<this.links.length; i++) rdf+=this.links[i].triplify();
			for(var i=0; i<this.nodes.length; i++) rdf+=this.nodes[i].triplify(this);
            for(var i=0; i<this.types.length; i++) rdf+=this.types[i].triplify();
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

		getRelationFor: function(node) {
			var outgoing = null;
			var incoming = null;
			for(var i=0; i<this.links.length; i++) {
				if(this.links[i].from == node && this.links[i].to.type==URIS.object) outgoing = this.links[i];
                if(this.links[i].to == node && this.links[i].from.type == URIS.object) incoming = this.links[i];
			}
			if(incoming!=null&&outgoing!=null) {
				var link = Object.create(Link);
				link.init(incoming.start, outgoing.end, node.predicateUri, node.name);
				return link;
			}
			else return null;
		}

};

