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

function wrap(text, textData, width) {
        text.selectAll("tspan").remove();
        var words = textData.split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.1, // ems
            y = text.attr("y"),
            dy = parseFloat(text.attr("dy")),
            tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
            }
        }
}

function showNodeText(selection) {
    selection.each(function(d) {
        var textSelection = d3.select(this).select("text");
        wrap(textSelection, d.name, d.width);
        var textSize = textSelection.node().getBBox();
        d.height = textSize.height + RSettings.nodeLabelMargin*2;
        d.width = textSize.width + RSettings.nodeLabelMargin*2;
        var newPosY = -d.height/2 + RSettings.nodeLabelMargin;
        textSelection.attr("y", newPosY);
        textSelection.selectAll("tspan").attr("y", newPosY);
        //wrap(textSelection, d.width);
    });
}