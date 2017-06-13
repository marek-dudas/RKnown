var RControl = {
		init: function(model, inputFieldId, modelFieldId) {
			this.model = model;
			this.linkStart = null;
			this.selectedNode = null;
			this.selectedValuation = null;
			this.blankNode = null;
			this.modelFieldId = '#'+modelFieldId;
			this.inputFieldId = '#'+inputFieldId;
			this.predicateInputFieldId = '#newPredicateField';
			this.typeInputFielId = '#typeField';
			this.creationLink = null;
			this.addingLiteral = false;
			this.relatedNodes = [];
			this.creationPredicate = null;
			this.newNodeLocation = [100,100];
			SparqlFace.config(this.fillInputField.bind(this), this.fillPredicateField.bind(this), this.addRelatedNodes.bind(this));
            var now = new Date();
            this.lastTickCount = now.getTime();
            this.justShownSuggestions = true;

            this.entityInputControl = Object.create(SuggestionsControl);
            this.entityInputControl.setSuggestionCall(function() {
                d3.select("#suggestionsWidget").style("left", $(RKnown.control.inputFieldId).offset().left+"px")
                    .style("top", ($(RKnown.control.inputFieldId).offset().top + $(RKnown.control.inputFieldId).outerHeight()) + "px");
                //SparqlFace.textSearch($(this).val(), URIS.object, RKnown.view.updateSuggestions.bind(RKnown.view));
                RKnown.control.updateSuggestions(RKnown.control.inputFieldId, URIS.object, RKnown.view.updateSuggestions.bind(RKnown.view));
			});

            this.predicateInputControl = Object.create(SuggestionsControl);
            this.predicateInputControl.setSuggestionCall(function() {
                d3.select("#suggestionsWidget").style("left", $(RKnown.control.predicateInputFieldId).offset().left+"px")
                    .style("top", ($(RKnown.control.predicateInputFieldId).offset().top + $(RKnown.control.predicateInputFieldId).outerHeight()) + "px");
                RKnown.control.updateSuggestions(RKnown.control.predicateInputFieldId, "<http://www.w3.org/2002/07/owl#ObjectProperty>", RKnown.view.updatePropSuggestions.bind(RKnown.view));
			});

            this.literalInputControl = Object.create(SuggestionsControl);
            this.literalInputControl.setSuggestionCall(function() {
                RKnown.control.addingLiteral = true;
                d3.select("#suggestionsWidget").style("left", $('#literalPredicateField').offset().left+"px")
                    .style("top", ($('#literalPredicateField').offset().top + $('#literalPredicateField').outerHeight()) + "px");
                RKnown.control.updateSuggestions($('#literalPredicateField'), "<http://www.w3.org/2002/07/owl#DataProperty>",
                    RKnown.view.updatePropSuggestions.bind(RKnown.view))
			});

            this.typeInputControl = Object.create(SuggestionsControl);
            this.typeInputControl.setSuggestionCall(function() {
                d3.select("#suggestionsWidget").style("left", $(RKnown.control.typeInputFielId).offset().left+"px")
                    .style("top", ($(RKnown.control.typeInputFielId).offset().top + $(RKnown.control.typeInputFielId).outerHeight()) + "px");
                RKnown.control.showTypeSuggestions();
			});
			
			$(this.inputFieldId).bind("enterKey", this.addEntityFromTextField.bind(this));
			$(this.inputFieldId).keyup(function(e){
			    if(e.keyCode == 13)
			    {
			        $(this).trigger("enterKey");
			    }
			    else {
			    	if($(this).val()!="") {
				    	RKnown.control.entityInputControl.keyPressed();
			    	}
			    	else d3.select("#suggestionsWidget").style("display", "none");
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
				    	RKnown.control.predicateInputControl.keyPressed();
			    	}
			    }
			});
			
			$('#literalPredicateField').keyup(function(e){
	    		RKnown.control.literalInputControl.keyPressed();
			})
			
			$(this.typeInputFielId).bind("enterKey", this.setTypeFromField.bind(this));
			$(this.typeInputFielId).keyup(function(e){
			    if(e.keyCode == 13)
			    {
			        $(this).trigger("enterKey");
			    }
			    else {
			    	RKnown.control.typeInputControl.keyPressed();
				}
			});

			$('#textSearchField').keyup(function(e){
				if(e.keyCode == 13) {
					RKnown.control.highlightSearch($(this).val());
				}
			});
			
			d3.select('#btnSave').on('click', this.save.bind(this));
			
			this.showAllGraphs();
		},

	highlightSearch: function(searchText) {
		for(var i=0; i<this.model.nodes.length; i++) {
			var node=this.model.nodes[i];
			if(searchText!="" && node.name.includes(searchText)) node.searchHighlight = true;
			else node.searchHighlight = false;
		}
		this.view.updateView();
	},

	getGraphLink: function(graph) {
			$.get("server/get-graph-link.php?graph=<"+graph.uri+">&token="+RKnown.userToken, null, function(response)
				{$('#graphUrlP').text(response); $('#graphUrlMessage').show();});
	},

	showTypeSuggestions: function() {
		var userInput = $(this.typeInputFielId).val();
		var suggestedTypes = [];
		for(var i=0; i<this.model.types.length; i++) {
			var type = this.model.types[i];
			if(type.label.includes(userInput)) suggestedTypes.push(type);
		}
		this.view.updateTypeSuggestions(suggestedTypes);
	},
		
		learningCBChanged: function() {
			this.view.layoutRunning = this.view.learningStateSet();
			this.view.updateView();
		},
		
		updateSuggestions: function(textSource, type, callback) {
			this.suggestionTextSource = textSource;
			this.suggestionCallback = callback;
			SparqlFace.textSearch($(textSource).val(), type, this.sendSuggestionsToView.bind(this)); //function(objects){RKnown.view.updateSuggestions(objects);})
		},

	sendSuggestionsToView: function(objects, isExtra) {
		var areRelevant = false;
		var currentTextInput = $(this.suggestionTextSource).val();
		if(currentTextInput == "") return null;
		for(var i=0; i<objects.length; i++) {
			if(objects[i].uri.includes(currentTextInput) || objects[i].name.includes(currentTextInput)) areRelevant = true;
		}
		if(areRelevant) this.suggestionCallback(objects, isExtra);
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
		
		showGraph: function(model) {
			this.model.empty();
			this.view.updateView();			
			this.model = model;
			/*
            for(var i=0; i<types.length; i++) this.model.addType(types[i]);
			for(var i=0; i<nodes.length; i++) {
				this.model.addNode(nodes[i]);
            }
			for(var i=0; i<links.length; i++) this.model.addLink(links[i]);*/
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
			if(this.selectedValuation == null) this.selectedNode.addValuation(newValuation);
			else {
                this.selectedValuation.setPredicate(newValuation.predicate);
                this.selectedValuation.setValue(newValuation.value);
                this.view.showNodeProperties(this.selectedNode);
            }
			d3.select('#literalInput').style("display", "none");
			this.creationPredicate = null;
            this.selectedValuation = null;
            this.showPredicateSelection(false);
		},
		
		addRelatedNodes: function(nodes) {
			var x=RSettings.nodeWidth/2;
			var y=RSettings.nodeHeight;
			var svgWidth = this.view.getRelatedSvgWidth();
			if(this.relatedNodes.length>0) {
				x = this.relatedNodes[this.relatedNodes.length-1].x+RSettings.nodeWidth;
				y = this.relatedNodes[this.relatedNodes.length-1].y+RSettings.nodeHeight;
			}
			for(var i=0; i<nodes.length; i++) {
				var node = nodes[i];
				var isNew = true;
				for(var j=0; j<this.relatedNodes.length; j++) {
				    if(this.relatedNodes[j].uri == node.uri) isNew = false;
                }
				if(isNew && this.model.getNodeByUri(node.uri) == null) {
					if(x+RSettings.nodeWidth/2>svgWidth) {
						x=RSettings.nodeWidth/2;
						y+=RSettings.nodeHeight;
					}
					node.x=x;
					node.y=y;
					x+=RSettings.nodeWidth;
					this.relatedNodes.push(node);
				}
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
			this.model.name = RSettings.graphUriBase+RKnown.userEmail+"/"+encodeURIComponent($(this.modelFieldId).val());
			SparqlFace.currentGraph = this.model.name;
			SparqlFace.graphSavedCallback = this.showAllGraphs.bind(this);
			SparqlFace.saveGraph(this.model.getRdf())
		},

		setView: function(view) {
			this.view = view;
		},
		
		showPredicateSelection: function(visible) {
			d3.select('#predicateSelection').style("display", visible?"block":"none");
			if(visible) {
                this.justShownSuggestions = true;
			    $(this.predicateInputFieldId).focus();
			    $(this.predicateInputFieldId).val("");
			    this.moveToMousePos(d3.select('#predicateSelection'));
            }
		},

    showEntityWidget: function(visible) {
        d3.select('#newEntityWidget').style("display", visible?"block":"none");
        if(visible) {
        	this.justShownSuggestions = true;
            $(this.inputFieldId).focus();
            $(this.inputFieldId).val("");
            this.moveToMousePos(d3.select('#newEntityWidget'));
        }
    },

    moveToMousePos: function(d3Sel) {
        var mousePos = d3.mouse(document.body);
        d3Sel.style("left", mousePos[0]+"px");
        d3Sel.style("top", mousePos[1]+"px");
        return mousePos;
    },
		
		predicateSelected: function(predicate) {
			if(this.creationLink != null) {
				this.creationLink.setUri(predicate.uri);
				this.creationLink.setName(predicate.name);
				this.addRelationLink();
			}
			if(this.addingLiteral) {
				$('#literalPredicateField').val(predicate.name);
				this.creationPredicate = predicate;
				this.addingLiteral = false;
			}
			this.view.updateView();
		},

	addRelationLink: function(){
		this.model.addRelationLink(this.creationLink);
		this.model.removeLink(this.creationLink);
		this.creationLink = null;
	},
		
		showTypeSelection: function(visible) {
            this.justShownSuggestions = true;
			d3.select('#typeSelection').style("display", visible?"block":"none");
            $(this.typeInputFielId).val("");
            $(this.typeInputFielId).focus();
            this.moveToMousePos(d3.select('#typeSelection'));
		},
		
		setPredicateNameFromField: function() {
			var enteredName = $(this.predicateInputFieldId).val();
			if(enteredName != "") {
                this.creationLink.setUri(this.createUriFromName(enteredName));
                this.creationLink.setName(enteredName);
            }
            else {
				this.creationLink.setUri(URIS.relatedToPredicate);
				this.creationLink.setName("");
			}
			this.showPredicateSelection(false);
			this.addRelationLink();
			this.view.updateView();
		},
		
		setTypeFromField: function(type) {
		/*
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
			this.model.addLink(link); */

		if(type==null || type.uri === undefined) {
			type = Object.create(RType);
			type.init(this.createUriFromName($(this.typeInputFielId).val()), $(this.typeInputFielId).val(), null);
		}

			this.model.addTypeToNode(this.selectedNode, type);
			this.showTypeSelection(false);
			this.view.updateView();
			
		},

	setColorFromPicker: function(jscolorPicker) {
		jscolorPicker._relatedRKnownType.setColor('#'+jscolorPicker);
		this.view.updateView();
	},
		
		getEntityUriBase: function() {
			return this.model.getEntityUriBase();
		},
		
		createUriFromName: function(name) {
			var localUri = name.replace(/[^a-zA-Z0-9]/g, "");
			return this.getEntityUriBase()+localUri;
		},
		
		addEntityFromTextField: function() {	
			var name = $(this.inputFieldId).val();			
			this.addEntity(this.createUriFromName(name), name);
			this.showEntityWidget(false);
		},
		
		addEntityFromUri: function(uri) {
			uri = SparqlFace.stripBrackets(uri);
			if(this.model.getNodeByUri(uri) == null) {
				var node = Object.create(Node);
				node.init(uri, SparqlFace.findLabel(uri));
				node.x = this.newNodeLocation[0];
				node.y = this.newNodeLocation[1];
				this.model.addNode(node);
			}
		},
		
		addLinkFromUri: function(from, link, to) {
			this.model.addLinkByUris(link, SparqlFace.findLabel(link), from, to);
		},
		
		addEntity: function(uri, name) {
			var node = Object.create(Node);
			node.init(uri, name);
			node.x = this.newNodeLocation[0];
			node.y = this.newNodeLocation[1];
			this.showEntityWidget(false);
			this.model.addNode(node);
			
			if(this.view.learningStateSet()) {
				SparqlFace.initLinkFinding();
				for(var i=0; i<this.model.nodes.length-1; i++) {
					SparqlFace.findLinksBetween(this.model.nodes[i], node);
				}
			}
			else {
				this.view.updateView();
				SparqlFace.getRelatedNodes(node);
			}
			return node;
		},
		
		mouseMove: function(location) {
			if(this.blankNode != null && this.linkStart != null) {
				this.blankNode.x = location[0]
				this.blankNode.y = location[1];
				this.view.updateView();
			}
		},

    dblClick: function(location) {
	    this.newNodeLocation = location;
	    this.showEntityWidget(true);
    },
		
		canvasMouseDown: function(location, node) {
			this.selectedValuation = null;
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
			    if(this.creationLink !=null) this.model.removeLink(this.creationLink);
			    this.creationLink = null;
				this.hidePopovers();
			}
			this.view.updateView();
		},
		
		hidePopovers: function() {
			d3.selectAll('.popover').style("display", "none");
		},
		
		
		valuationMouseOver: function(valuation) {
			if(valuation.value.startsWith('http')) {
				d3.select('#webFrame').attr('src', valuation.value);
				var mousePos = this.moveToMousePos(d3.select('#webInfo'));
				var winHeight = $(window).height();
				var winWidth = $(window).width();
                var webHeight = winHeight-mousePos[1]-12;
                var webWidth = $(window).width()-mousePos[0]-12;
                if(webHeight<winHeight/3.0) webHeight = winHeight/3;
                if(webWidth<winWidth/3.0) webWidth = winWidth/3;
                d3.select('#webInfo').style("display", "block")
                    .style("width", webWidth+"px")
                    .style("height", webHeight+"px")
                    .style("top",(winHeight-webHeight)+"px")
                    .style("left",(winWidth-webWidth)+"px");
			}
			else d3.select('#webInfo').style("display", "none");
		},
		
		putRelatedNode: function(location) {
			this.relatedNode.x = location[0];
			this.relatedNode.y = location[1];
			this.model.addNode(this.relatedNode);
			SparqlFace.loadLiteralsForObject(this.relatedNode);

            if(this.view.learningStateSet()) {
                SparqlFace.initLinkFinding();
                for(var i=0; i<this.model.nodes.length-1; i++) {
                    SparqlFace.findLinksBetween(this.model.nodes[i], this.relatedNode);
                }
            }

			this.view.updateView();
		},
		
		nodeMouseOver: function(node) {
			if(!d3.event.shiftKey) {
				this.selectNode(node, false);
				this.view.showNodeButtons(this.selectedNode.x+60, this.selectedNode.y);
				this.view.updateView();
				if(node.valuations.length > 0 || node.types.length > 0) {
					this.view.showNodeProperties(node);
                	this.view.showNodeTypes(node);
				}
				else this.hideNodeProperties();
			}
		},
		
		hideNodeProperties: function() {
			d3.select('#propertiesWidget').style("display", "none");
		},

		hideNodeTypes: function() {
			d3.select('#typesWidget').style("display", "none");
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
			this.view.showLiteralInput(this.selectedNode, null);
			$('#literalPredicateField').focus();
            $('#literalPredicateField').val("");
            $('#literalValue').val("");
			d3.event.stopPropagation();
		},

    editNodeProperty: function(valuation) {
			this.selectedValuation = valuation;
			this.creationPredicate = valuation.predicate;
        this.view.showLiteralInput(this.selectedNode, valuation);
        $('#literalValue').focus();
	},

    deleteNodeProperty: function(valuation) {
		this.selectedNode.deleteValuation(valuation);
		this.view.showNodeProperties(this.selectedNode);
	},

	deleteNodeType: function(type) {
		this.selectedNode.deleteType(type);
		this.view.updateView();
		this.view.showNodeTypes(this.selectedNode);
	},

    delButtonClick: function() {
		    if(this.selectedNode !=null) {
		        this.model.removeNode(this.selectedNode);
		        this.selectedNode = null;
		        this.view.updateView();
            }
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
			this.hidePopovers();
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