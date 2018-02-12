Array.prototype.concatIfAbsent = function(item) {
    if(this.indexOf(item) < 0) {
        return this.concat(item);
    }
    return this;
}

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
}

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
}

function Board(width, height, players, numCards) {
    this.height = height;
    this.width = width;
    this.players = players;
    this.spaces = [];
    this.cardsLeft = [];
    this.cardsInPlay = [];
    this.cardsIndex = -1;
    this.trips = 0;
    
    for(var i = 0; i < this.height * this.width; i++) {
        this.spaces.push({'index':i});
        this.cardsLeft.push(numCards);
    }
}

Board.prototype.getNeighbors = function(index) {
    var neighbors = [];
    if(index >= this.width) {
        neighbors.push(index - this.width);
    }
    if((index % this.width) > 0) {
        neighbors.push(index - 1);
        }
    if((index % this.width) < (this.width - 1)) {
        neighbors.push(index + 1);
    }
    if((index + this.width) < (this.height * this.width)) {
        neighbors.push(index + this.width);
    }
    return neighbors;
};

Board.prototype.getNextStops = function(space, color) {
    var stations = [];
    
    var getNextSpaces = (space, previous, color) => {
        this.getNeighbors(space).forEach(neighbor => {
            if(neighbor !== previous && this.spaces[neighbor][color]) {
                if(this.spaces[neighbor].station || this.isJunction(neighbor,color)) {
                    stations.push(neighbor);
                } else {
                    getNextSpaces(neighbor, space, color);
                }
            }
        });
    };
    
    getNextSpaces(space,null,color);
    
    return stations;
};

Board.prototype.setColor = function(space,color,value) {
    this.spaces[space][color] = value;
    this.depopulate(space);
};

Board.prototype.setStation = function(space,value) {
    this.spaces[space].station = value;
};

Board.prototype.createsJunction = function(space,color) {
    var surrounding = this.getNeighbors(space).filter(x => this.spaces[x][color]);
    if(surrounding.length > 2 && this.spaces[space].station) {
        return true;
    }
    
    return surrounding.some(x => {
        var moreSurrounding = this.getNeighbors(x).filter(x => this.spaces[x][color] || x === space);
        return moreSurrounding.length > 2 && !this.spaces[x].station;
    });
};

Board.prototype.isJunction = function(space,color) {
    var surrounding = this.getNeighbors(space).filter(x => this.spaces[x][color]);
    return surrounding.length > 2 && !this.spaces[space].station;
};

Board.prototype.bestPath = function(start, end) {
    var visited = [];
    var next, temp;
    
    var add = function(space,temp) {
        var others = temp.filter(x => x.space === next.space && x['current mode'] === next['current mode'] && x.modes === next.modes);
        if(others.length === 0) {
            temp.push(next);
        }
    };
    
    var getAdditions = function(nextSpots,modes,mode) {
        var nexts = nextSpots.filter(y => visited.indexOf(y) < 0);
        nexts.forEach(y => {
            next = {'space':y, 'modes':modes, 'current mode':mode};
            add(next,temp);
        });
    };
    
    var helper = (current,step) => {
        var winners = current.filter(x => x.space === end && ((!x['current mode']) || this.spaces[x.space].station));
        if (winners.length > 0) {
            var modes = winners.map(x => x.modes).getShortests();
            return {'steps': step,'modes':modes};
        } else {
            temp = [];
            current.forEach(x => {
                if(x['current mode'] === false || this.spaces[x.space].station) {
                    visited.push(x.space);
                    getAdditions(this.getNeighbors(x.space),x.modes,false);
                }
                
                if(x['current mode']) {
                    getAdditions(this.getNextStops(x.space,x['current mode']),x.modes,x['current mode']);
                }
                
                if(this.spaces[x.space].station){
                    var stations = this.players.filter(y => y !== x['current mode'] && this.spaces[x.space][y]);
                    stations.forEach(y => {
                        next = {'space':x.space, 'modes':x.modes.concatIfAbsent(y) , 'current mode':y};
                        add(next,temp);
                    });
                }
            });
            return helper(temp,step + 1);
        }
    };
    
    return helper([{'space': start, 'modes':[], 'current mode':false}],0);
};

Board.prototype.getOptions = function(space,color) {
    if(this.spaces[space][color]) {
        if(this.spaces[space].station) {
            return 'remove station';
        }
        return 'build station';
    }
    if(this.players.some(x => this.spaces[space][x])) {
        return 'track 2';
    }
    return 'track 1';
}

Board.prototype.addCard = function(index) {
    if(this.cardsLeft[index] > 0) {
        this.cardsLeft[index]--;
        this.cardsInPlay.push(index);
    }
}

