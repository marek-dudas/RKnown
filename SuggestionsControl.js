/**
 * Created by marek on 5.5.2017.
 */

var SuggestionsControl = {

    setSuggestionCall: function(callback) {
      this.showSuggestionsCall = callback;
    },

    keyPressed: function() {
        var now = new Date();
        this.lastTickCount = now.getTime();
        setTimeout(this.checkWaitAndCall.bind(this), RSettings.suggestionWaitTime);
    },

    checkWaitAndCall: function() {
       if(this.suggestionsWaited()) {
           this.showSuggestionsCall();
       }
    },

    suggestionsWaited: function () {
        var now = new Date();
        var ticks = now.getTime();
        var waitedLongEnough = ( (ticks - this.lastTickCount) >= RSettings.suggestionWaitTime );
        return waitedLongEnough;
    }
}
