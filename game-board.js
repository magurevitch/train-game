function Board(width, height, players) {
    this.height = height;
    this.width = width;
    this.players = players;
    this.spaces = range(this.height*this.width).map(x => {return {};});
}

Board.prototype.getNeighbors = function(index) {
    var neighbors = [index-this.width];
    if((index % this.width) > 0) {
        neighbors.push(index - 1);
    }
    if((index % this.width) < (this.width - 1)) {
        neighbors.push(index + 1);
    }
    neighbors.push(index + this.width);
    return neighbors.filter(x => x > -1 && x < this.height * this.width);
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
            return {'text':'remove station','function':()=>this.setStation(space,false)};
        }
        return {
            'text':'build station',
            'function':()=>this.setStation(space,true),
            'alternate':'remove tracks',
            'alternate function':()=>this.setColor(space,color,false),
        };
    }
    if(this.players.some(x => this.spaces[space][x])) {
        return {'text':'build track underneath','function':()=>this.setColor(space,color,true),'two turn':true};
    }
    return {'text':'build track','function':()=>this.setColor(space,color,true)};
};

function Cards(numberOfCards,numCards) {
    this.cardsLeft = range(numberOfCards,numCards);
    this.cardsInPlay = [];
    this.cardsIndex = -1;
    this.trips = 0;
}

Cards.prototype.addCard = function(index) {
    if(this.cardsLeft[index] > 0) {
        this.cardsLeft[index]--;
        this.cardsInPlay.push(index);
    }
};

Cards.prototype.chooseCard = function() {
    if(this.cardsIndex < 1) {
        this.cardsInPlay.shuffle();
        this.cardsIndex = this.cardsInPlay.length;
        this.trips++;
    }
    this.cardsIndex--;
    return this.cardsInPlay[this.cardsIndex];
};

//This uses the rule that if you have it in the cards left to draw, you discard until you find it
Cards.prototype.depopulate = function(card) {
    var index = this.cardsInPlay.lastIndexOf(card);
    if(index > -1) {
        if(index < this.cardsIndex) {
            this.cardsIndex = index;
        }
        this.cardsInPlay.splice(index,1);
    }
};