function Board(width, height, players, difficultBuild) {
    this.width = width;
    this.players = players;
    this.difficultBuild = difficultBuild;
    this.spaces = range(height*width).map(x => {return {};});
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
    return neighbors.filter(x => x > -1 && x < this.spaces.length);
};

Board.prototype.getNextStops = function(space, color, isLocal) {
    var stations = [];
    
    var getNextSpaces = (space, color, visited, stationFunction) => {
        this.getNeighbors(space).forEach(neighbor => {
            if(visited.indexOf(neighbor) < 0 && this.spaces[neighbor][color]) {
                if(stationFunction(neighbor) || this.isJunction(neighbor,color)) {
                    stations.push({'stop':neighbor,'path':visited.concat(space)});
                } else {
                    getNextSpaces(neighbor,color,visited.concat(space),stationFunction);
                }
            }
        });
    };
    
    getNextSpaces(space,color,[],space=>this.spaces[space].station);
    if(!isLocal) {
        getNextSpaces(space,color,[],space=>this.spaces[space].station === true);
    }
    
    return stations;
};

Board.prototype.setColor = function(space,color,value) {
    this.spaces[space][color] = value;
};

Board.prototype.setStation = function(space,value) {
    this.spaces[space].station = value;
};

Board.prototype.isJunction = function(space,color) {
    var surrounding = this.getNeighbors(space).filter(x => this.spaces[x][color]);
    return surrounding.length > 2;
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
    
    var getAdditions = function(nextSpots,modes,mode,squares) {
        nextSpots.map(x => typeof x === 'number' ? {'stop':x,'path':[]} : x)
            .filter(y => visited.indexOf(y.stop) < 0).forEach(y => {
                next = {'space':y.stop, 'modes':modes, 'current mode':mode,'squares':squares.concat(y.path).concat(y.stop)};
                add(next,temp);
        });
    };
    
    var helper = (current,step) => {
        var winners = current.filter(x => x.space === end && x['current mode'] !== 'hazard');
        if (winners.length > 0) {
            var modes = getShortestPath(winners);
            return {'steps': step,'modes':modes.map(x=>x.modes),'path':modes.map(x=>x.squares).flatten()};
        } else {
            temp = [];
            current.forEach(x => {
                if(x['current mode'] === 'hazard') {
                    getAdditions([x.space],x.modes,false,x.squares);
                } else {
                    if (x['current mode'] === false ||  this.spaces[x.space].station) {
                        visited.push(x.space);
                        var mode = this.spaces[x.space].hazard ? 'hazard' : false;
                        getAdditions(this.getNeighbors(x.space),x.modes,mode,x.squares);
                    }
                
                    if(x['current mode']) {
                        var nextStops = this.getNextStops(x.space,x['current mode'],this.spaces[x.space].station ==='local');
                        getAdditions(nextStops,x.modes,x['current mode'],x.squares);
                    }
                
                    if(this.spaces[x.space].station){
                        var stations = this.players.filter(y => y !== x['current mode'] && this.spaces[x.space][y]);
                        stations.forEach(y => {
                            next = {'space':x.space, 'modes':x.modes.concatIfAbsent(y) , 'current mode':y, 'squares':x.squares};
                            add(next,temp);
                        });
                    }
                }
            });
            return helper(temp,step + 1);
        }
    };
    return helper([{'space': start, 'modes':[], 'current mode': false,'squares':[]}],0);
};

Board.prototype.getOptions = function(space,color) {
    if(this.spaces[space][color]) {
        if(this.spaces[space].station === true) {
            return [
                {'text':'remove station','function':()=>this.setStation(space,false),'turns':1},
                {'text':'make station local','function':()=>this.setStation(space,'local'),'turns':1}
            ];
        } else if(this.spaces[space].station === 'local') {
            return [{'text':'make station regular','function':()=>this.setStation(space,true),'turns':1}];
        }
        return [
            {'text':'build station','function':()=>this.setStation(space,true),'turns':1},
            {'text':'remove tracks','function':()=>this.setColor(space,color,false),'turns':1}
        ];
    }
    if(this.players.some(x => this.spaces[space][x])) {
        return [{'text':'build track underneath','function':()=>this.setColor(space,color,true),'turns':this.difficultBuild}];
    }
    if(this.spaces[space].hazard) {
        return [{'text':'build track in rough terrain','function':()=>this.setColor(space,color,true),'turns':this.difficultBuild}];
    }
    return [{'text':'build track','function':()=>this.setColor(space,color,true),'turns':1}];
};

function Cards(numberOfCards,numCards,type) {
    this.cardsLeft = range(numberOfCards,numCards);
    this.numCards = numCards;
    this.cardsInPlay = [];
    this.type = type;
    this.cardsIndex = 0;
    this.trips = 0;
    this.queue = [];
}

Cards.prototype.leftInDrawPile = function() {
    return this.cardsInPlay.length - this.cardsIndex;
};

Cards.prototype.fillQueue = function() {
    this.drawCards(this.trips);
};

Cards.prototype.drawCards = function(limit) {
    if(this.cardsIndex < 1 && limit) {
        this.cardsInPlay.shuffle();
        this.cardsIndex = this.cardsInPlay.length;
        this.trips++;
    }
    
    while(this.queue.length < limit && this.cardsIndex !== 0) {
        this.cardsIndex--;
        this.queue.push(this.cardsInPlay[this.cardsIndex]);
    }
};

Cards.prototype.addCard = function(index) {
    if(this.cardsLeft[index] > 0) {
        this.cardsLeft[index]--;
        this.cardsInPlay.push(index);
    }
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

function getShortestPath(array) {
    var shortests = [];
    var shortLength = 50;
    array.forEach(function(item) {
        if(item.modes.length < shortLength) {
            shortests = [item];
            shortLength = item.modes.length;
        } else if (item.modes.length === shortLength && shortests.every(x => x.modes.join() !== item.modes.join())){
            shortests.push(item);
        }
    });
    return shortests;
};