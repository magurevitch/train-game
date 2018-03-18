Array.prototype.concatIfAbsent = function(item) {
    if(this.indexOf(item) < 0) {
        return this.concat(item);
    }
    return this;
};

Array.prototype.flatten = function() {
    return [].concat.apply([], this);
};

Array.prototype.chunk = function(size) {
    var chunks = [];
    while (this.length) {
        chunks.push(this.splice(0, size));
    }
    return chunks;
};

Array.prototype.transpose = function () {
    return this[0].map((column, i) => this.map(row => row[i]));
};

function range(limit,fill) {
    var array = [];
    for(var i = 0; i < limit; i++){
        array.push(fill ? fill : i);
    }
    return array;
}

$(document).ready(showWelcomeScreen);

function numberInput(id,value) {
    return `<input id="${id}" type="number" min=1 max=20 value="${value}"/>`;
}