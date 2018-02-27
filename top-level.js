Array.prototype.concatIfAbsent = function(item) {
    if(this.indexOf(item) < 0) {
        return this.concat(item);
    }
    return this;
};

Array.prototype.getShortests = function() {
    var shortests = [];
    var shortLength = 50;
    this.forEach(function(item) {
        if(item.length < shortLength) {
            shortests = [item];
            shortLength = item.length;
        } else if (item.length === shortLength && shortests.every(x => x.join() !== item.join())){
            shortests.push(item);
        }
    });
    return shortests;
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

$(document).ready(function(){
    var turnController = new TurnController(2,6,3,4,['red','blue'],5,5);
});