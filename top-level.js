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

//taken from https://bost.ocks.org/mike/shuffle/
//This is the Fisher-Yates Shuffle
Array.prototype.shuffle = function () {
  var m = this.length, t, i;
  while (m) {
    i = Math.floor(Math.random() * m--);

    // And swap it with the current element.
    t = this[m];
    this[m] = this[i];
    this[i] = t;
  }
};

function range(limit,fill,start = 0) {
    var array = [];
    for(var i = start; i < limit; i++){
        array.push(fill ? fill : i);
    }
    return array;
}

$(document).ready(showWelcomeScreen);

function numberInput(id,value) {
    return `<input id="${id}" type="number" min=1 max=20 value="${value}"/>`;
}