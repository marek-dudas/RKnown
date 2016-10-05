var RControl = {
		init: function(model, inputFieldId) {
			this.model = model;
			this.linkStart = null;
			this.selectedNode = null;
			this.blankNode = null;
			this.inputFieldId = '#'+inputFieldId;
			this.predicateInputFieldId = '#newPredicateField';
			this.typeInputFielId = '#typeField';
			this.creationLink = null;
			this.relatedNodes = [];
			SparqlFace.config(this.fillInputField.bind(this), this.fillPredicateField.bind(this), this.addRelatedNodes.bind(this));
			SparqlFace.getAllEntities();
			SparqlFace.getAllPredicates();
			
			$(this.inputFieldId).bind("enterKey", this.addEntityFromTextField.bind(this));
			$(this.inputFieldId).keyup(function(e){
			    if(e.keyCode == 13)
			    {
			        $(this).trigger("enterKey");
			    }
			});
			
			$(this.predicateInputFieldId).bind("enterKey", this.setPredicateNameFromField.bind(this));
			$(this.predicateInputFieldId).keyup(function(e){
			    if(e.keyCode == 13)
			    {
			        $(this).trigger("enterKey");
			    }
			});
			
			$(this.typeInputFielId).bind("enterKey", this.setTypeFromField.bind(this));
			$(this.typeInputFielId).keyup(function(e){
			    if(e.keyCode == 13)
			    {
			        $(this).trigger("enterKey");
			    }
			});
			
			d3.select('#btnSave').on('click', this.save.bind(this));
		},
		
		addRelatedNodes: function(strings) {
			var x=RSettings.nodeWidth/2;
			var y=RSettings.nodeHeight;
			if(this.relatedNodes.length>0) {
				x = this.relatedNodes[this.relatedNodes.length-1].x+RSettings.nodeWidth;
				y = this.relatedNodes[this.relatedNodes.length-1].y+RSettings.nodeHeight;
			}
			for(var i=0; i<strings.length; i++) {
				if(x>RSettings.relatedNodesCanvasWidth) {
					x=RSettings.nodeWidth/2;
					y+=RSettings.nodeHeight;
				}
				var node = Object.create(Node);
				var nodeUri = strings[i];
				node.init(nodeUri, SparqlFace.nameFromUri(nodeUri));
				node.x=x;
				node.y=y;
				x+=RSettings.nodeWidth;
				this.relatedNodes.push(node);
			}
			this.view.updateRelated();
		},
		
		relatedNodeMouseDown: function(node) {
			this.relatedNode = node.copy();
			this.view.setDraggedNode(this.relatedNode);
		},
		
		fillInputField: function(strings) {
			$(this.inputFieldId).autocomplete({
			      source: strings
			    });
		},
		
		fillPredicateField: function(strings) {
			$(this.predicateInputFieldId).autocomplete({
			      source: strings
			    });
		},
		
		save: function() {
			SparqlFace.saveGraph(this.model.getRdf())
		},

		setView: function(view) {
			this.view = view;
		},
		
		showPredicateSelection: function(visible) {
			d3.select('#predicateSelection').style("visibility", visible?"visible":"hidden");
		},
		
		showTypeSelection: function(visible) {
			if(this.selectedNode!=null) {
				d3.select('#typeSelection').style("left", this.selectedNode.x+30)
				.style("top", this.selectedNode.y-30);
			}
			d3.select('#typeSelection').style("visibility", visible?"visible":"hidden");
		},
		
		setPredicateNameFromField: function() {
			this.creationLink.setUri($(this.predicateInputFieldId).val());
			this.showPredicateSelection(false);
			this.view.updateView();
		},
		
		setTypeFromField: function() {
			var node = Object.create(Node);
			var nodeUri = $(this.typeInputFielId).val();
			node.init(nodeUri, SparqlFace.nameFromUri(nodeUri));
			node.x = this.selectedNode.x-1;
			node.y = this.selectedNode.y-100;
			node.setTypeNode();
			this.model.addNode(node);
			this.view.updateView();
			
			var link = Object.create(Link);
			link.init(this.selectedNode, node, "rdf:type", "is");
			this.model.addLink(link);
			this.showTypeSelection(false);
			this.view.updateView();
			
		},
		
		addEntityFromTextField: function() {
			var node = Object.create(Node);
			var nodeUri = $(this.inputFieldId).val();
			node.init(nodeUri, SparqlFace.nameFromUri(nodeUri));
			node.x = 100;
			node.y = 100;
			this.model.addNode(node);
			this.view.updateView();
			SparqlFace.getRelatedNodes(node);
		},
		
		mouseMove: function(location) {
			if(this.blankNode != null && this.linkStart != null) {
				this.blankNode.x = location[0]
				this.blankNode.y = location[1];
				this.view.updateView();
			}
		},
		
		canvasMouseDown: function(location, node) {
			if(this.linkStart != null) {
				this.creationLink.setEnd(node);
				this.linkStart = null;
				this.selectedNode.selected = false;
				this.selectedNode = null;
				this.showPredicateSelection(true);
			}
			this.selectNode(node, d3.event.shiftKey);
			this.view.updateView();
		},
		
		putRelatedNode: function(location) {
			this.relatedNode.x = location[0];
			this.relatedNode.y = location[1];
			this.model.addNode(this.relatedNode);
			this.view.updateView();
		},
		
		nodeMouseOver: function(node) {
			if(!d3.event.shiftKey) {
				this.selectNode(node, false);
				this.view.showNodeButtons(this.selectedNode.x+60, this.selectedNode.y);
				this.view.updateView();
			}
		},
		
		/*showLinkButton: function(node) {
			var linkButton = d3.select("#linkButton");
			linkButton.style("visibility", "visible");
			linkButton.attr("x",this.selectedNode.x+120);
			linkButton.attr("y", this.selectedNode.y);
		},*/
		
		typeButtonClick: function(){
			this.showTypeSelection(true);
		},
		
		linkButtonClick: function(){
			if(this.linkStart == null) {
				if(this.blankNode == null) {
					this.blankNode = Object.create(Node);
					this.blankNode.init("", "");
					this.blankNode.visible = false;
					this.blankNode.x = this.view.linkButton.x;
					this.blankNode.y = this.view.linkButton.y;
					this.model.addNode(this.blankNode);
				}
				this.linkStart = this.selectedNode;
				this.creationLink = Object.create(Link);
				this.creationLink.init(this.linkStart, this.blankNode, "", "");
				this.model.addLink(this.creationLink);
			}
		},
		
		selectNode: function(node, noDeselectFirst) {
			if(!noDeselectFirst || node == null) {
				for(var i=0; i<this.model.nodes.length; i++){
					this.model.nodes[i].selected = false;
				}
			}
			if(node!=null) {
				node.selected = true;
				this.selectedNode = node;
				this.view.showNodeButtons(node.x, node.y);
			}
			else {
				this.selectedNode = null;
				this.view.hideNodeButtons();
			}
		}
}