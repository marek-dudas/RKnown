var PathPlaceholder = {
		init: function(s, p, o) {
			this.s = s;
			this.p = p;
			this.o = o;
		},
		isUnresolved: function(placeholder) {
			if(placeholder.startsWith("?")) return true;
			else return false;
		},
		placeHolderName: function(placeholder) {
			return placeholder.substring(1);
		},
		resolve: function(binding) {
			if(this.isUnresolved(this.s)) this.s = binding[this.placeHolderName(this.s)].value;
			if(this.isUnresolved(this.p)) this.p = binding[this.placeHolderName(this.p)].value;
			if(this.isUnresolved(this.o)) this.o = binding[this.placeHolderName(this.o)].value;
		}
};

var PathBuilder = {
		init: function(a, b, steps, reverseAt) {
			this.i = 1;
			this.limit = 10;
			this.query = "SELECT * WHERE {"; 
			this.currentEnd = a.brUri();
			this.bigEnd = b.brUri();
			this.placeholders = [];
			this.objects = [];
			this.links = [];
			this.processed = false;
			this.build(steps, reverseAt);
			this.pathFound = false;
		},
		addStep: function(isEnd, reverse1) {
			var thisEnd = (isEnd)?(this.bigEnd):("?o"+(this.i));
			var predicateHolder = "?l"+this.i;
			
			var strStraight1 = this.currentEnd + " "+predicateHolder+" "+thisEnd+" . ";
			var strReverse1 = thisEnd+" "+predicateHolder+" "+this.currentEnd + " . ";
			
			/*
			var strStraight2 = "?o"+this.i+" ?l"+(this.i+1)+" ?o"+(this.i+1)+" . ";
			var strReverse2 = "?o"+(this.i+1)+" ?l"+(this.i+1)+"?o"+this.i+" . ";*/
			
			this.query += (reverse1)?strReverse1:strStraight1;
			this.query += thisEnd + " <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "+URIS.object+" .";
			
			var pathHolder = Object.create(PathPlaceholder);
			if(reverse1) pathHolder.init(thisEnd, predicateHolder, this.currentEnd);
			else pathHolder.init(this.currentEnd, predicateHolder, thisEnd);
			
			this.placeholders.push(pathHolder);
			//this.query += (reverse2)?strReverse2:strStraight2;
			
			if(isEnd) this.endQuery();
			this.currentEnd = thisEnd;
			this.i++;
		},
		endQuery: function() {
			this.query += " } LIMIT "+this.limit;
		},
		build: function(steps, reverseAt) {
			for(var i=1; i<=steps; i++) {
				this.addStep(i==steps, i>=reverseAt);
			}
			SparqlFace.query(this.query, this.processResults.bind(this));
		},
		processResults: function(json) {
			for(var j=0; j<json.results.bindings.length; j++) {
				this.pathFound = true;
				var binding = json.results.bindings[j];
				for(var p=0; p<this.placeholders.length; p++) {
					this.placeholders[p].resolve(binding);
				}
			}
			this.processed = true;
			SparqlFace.pathBuilderProcessed();
		}		
}