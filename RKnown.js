var RKnown = {
		go: function(canvasId, suggestionsId, inputFieldId, width, height) {
			this.model = Object.create(RModel);
			this.model.init();
			this.control = Object.create(RControl);
			this.control.init(this.model, inputFieldId);
			this.view = Object.create(RView);
			this.view.init(canvasId, suggestionsId, width, height);
			this.view.setData(this.model);
			this.control.setView(this.view, inputFieldId);
			//this.control.loadGraph("http://test");
		}
}