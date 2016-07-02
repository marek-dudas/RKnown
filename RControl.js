var RControl = {
		init: function(model, inputFieldId) {
			this.model = model;
			this.linkStart = null;
			this.selectedNode = null;
			this.inputFieldId = '#'+inputFieldId;
			
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
		
		canvasMouseDown: function(location, node) {
			this.selectNode(node, d3.event.shiftKey);
			this.view.updateView();
		},
		
		selectNode: function(node, noDeselectFirs) {
			if(!noDeselectFirst || node == null) {
				for(var i=0; i<this.model.nodes.length; i++){
					this.model.nodes[i].selected = false;
				}
			}
			if(node!=null) {
				node.selected = true;
				this.selectedNode = node;
			}
			else {
				this.selectedNode = null;
			}
		}
}