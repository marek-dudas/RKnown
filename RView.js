/**
 * 
 */

var RView = {
		init: function init(viewingElement, relatedCanvasElement, width, height) {
			
			this.width = 800;
			this.height = 600;
			
		    this.layoutRunning = false;
		    
		    this.viewingElement = d3.select("#"+viewingElement);
		    
		    this.relatedCanvas = d3.select("#"+relatedCanvasElement);
		    
		    this.relatedSvg = this.relatedCanvas.append("svg").attr("width", RSettings.relatedNodesCanvasWidth)
		    	.attr("height", height);
		    
		    this.relatedNodes = this.relatedSvg.append("svg:g").selectAll("g");
		    
		    this.graphs = d3.select("#graphs").selectAll("p");
			this.suggestions = d3.select("#suggestionTable").selectAll("tr");
			    
			this.svg = this.viewingElement
				.append("svg")
				.attr("width", width)
				.attr("height", height);
				
				
			this.svg.append('svg:defs').append('svg:marker')
			    .attr('id', 'end-arrow')
			    //.attr('viewBox', '0 -5 10 10')
			    .attr('refX', 9.5)
			    .attr('refY', 6)
			    .attr('markerWidth', 13)
			    .attr('markerHeight', 13)
			    .attr('orient', 'auto')
		  	.append('svg:path')
			    //.attr('d', 'M0,-5L10,0L0,5')
			    .attr('d', 'M2,2 L2,11 L10,6')
			    .style("fill", "#ccc");

			this.svg.append('svg:defs').append('svg:marker')
			    .attr('id', 'start-arrow')
			    .attr('viewBox', '0 -5 10 10')
			    .attr('refX', 4)
			    .attr('markerWidth', 3)
			    .attr('markerHeight', 3)
			    .attr('orient', 'auto')
		  	.append('svg:path')
		    	.attr('d', 'M10,-5L0,0L10,5')
		    	.attr('fill', '#000');
		    	
		    this.svg.append('svg:defs').append('filter')
		    	.attr('id', 'blur-filter').append('feGaussianBlur')
		    	.attr('stdDeviation',3);
		    
		    this.rootSvg = this.svg;	
		    
		    this.rootSvg.on("mousemove", function() {RKnown.control.mouseMove(d3.mouse(this));});
		    this.rootSvg.on("click", function() {
		    	var mouseDown = RKnown.control.canvasMouseDown.bind(RKnown.control);
		    	mouseDown(d3.mouse(this), null);})
		    
		    
		    this.svg = this.svg.append("svg:g");
		    
		    	
			this.nodes = this.svg.append("svg:g").selectAll("g");
			this.edges = this.svg.append("svg:g").selectAll("line");
			this.linktext = this.svg.append("svg:g").selectAll("g.linklabelholder");
			
			// create the zoom listener
			var zoomListener = d3.behavior.zoom()
			  .scaleExtent([0.1, 2])
			  .on("zoom", this.zoomHandler.bind(this));
			  //.on("dblclick.zoom", function(){});
			
			// function for handling zoom event			
					
			zoomListener(this.rootSvg);
			this.rootSvg.on("dblclick.zoom", null);
			
		    this.canvas = this.svg.append("svg:g");
		    
		    this.createLinkButton();
		    this.createTypeButton();		    
			
			//window.addEventListener('resize', this.updateSize.bind(this));
			
			//$(window).load(this.updateSize.bind(this));
		},
		
		updateGraphList: function() {
			this.graphs = this.graphs.data(RKnown.control.graphs);
			this.graphs.enter().append("p").append("a")
				.attr("href", "#")
				.text(function(d) {return d.uri;})
				.on("click", function(d) {RKnown.control.loadGraph(d.uri);});
		},
		
		createLinkButton: function() {
			var arc = d3.svg.symbol().type('triangle-up');

			this.linkButton = this.canvas.append('path')
			.attr('d',arc)
			.attr('fill', '#0a0')
			.attr('stroke','#000')
			.attr('stroke-width',1)
			.style("visibility", "hidden")
			.on("click", RKnown.control.linkButtonClick.bind(RKnown.control));
		},

		createTypeButton: function() {
			var arc = d3.svg.symbol().type('triangle-down');

			this.typeButton = this.canvas.append('path')
			.attr('d',arc)
			.attr('fill', '#00a')
			.attr('stroke','#000')
			.attr('stroke-width',1)
			.style("visibility", "hidden")
			.on("click", RKnown.control.typeButtonClick.bind(RKnown.control));
		},
		/*
		moveLinkButton: function(x,y) {
			this.linkButton.x = x;
			this.linkButton.y = y;
			
		},*/
		
		showNodeButtons: function(x,y) {
			this.linkButton.attr('transform',"translate("+(x+20)+","+(y-30)+")");
			this.linkButton.style("visibility", "visible");
			this.typeButton.attr('transform', "translate("+(x-30)+","+(y-30)+")");
			this.typeButton.style("visibility", "visible");
		},
		
		hideNodeButtons: function() {
			this.linkButton.style("visibility", "hidden");
			this.typeButton.style("visibility", "hidden");
		},			
		
		zoomHandler: function () {
			var scale = 1 - ( (1 - d3.event.scale) * 0.1 );
		  this.svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
		},
		
		updateSize: function() {
			var currentSize = this.viewingElement.node().getBoundingClientRect();
			this.rootSvg.attr("width", currentSize.width - 12).attr("height", currentSize.height - 12);
			if(this.layout) this.layout.size([currentSize.width-12, currentSize.height-12]);
		},
		
		startLayout: function() {
			this.tickCounter = 0;
			this.layout = d3.layout.force()
			    .size([this.width, this.height])
			    .nodes(this.model.nodes)
			    .links(this.model.links)
			    .linkDistance(150) //200
			    .charge(-1200) //-1500
			    .on("tick", this.tick.bind(this));
		},
		
		tick: function() {
		    
		    if(this.model.nodes.length>0 && this.nodes.length>0){
			    this.nodes.attr('transform', function(d) {
		    		return 'translate(' + d.x + ',' + d.y + ')';
		  		});
		    }
		    
			if(this.model.links.length>0 && this.edges.length>0){
				this.edges.attr("x1", function(d) { d.countStartFromIntersection(); return d.startX; })
			     .attr("y1", function(d) { return d.startY; })
			     .attr("x2", function(d) { d.countEndFromIntersection(); return d.endX;})
			     .attr("y2", function(d) { return d.endY; });
			     
			    this.linktext.attr('transform', function(d) {
			    	var p = d.getMiddlePoint();
		    		return 'translate(' + p.x + ',' + p.y + ')';}); 
		    }
		    
		},
		
		setData: function(model) {
			this.model = model;
			this.startLayout();
		},
		
		setDraggedNode: function(node) {
			
			this.dragSvg = d3.select("body").append("svg").style("position", "absolute")
						.style("z-index", 1000)
						.attr("overflow", "visible")
						.attr("width", node.width)
						.attr("height", node.height);
			
			this.dragButton = this.dragSvg.append("g").classed("node",true);
			
			var button = this.dragButton.append("path").attr("d", node.getPathData());
					//if(specialColor != null) button.style("fill", specialColor);
			this.dragButton.append("text").text(node.name)
				.attr("text-anchor", "middle")
				.attr("x", "0") //width/2+5)
				.attr("y","0")
			     .attr("dx", 1)
			     .attr("dy", ".35em");
		  		//.style("font-size", Math.min(node.width, (node.width - 8) 
		  		//	/ button.getComputedTextLength() * 12) + "px");
			
			var w = d3.select(window)
		    .on("mousemove", mousemove)
		    .on("mouseup", mouseup);

			d3.event.preventDefault(); // disable text dragging
			
			function mousemove() {
				RKnown.view.dragSvg.style("left", d3.mouse(d3.select("body").node())[0]+"px").style("top", d3.mouse(d3.select("body").node())[1]+node.height+"px");
			}
			
			function mouseup() {
				  w.on("mousemove", null).on("mouseup", null);
				  RKnown.view.dragSvg.remove();
				  RKnown.control.putRelatedNode(d3.mouse(RKnown.view.svg.node()));
			}
		},
		
		updateRelated: function() {
			this.relatedNodes = this.relatedNodes.data(RKnown.control.relatedNodes);
			var nodesEnter = this.relatedNodes.enter().append("g")
	        .classed("node",true)
	        .attr('transform', function(d) {
	    		return 'translate( '+d.x+', '+d.y+')';
	  		})
		  	.on("mousedown", function(d){
		  		  RKnown.control.relatedNodeMouseDown(d);
		  		});
	    nodesEnter.append("path")
	        .attr("d", function(d) {
	        	return d.getPathData();});	  
	        
	    nodesEnter.append("text")
	    	.classed("nodename", true)
	    	.text(function(d) { return d.name; })	    	
      		.style("font-size", function(d) { 
      			return Math.max(Math.min(16, Math.min(d.width, (d.width - 8) 
      			/ this.getComputedTextLength() * 14)), 13) + "px"; })      			
			.attr("x","0")//function(d) {return d.width/2+2;})
			.attr("y","0") 
		     .attr("dx", 1)
		     .attr("dy", ".35em");
		 	 
		 this.nodes.selectAll(".nodename").text(function(d) {return d.name;});
		 
		 this.relatedNodes.exit().remove();
		},
		
		updateSuggestions: function(data) {
			this.suggestions = this.suggestions.data(data, function(d){return d.uri});
			var suggestionsEnter = this.suggestions.enter().append("tr");
			suggestionsEnter.append("td").append("a")
				.attr("href", "#")
				.text(function(d) {return d.name;})
				.on("click", function(d) {
					RKnown.control.addEntity(d.uri, d.name);
					d3.select("#suggestionsWidget").style("visibility", "hidden");
					});
			suggestionsEnter.append("td").text(function(d) {d.getComment();})
			this.suggestions.exit().remove();
			d3.select("#suggestionsWidget").style("visibility", "visible");
		},
		
		updateView: function() {
			   
		    this.edges = this.edges.data(this.model.links, function(d) {return d.id;});    
		    
			this.edges.enter()
			        .append("line")
			        .style("stroke", "#ccc")
			        .style("stroke-width", 2)
				    .style('marker-start', function(d) { return d.left ? 'url(#start-arrow)' : ''; })
				    .style('marker-end', function(d) { return d.right ? 'url(#end-arrow)' : ''; })
				    .style("stroke-dasharray", function(d) {return d.dashed();});
				    
				    
			this.linktext = this.linktext.data(this.model.links, function(d) {return d.id;});
		    var linktextEnter =this.linktext.enter().append("g").attr("class", "linklabelholder")
			        .on("click", function(d){
			        	RKnown.control.canvasMouseDown(d3.mouse(this), d);
			        	d3.select("#predicateSelection")
		        		.style("left", (d3.event.clientX+30)+"px")
		        		.style("top", (d3.event.clientY+180)+"px")
			        	});
		     linktextEnter.append("text")
		     .attr("class", "linklabel")
		     .attr("dx", 1)
		     .attr("dy", ".35em")
		     .attr("text-anchor", "middle")
		     .text(function(d) { return d.name; });
		     linktextEnter.append("path")
			        .attr("d", Node.path(80,40))
			        .attr("class", "hiddenPath");
		    
		    this.linktext.selectAll(".linklabelholder text").text(function(d) { return d.name; });
		    
		    //if(this.model.getNodes().length>0){  
		    	this.edges.exit().remove();
		    	this.linktext.exit().remove();
		    	  
		    	var canvasSvg = this.svg;
			    this.nodes = this.nodes.data(this.model.nodes, function(d) {return d.id;});  
			    
			    var node_drag = d3.behavior.drag()
		        .on("dragstart", dragstart)
		        .on("drag", dragmove)
		        .on("dragend", dragend);
		        
		        var view = this;

			    function dragstart(d, i) {
			        view.layout.stop(); // stops the force auto positioning before you start dragging
			        d3.event.sourceEvent.stopPropagation();
			    }
			
			    function dragmove(d, i) {
			        d.px += d3.event.dx;
			        d.py += d3.event.dy;
			        d.x += d3.event.dx;
			        d.y += d3.event.dy; 
			        view.tick(); // this is the key to make it work together with updating both px,py,x,y on d !
			    }
			
			    function dragend(d, i) {
			        d.fixed = true; // of course set the node to fixed so the force doesn't include the node in its auto positioning stuff
			        view.tick();
			        if(view.layoutRunning) view.layout.resume();
			    }
			    
			    //this.nodes.enter()
			    var nodesEnter = this.nodes.enter().append("g")
			        .on("click", function(d){
			        	RKnown.control.canvasMouseDown(d3.mouse(this), d);
			        	d3.event.stopPropagation();
			        	})
			        .on('dblclick', function(d){
					     RKnown.control.nodeDblClick(d);
					      var text = d3.select(this).select("text")[0][0];
		    			  text.selectSubString(0,0);
		    			})
		    		.on('mouseover', function(d){
		    			RKnown.control.nodeMouseOver(d);
		    		})
			        .call(node_drag)
			        .classed("node",true)
			        .style("visibility", function(d) {return d.visible?"visible":"hidden";}); 
			        //.append("Scircle")
			        //.attr("r", 10)
			    nodesEnter.append("path")
			        .attr("d", function(d) {
			        	return d.getPathData();});	        	
			        //.style("fill", "#ccc");
			        
			    nodesEnter.append("text")
			    	.classed("nodename", true)
			    	.text(function(d) { return d.name; })	    	
		      		.style("font-size", function(d) { 
		      			return Math.max(Math.min(16, Math.min(d.width, (d.width - 8) 
		      			/ this.getComputedTextLength() * 14)), 13) + "px"; })      			
					.attr("x","0")//function(d) {return d.width/2+2;})
					.attr("y","0") 
				     .attr("dx", 1)
				     .attr("dy", ".35em");
				 	 
				 this.nodes.selectAll(".nodename").text(function(d) {return d.name;});   
				 this.nodes.selectAll("path").classed("selected", function(d) {return d.selected;});
				this.nodes.exit().remove();
		    
		    if(this.layoutRunning) this.layout.start();
		    this.tick();
		    
		}
};

Node.getPathData = function() {
	//this.width=90;
	//this.height=40;
	return this.path(this.width, this.height);
};

Node.path = function(width, height) {
	return "M"+(0)+","+(-height/2)+" a"+width/2+" "+height/2+" 0 1 0 1,0 z";	
}