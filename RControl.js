var RControl = {
		init: function(model, inputFieldId, modelFieldId) {
			this.model = model;
			this.linkStart = null;
			this.selectedNode = null;
			this.blankNode = null;
			this.modelFieldId = '#'+modelFieldId;
			this.inputFieldId = '#'+inputFieldId;
			this.predicateInputFieldId = '#newPredicateField';
			this.c = '#typeField';
			this.creationLink = null;
			this.addingLiteral = false;
			this.relatedNodes = [];
			this.creationPredicate = null;
			SparqlFace.config(this.fillInputField.bind(this), this.fillPredicateField.bind(this), this.addRelatedNodes.bind(this));
			//SparqlFace.getAllEntities();
			//SparqlFace.getAllPredicates();
			
			$(this.inputFieldId).bind("enterKey", this.addEntityFromTextField.bind(this));
			$(this.inputFieldId).keyup(function(e){
			    if(e.keyCode == 13)
			    {
			        $(this).trigger("enterKey");
			    }
			    else {
			    	if($(this).val()!="") {
				    	d3.select("#suggestionsWidget").style("left", $(this).position().left+"px")
				    		.style("top", ($(this).position().top + $(this).outerHeight()) + "px");
				    	SparqlFace.textSearch($(this).val(), "<http://rknown.com/RKnownObject>", RKnown.view.updateSuggestions.bind(RKnown.view));
			    	}
			    	else d3.select("#suggestionsWidget").style("visibility", "hidden");
			    }
			});
			
			$(this.predicateInputFieldId).bind("enterKey", this.setPredicateNameFromField.bind(this));
			$(this.predicateInputFieldId).keyup(function(e){
			    if(e.keyCode == 13)
			    {
			        $(this).trigger("enterKey");
			    }
			    else {
			    	if($(this).val() != "") {
				    	d3.select("#suggestionsWidget").style("left", $(this).parent().position().left+"px")
				    		.style("top", ($(this).position().top + $(this).parent().outerHeight()) + "px");
						SparqlFace.textSearch($(this).val(), "<http://www.w3.org/2002/07/owl#ObjectProperty>", RKnown.view.updatePropSuggestions.bind(RKnown.view))
			    	}
			    }
			});
			
			$('#literalPredicateField').keyup(function(e){
				d3.select("#suggestionsWidget").style("left", $(this).parent().position().left+"px")
				    		.style("top", ($(this).position().top + $(this).parent().outerHeight())*2 + "px");
						SparqlFace.textSearch($(this).val(), "<http://www.w3.org/2002/07/owl#DataProperty>", RKnown.view.updatePropSuggestions.bind(RKnown.view))
			})
			
			$(this.typeInputFielId).bind("enterKey", this.setTypeFromField.bind(this));
			$(this.typeInputFielId).keyup(function(e){
			    if(e.keyCode == 13)
			    {
			        $(this).trigger("enterKey");
			    }
			});
			
			d3.select('#btnSave').on('click', this.save.bind(this));
			
			this.showAllGraphs();
		},
		
		updateSuggestions: function(text, type) {
			SparqlFace.textSearch(text, type, function(objects){RKnown.view.updateSuggestions(objects);})
		},
		
		showAllGraphs: function() {
			SparqlFace.getGraphs(this.setGraphs.bind(this));
		},
		
		setGraphs: function(graphs) {
			this.graphs = [];
			for(var i=0; i<graphs.length; i++) this.graphs.push({uri:graphs[i], id:graphs[i]});
			this.view.updateGraphList();
		},
		
		loadGraph: function(graphUri) {
			$(this.modelFieldId).val(SparqlFace.nameFromUri(graphUri));
			SparqlFace.loadGraph(null, graphUri, this.showGraph.bind(this));
		},
		
		showGraph: function(nodes, links) {
			this.model.empty();
			this.view.updateView();			
			this.model = Object.create(RModel);
			this.model.init();
			for(var i=0; i<nodes.length; i++) this.model.addNode(nodes[i]);
			for(var i=0; i<links.length; i++) this.model.addLink(links[i]);
			RKnown.model = this.model;
			this.view.setData(this.model);
			this.view.updateView();
		},
		
		addLiteralButtonClick: function() {
			var newValuation = Object.create(Valuation);
			if(this.creationPredicate == null || this.creationPredicate.name!=$('#literalPredicateField').val()) {
				this.creationPredicate = Object.create(Node);
				this.creationPredicate.init(this.createUriFromName($('#literalPredicateField').val()),$('#literalPredicateField').val());
			}
			newValuation.setPredicate(this.creationPredicate);
			newValuation.setValue($('#literalValue').val());
			this.selectedNode.addValuation(newValuation);
			d3.select('#literalInput').style("visibility", "hidden");
			this.creationPredicate = null;
			this.showPredicateSelection(false);
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
			this.model.name = "http://test/"+($(this.modelFieldId).val());
			SparqlFace.currentGraph = this.model.name;
			SparqlFace.graphSavedCallback = this.showAllGraphs.bind(this);
			SparqlFace.saveGraph(this.model.getRdf())
		},

		setView: function(view) {
			this.view = view;
		},
		
		showPredicateSelection: function(visible) {
			d3.select('#predicateSelection').style("visibility", visible?"visible":"hidden");
		},
		
		predicateSelected: function(predicate) {
			if(this.creationLink != null) {
				this.creationLink.setUri(predicate.uri);
				this.creationLink.setName(predicate.name);
			}
			if(this.addingLiteral) {
				$('#literalPredicateField').val(predicate.name);
				this.creationPredicate = predicate;
			}
		},
		
		showTypeSelection: function(visible) {
			if(this.selectedNode!=null) {
				d3.select('#typeSelection').style("left", this.selectedNode.x+30)
				.style("top", this.selectedNode.y-30);
			}
			d3.select('#typeSelection').style("visibility", visible?"visible":"hidden");
		},
		
		setPredicateNameFromField: function() {
			this.creationLink.setUri(this.createUriFromName($(this.predicateInputFieldId).val()));
			this.creationLink.setName($(this.predicateInputFieldId).val());
			this.showPredicateSelection(false);
			this.view.updateView();
		},
		
		setTypeFromField: function() {
			var node = Object.create(Node);
			var nodeName = $(this.typeInputFielId).val();
			node.init(this.createUriFromName(nodeName), nodeName);
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
		
		getEntityUriBase: function() {
			return RSettings.uriBase;
		},
		
		createUriFromName: function(name) {
			var localUri = name.replace(/[^a-zA-Z0-9]/g, "");
			return this.getEntityUriBase()+localUri;
		},
		
		addEntityFromTextField: function() {	
			var name = $(this.inputFieldId).val();			
			this.addEntity(this.createUriFromName(name), name);
		},
		
		addEntity: function(uri, name) {
			var node = Object.create(Node);
			node.init(uri, name);
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
			if(this.linkStart != null && node!=null) {
				this.creationLink.setEnd(node);
				this.linkStart = null;
				this.selectedNode.selected = false;
				this.selectedNode = null;
				this.showPredicateSelection(true);
			}
			else if(this.linkStart != null) {
				this.linkStart = null;
				this.selectedNode.selected = false;
				this.selectedNode = null;
				this.model.removeLink(this.creationLink);
			}
			this.selectNode(node, d3.event.shiftKey);
			if(node==null) {
				d3.selectAll('.popover').style("visibility", "hidden");
			}
			this.view.updateView();
		},
		
		valuationMouseOver: function(valuation) {
			if(valuation.value.startsWith('http')) {
				d3.select('#webInfo').style("visibility", "visible");
				d3.select('#webFrame').attr('src', valuation.value);
			}
			else d3.select('#webInfo').style("visibility", "hidden");
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
				this.view.showNodeProperties(node);
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
			d3.event.stopPropagation();
		},
		
		literalButtonClick: function() {
			this.view.showLiteralInput(this.selectedNode);
			d3.event.stopPropagation();
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
			d3.event.stopPropagation();
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