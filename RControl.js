var RControl = {
		init: function(model, inputFieldId) {
			this.model = model;
			this.linkStart = null;
			this.selectedNode = null;
			this.blankNode = null;
			this.inputFieldId = '#'+inputFieldId;
			this.predicateInputFieldId = '#newPredicateField';
			this.creationLink = null;
			SparqlFace.config(null);
			
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
			
			d3.select('#btnSave').on('click', this.save.bind(this));
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
		
		setPredicateNameFromField: function() {
			this.creationLink.setUri($(this.predicateInputFieldId).val());
			this.showPredicateSelection(false);
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
		
		nodeMouseOver: function(node) {
			if(!d3.event.shiftKey) {
				this.selectNode(node, false);
				this.view.moveLinkButton(this.selectedNode.x+120, this.selectedNode.y)
				this.view.showLinkButton(true);
				this.view.updateView();
			}
		},
		
		/*showLinkButton: function(node) {
			var linkButton = d3.select("#linkButton");
			linkButton.style("visibility", "visible");
			linkButton.attr("x",this.selectedNode.x+120);
			linkButton.attr("y", this.selectedNode.y);
		},*/
		
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
				this.view.showLinkButton(true);
			}
			else {
				this.selectedNode = null;
			}
		}
}