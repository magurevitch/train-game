function TurnController(neighborhoodRows,rowsPerNeighborhood,neighborhoodColumns,columnsPerNeighborhood,players,numCards,closeDist,farDist,buildTurns) {
    this.board = new Board(neighborhoodColumns*columnsPerNeighborhood,neighborhoodRows*rowsPerNeighborhood,players,buildTurns);
    this.neighborhoodCards = new Cards(neighborhoodRows*neighborhoodColumns,numCards,"neighborhood");
    this.plotCards = new Cards(rowsPerNeighborhood*columnsPerNeighborhood,numCards,"plot")
    this.buildTurns = buildTurns;
    
    this.turnOrder = players;
    this.closeDist = closeDist;
    this.farDist = farDist;
    this.scores = {};
    players.forEach(player => this.scores[player] = 0);
    
    populateGame(players,buildTurns,neighborhoodRows,rowsPerNeighborhood,neighborhoodColumns,columnsPerNeighborhood);
    chooseHazards(this.board.spaces,neighborhoodColumns*columnsPerNeighborhood,columnsPerNeighborhood);
    this.startGame(rowsPerNeighborhood,columnsPerNeighborhood);
}

TurnController.prototype.startGame = function(rowsPerNeighborhood,columnsPerNeighborhood){
    this.updateTurnOrder();
    $('#secondary').html('<th>Start game</th>').on('click',() => {
        $('th,td,#secondary').off('click');
        
        $('#neighborhood-pop td').first().html('Neighborhood population');
        $('#plot-pop td').first().html('Plot population');
        
        $('#secondary').html('')
        
        this.populateCity();
    });
};

TurnController.prototype.updateTurnOrder = function() {
    $('#turn-order,#scores').html("");
    this.turnOrder.forEach(player => {
        $('#turn-order').append(`<td class=${player}>${player}</td>`);
        $('#scores').append(`<td class=${player}>${this.scores[player]}</td>`);
    });
};

TurnController.prototype.renderBoard = function() {
    var spaces = this.board.spaces;
    var indices = range(spaces.length);
    
    this.turnOrder.map(function(x){
        $('#game-board td').removeClass(x);
        indices.filter(y => spaces[y][x]).map(y => $('#' + y).addClass(x));
    });
    
    $('div').removeClass('local station');
    indices.filter(y => spaces[y].station).map(y => $(`#${y} div`).addClass('station'));
    indices.filter(y => spaces[y].station === 'local').map(y => $(`#${y} div`).addClass('local'));
};

TurnController.prototype.updateCards = function () {
    [this.neighborhoodCards,this.plotCards].forEach(x => this.updateCardSection(x));
};

TurnController.prototype.updateCardSection = function (pile) {
    $('#' + pile.type).html("");
    [pile.type,pile.cardsIndex,pile.leftInDrawPile(),pile.trips,pile.queue.join(', ')]
        .forEach(x=>$('#' + pile.type).append(`<td>${x}</td>`));
    
    pile.cardsLeft.forEach((value,index) => {
        $(`#${pile.type}-${index}`).html(pile.numCards - value);
    });
};

TurnController.prototype.getRandom = function(length) {
    return Math.floor(Math.random() * length);
};

TurnController.prototype.takeNextTurn = function (buildsLeft) {
    if(buildsLeft > 0) {
        this.buildTurn(buildsLeft);
    } else {
        var last = this.turnOrder.shift();
        this.turnOrder.push(last);
        this.updateTurnOrder();
    
        $('#build,#build div').removeClass(last);
        $('td').removeClass('highlight').off('click');
    
        $('#primary,#secondary').html('');
        this.populateCity();
    }
};

TurnController.prototype.populateCity = function() { 
    $('#add-in').addClass(this.turnOrder[0]);

    [this.neighborhoodCards,this.plotCards].forEach(x => {
        x.fillQueue();
        this.updateCards();
    });
    
    $('.highlight').not('.second').addClass('light');
    
    $('#turns,#game-board,#cards').on('click', () => {
        $('#turns,#game-board,#cards').off('click');
        $('td').removeClass('strong light highlight second');
        $('#add-in').removeClass(this.turnOrder[0]);
        $('#trips').addClass(this.turnOrder[0]);
        
        this.takeTrip(() => this.buildFirst());
    });
};

TurnController.prototype.intensify = function(nextTurn,steps,end) {
    if(steps <= this.closeDist) {
        $('#secondary').html('<th>Intensify:</th>');
        [this.neighborhoodCards,this.plotCards].forEach((x,i) => this.intensifyPile(x, end[i+1]));
    }
    
    var that = this;
    
    $('#primary, #secondary, #game-board').on('click', function() {
        $('#primary, #secondary, #game-board').off();
        that.takeTrip(nextTurn);
    });
};

