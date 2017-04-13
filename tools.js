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

function selectText(containerid) {
    if (document.selection) {
        var range = document.body.createTextRange();
        range.moveToElementText(document.getElementById(containerid));
        range.select();
    } else if (window.getSelection) {
        var range = document.createRange();
        range.selectNode(document.getElementById(containerid));
        window.getSelection().addRange(range);
    }
}