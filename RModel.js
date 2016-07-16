var Node = {
		init: function(uri, name) {
			this.selected = false;
			this.name = name;
			this.uri = uri;
			this.id = -1;
		},
		
		equals: function(node) {
			return this.uri == node.uri;
		}
		
} 

var Link = {	
		init: function(start, end, uri, name) {
			this.type = purostr.link;
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
			return {s: this.start.uri, p: this.uri, o: this.end.uri};
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
			this.updateBTypeLevels();
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



		getLinks: function() {
			return this.links;
		},

		getNodes: function() {
			return this.nodes;
		}
};

