var RKnown = {
		go: function(canvasId, inputFieldId, width, height) {
			this.model = Object.create(RModel);
			this.model.init();
			this.control = Object.create(RControl);
			this.control.init(this.model, inputFieldId);
			this.view = Object.create(RView);
			this.view.init(canvasId, width, height);
			this.view.setData(this.model);
			this.control.setView(this.view, inputFieldId);
		}
}