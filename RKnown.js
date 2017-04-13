var RKnown = {
		go: function(canvasId, suggestionsId, inputFieldId, modelFieldId, width, height) {
			this.model = Object.create(RModel);
			this.model.init();
			this.control = Object.create(RControl);
			this.control.init(this.model, inputFieldId, modelFieldId);
			this.view = Object.create(RView);
			this.view.init(canvasId, suggestionsId, width, height);
			this.view.setData(this.model);
			this.control.setView(this.view, inputFieldId);
			//this.view.updateSize();
			//this.control.loadGraph("http://test");
			this.graphFromUrl = this.gup('graphurl');
			this.graphidFromUrl = this.gup('graphid');

			if(this.userToken !== undefined) this.processUrlParams();
			this.view.updateSize();
		},


    gup: function( name )
    {
        name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
        var regexS = "[\\?&]"+name+"=([^&#]*)";
        var regex = new RegExp( regexS );
        var results = regex.exec( window.location.href );
        if( results == null )
            return null;
        else
            return results[1];
    },

	registerSharing: function( graphid ) {
        $.get("server/register-shared-graph.php?token="+RKnown.userToken+"&graphid="+graphid, null,
			this.loadGraphFromUrl.bind(this));

    },

	loadGraphFromUrl: function() {
		this.control.loadGraph(this.graphFromUrl);
	},

    processUrlParams: function() {
        if(this.graphidFromUrl != null) {
            this.registerSharing(this.graphidFromUrl);
        }
        else if(this.graphFromUrl != null) {
            this.loadGraphFromUrl();
        }
	}

}