Board.prototype.chooseCard = function() {
    if(this.cardsIndex < 1) {
        this.cardsInPlay.shuffle();
        this.cardsIndex = this.cardsInPlay.length;
        this.trips++;
    }
    this.cardsIndex--;
    return this.cardsInPlay[this.cardsIndex];
}

//This uses the rule that if you have it in the cards left to draw, you discard until you find it
Board.prototype.depopulate = function(card) {
    var index = this.cardsInPlay.lastIndexOf(card);
    if(index > -1) {
        if(index < this.cardsIndex) {
            this.cardsIndex = index;
        }
        this.cardsInPlay.splice(index,1);
    }
}

function TurnController(width,height,players,numCards,closeDist) {
    this.board = new Board(width,height,players,numCards);
    this.turnOrder = players;
    this.actions = 2;
    this.scores = {};
    this.closeDist = closeDist;
    players.forEach(player => this.scores[player] = 0);
    this.populate();
}

TurnController.prototype.populate = function(){
    $('#turns td').attr('colspan',this.turnOrder.length);
    this.updateTurnOrder();
    
    var width = this.board.spaces.slice(0,this.board.width).map(x => x.index);
    var height = this.board.spaces.slice(0,this.board.height).map(x => x.index);
    $('#game-board').append('<tr><th></th><th>' + width.join('</th><th>') + '</th></tr>');
    height.forEach(function(j){
        $('#game-board').append('<tr><th>' + j + width.map(function(i){return '<td id=' + (j*width.length + i) + '>' + (j*width.length + i) + '</td>'}).join('') + '</th></tr>');
    });
    this.populateCity();
}

TurnController.prototype.updateTurnOrder = function() {
    $('#turn-order').html("");
    $('#scores').html("");
    var scores = this.scores;
    this.turnOrder.forEach(function(player){
        $('#turn-order').append('<td class=' + player + '>' + player + '</td>');
        $('#scores').append('<td class=' + player + '>' + scores[player] + '</td>');
    });
}

TurnController.prototype.getRandom = function() {
    return Math.floor(Math.random() * this.board.height * this.board.width);
}

TurnController.prototype.populateCity = function() {
    //These update turns
    var last = this.turnOrder.shift();
    this.turnOrder.push(last);
    this.updateTurnOrder();
    $('#build').removeClass(last);
    $('#add-in').addClass(this.turnOrder[0]);
    
    var card = this.getRandom();
    $('#active').html(card);
    this.board.addCard(card);
}

TurnController.prototype.tripPhase = function() {
    function helper(tripsLeft) {
        if(tripsLeft == 0) {
            console.log('ready for next phase');
        } else {
            console.log(tripsLeft);
            helper(tripsLeft - 1);
        }
    }
    helper(this.board.trips);
}

TurnController.prototype.takeTrip = function() {
    var start = this.board.chooseCard();
    var end = this.board.chooseCard();
    $('#active').html(start + ' -> ' + end);
    $('#flips').html(this.board.trips);
    
    var winners = this.board.bestPath(start,end);
    
    if(winners.steps < this.closeDist) {
        $('#primary').html('<th>choose who to intensify:</th>');
        var neighbors = this.board.getNeighbors(end).filter(x => this.board.cardsLeft[x] > 0);
        neighbors.forEach(neighbor => {
            $('#' + neighbor).addClass('highlight');
            $('#primary').append('<td>' + neighbor + '</td>');
        });
        
        var board = this.board;
        $('#primary td').on('click',function(){
            var spot = parseInt($(this).html());
            board.addCard(spot);
            $('#primary').html("");
            $('td').removeClass('highlight');
            $('#active').html(spot);
        });
    } else {
        $('#primary').html('distance: ' + winners.steps);
    }

    if(winners.modes.length > 1) {
        $('#secondary').html('<th>choose the winners:</th>');
        winners.modes.forEach(mode => {
            $('#secondary').append('<td>' + mode.join() + '</td>');
            var child = $('#secondary td').last();
            mode.forEach(path => child.addClass(path));
            child.on('click',() => {
                this.scoreWinners(mode);
                $('#secondary').html("");
            });
        });
    } else {
        this.scoreWinners(winners.modes[0]);
    }
}

TurnController.prototype.scoreWinners = function(winners) {
    var score = (winners.length > 1) ? 1 : 2;
    winners.forEach(x => this.scores[x] += score);
    this.updateTurnOrder();
}

$(document).ready(function(){
    var turnController = new TurnController(10,10,['red','blue','green'],5,6);
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
    
    turnController.populateCity();
    turnController.takeTrip();
    turnController.tripPhase();
});