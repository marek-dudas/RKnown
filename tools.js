/**
 * Created by marek on 24.2.2017.
 */
d3.selection.prototype.dblTap = function(callback) {
    var last = 0;
    return this.each(function() {
        d3.select(this).on("touchstart", function(e) {
            if ((d3.event.timeStamp - last) < 500) {
                return callback(e);
            }
            last = d3.event.timeStamp;
        });
    });
}