TurnController.prototype.intensifyPile = function(cardPile, value) {
    $(`.${cardPile.type}-${value}.highlight`).removeClass('light');
    $(`.${cardPile.type}-${value}`).not('.highlight').addClass('light highlight');
    $('#secondary').append(`<td>${cardPile.type}: ${value}</td>`);
    cardPile.addCard(value);
    this.updateCardSection(cardPile);
};

TurnController.prototype.chooseTiles = function() {
    var neighborhood = this.neighborhoodCards.queue.shift();
    var plot = this.plotCards.queue.shift();
    this.updateCards();
    var tile = parseInt($(`.plot-${plot}.neighborhood-${neighborhood}`).attr('id'));
    return [tile, neighborhood, plot];
};

TurnController.prototype.takeTrip = function(nextTurn) {
    $('td').removeClass('strong light highlight');
    
    var smallest = Math.min(this.neighborhoodCards.queue.length,this.plotCards.queue.length);
    
    if(smallest < 2){
       $('#primary').html('');
       nextTurn();
    } else {
        var start = this.chooseTiles();
        var end = this.chooseTiles();
        $('#primary').html(start.slice(1).join() + ' -> ' + end.slice(1).join());
        
        var winners = this.board.bestPath(start[0],end[0]);
        var steps = winners.steps;
        
        $(`#${start[0]},#${end[0]}`).addClass('strong highlight');
        winners.path.forEach(x=>$('#'+x).addClass('light highlight'));
        $(`#${start[0]},#${end[0]}`).removeClass('light');
        
        $('#primary').append(`<th>distance:</th><td>${steps}</td>`);
    
        if(winners.modes.length > 1) {
            $('#secondary').html('<th>choose the winners:</th>');
            winners.modes.forEach(mode => {
                $('#secondary').append(`<td>${mode.join()}</td>`);
                var child = $('#secondary td').last();
                mode.forEach(path => child.addClass(path));
                child.on('click',() => {
                    $('td').removeClass('strong light highlight')
                    this.scoreWinners(mode, steps);
                    $('#secondary').html("");
                    this.intensify(nextTurn, steps, end);
                });
            });
        } else {
            this.scoreWinners(winners.modes[0], steps);
            this.intensify(nextTurn, steps, end);
        }
    }
};

TurnController.prototype.scoreWinners = function(winners, steps) {
    if (steps < this.farDist){
        var score = (winners.length > 1) ? 1 : 2;
        winners.forEach(x => {
            this.scores[x] += score;
            $('#scores .' + x).addClass('highlight').html(this.scores[x]);
        });
    }
};

TurnController.prototype.buildHelper = function(coordinates,optionName,popCondition) {
    this.renderBoard();
    $('#primary,#secondary,#tertiary').html("").off();
    $('#game-board td').removeClass('highlight').off();
    
    if(optionName === 'build station' || optionName === 'intensify space'){
        [this.neighborhoodCards,this.plotCards].forEach((x,i) => {
            x.drawCards(1);
            x.queue.unshift(coordinates[i]);
        });
        
        this.takeTrip(() => this.takeNextTurn(popCondition));
    } else {
        this.takeNextTurn(popCondition);
    }
};

TurnController.prototype.buildTurn = function(number){
    var player = this.turnOrder[0];
    var that = this;
    $('#build div').slice(0,-number).addClass(player);
    
    $("#game-board td").on('click',function() {
        $("#game-board td").removeClass('highlight')
        $(this).addClass('highlight');
        var space = $(this).attr('id');
        var options = that.board.getOptions(space,player);
        var coordinates = $(this).attr('class').split(' ').filter(x => x.indexOf('-') > -1);
        var coordinateNumbers = coordinates.map(x => x.replace(/[^0-9\.]/g, ''));
        
        var addTurn = function(choice,place) {
            if (choice.turns > number) {
                place.html('<th>This move is illegal</th><td>Try another square</td>');
            } else {
                place.append(`<th>action:</th><td>${choice.text}</td>`);
                place.on('click',function(){
                    choice['function']();
                    that.buildHelper(coordinateNumbers,choice.text,number-choice.turns);
                });
            }
        };
        
        $('#primary,#secondary,#tertiary').html("").off();

        $('#secondary').html(`<th>player:</th><td class="${player}">${player}</td>`);
        $('#primary').html(`<th>space:</th><td>${coordinates.join(', ').replace(/-/g,': ')}</td>`);

        addTurn(options.shift(),$('#primary'));
        if(options.length > 0) {
            addTurn(options.shift(),$('#secondary'));
        }
        
        addTurn({'text':'intensify space','function':()=>{
            that.neighborhoodCards.addCard(coordinateNumbers[0]);
            that.plotCards.addCard(coordinateNumbers[1]);
        },'turns':1},$('#tertiary'));
        
    });
};

TurnController.prototype.buildFirst = function() {
    $('#build div').addClass('circle');
    $("#trips").removeClass(this.turnOrder[0]);
    $("#build").addClass(this.turnOrder[0]);
    this.buildTurn(this.buildTurns);
};