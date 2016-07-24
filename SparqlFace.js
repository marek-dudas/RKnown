var SparqlFace = {
		config: function(config) {
			this.config = config;
		},
		saveTriple: function(triple) {
			
		},
		nameFromUri: function(uri) {
			return uri.match("[^\/#]+$");
		}
}