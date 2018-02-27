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
    $('#game-board').append(welcomeScreen);
    $('#primary').html('<table><tr><th>Choose players</th></tr></table>')
    $('#primary').append('<td class="red"><input id="has-red" type="checkbox"/></td>');
    $('#primary').append('<td class="blue"><input id="has-blue" type="checkbox"/></td>');
    $('#primary').append('<td class="green"><input id="has-green" type="checkbox"/></td>');
    $('#secondary').append('<button>Populate game</button>');
    $('#secondary').on('click',function(){
        var players = ['red','blue','green'].filter(x=>$('#has-' + x + ':checked').val());
        players.unshift(players.pop());
        var turnController = new TurnController(
            $('#sections-up-and-down').val(),
            $('#rows-per-section').val(),
            $('#sections-across').val(),
            $('#columns-per-section').val(),
            players,
            $('#num-cards').val(),
            $('#close-dist').val(),
        );
    });
});

var welcomeScreen = '<table>' +
    '<tr><td>sections up and down</td><td colspan="3">sections across</td></tr>' +
    '<tr><td rowspan="5"><input id="sections-up-and-down" type="number" value="4"/></td>' + 
    '<td colspan="3"><input id="sections-across" type="number" value="4"/></td></tr>' +
    '<tr><td>rows per section</td><td colspan="2">columns per section</td></tr>' +
    '<tr><td rowspan="3"><input id="rows-per-section" type="number" value="4"/></td>' + 
    '<td colspan=2><input id="columns-per-section" type="number" value="4"/></td></tr>' +
    '<tr><td>deck size limit</td><td>closeness distance</td></tr>' +
    '<tr><td><input id="num-cards" type="number" value="4"/></td><td><input id="close-dist" type="number" value="4"/></td></tr>' +
    '</table>';
