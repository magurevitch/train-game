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

function range(limit,fill) {
    var array = [];
    for(var i = 0; i < limit; i++){
        array.push(fill ? fill : i);
    }
    return array;
}

$(document).ready(function(){
    var turnController = new TurnController(10,10,['red','blue','green'],5,5);
    [2,12,22,32,42,52,62,72,82,92].forEach(x => {
        turnController.board.setColor(x,'red',true);
        $('#' + x).addClass('red');
    });
    [4,14,24,34,44,54,64,74,84,94].forEach(x => {
        turnController.board.setColor(x,'blue',true);
        $('#' + x).addClass('blue');
    });
    [20,21,22,23,24,25,26,27].forEach(x => {
        turnController.board.setColor(x,'green',true);
        $('#' + x).addClass('green');
    });
    [2,4,20,23,27,92,94].forEach(x => {
        turnController.board.setStation(x,true);
        $('#' + x).addClass('station');
    });
});