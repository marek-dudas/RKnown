var RControl = {
		init: function(model, inputFieldId) {
			this.model = model;
			this.linkStart = null;
			this.selectedNode = null;
			this.blankNode = null;
			this.inputFieldId = '#'+inputFieldId;
			this.creationLink = null;
			
			$(this.inputFieldId).bind("enterKey", this.addEntityFromTextField.bind(this));
			$(this.inputFieldId).keyup(function(e){
			    if(e.keyCode == 13)
			    {
			        $(this).trigger("enterKey");
			    }
			});
		},

		setView: function(view) {
			this.view = view;
		},
		
		addEntityFromTextField: function() {
			var node = Object.create(Node);
			var nodeName = $(this.inputFieldId).val();
			node.init(nodeName, nodeName);
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