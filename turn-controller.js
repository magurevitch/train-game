function TurnController(sectionRows,rowsPerSection,sectionColumns,columnsPerSection,players,numCards,closeDist,buildTurns) {
    this.board = new Board(sectionColumns*columnsPerSection,sectionRows*rowsPerSection,players,buildTurns);
    this.sectionCards = new Cards(sectionRows*sectionColumns,numCards,"section");
    this.rowCards = new Cards(rowsPerSection,numCards,"row");
    this.columnCards = new Cards(columnsPerSection,numCards,"column");
    this.buildTurns = buildTurns;
    
    this.turnOrder = players;
    this.closeDist = closeDist;
    this.scores = {};
    players.forEach(player => this.scores[player] = 0);
    
    populateGame(players,buildTurns,sectionRows,rowsPerSection,sectionColumns,columnsPerSection);
    chooseHazards(this.board.spaces);
    this.startGame(rowsPerSection,columnsPerSection);
}

TurnController.prototype.startGame = function(rowsPerSection,columnsPerSection){
    this.updateTurnOrder();
    $('#secondary').html('<th>Start game</th>').on('click',() => {
        $('th,td,#secondary').off('click');
        
        $('#column-pop').html(`<table><tr><td colspan=${columnsPerSection}>Column population</td></tr><tr>${range(columnsPerSection).map(column => '<td id="column-' + column + '"></td>').join('')}</tr><table>`);
        $('#row-pop').html(`<table><tr><td rowspan=${rowsPerSection}>Row population</td><td id="row-${range(rowsPerSection).join('"></td></tr><tr><td id="row-')}"></td></tr><table>`);
        $('#section-pop td').first().html('Section population');
        
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
    [this.sectionCards,this.rowCards,this.columnCards].forEach(x => this.updateCardSection(x));
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

    [this.sectionCards,this.rowCards,this.columnCards].forEach(x => {
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
    var doNext = () => this.takeTrip(nextTurn);
    
    $('#secondary').html('<th>choose who to intensify:</th>');
    [this.sectionCards,this.rowCards,this.columnCards].forEach((x,i) =>
        $('#secondary').append(this.chooseIntensifier(doNext,end[i+1],x))
    );
    
    if(steps > this.closeDist || $('#secondary').children().length === 1) {
        $('#secondary').html('');
        $('#game-board').one('click',doNext);
    } else if ($('#secondary').children().length === 2) {
        $('#game-board').one('click',()=>$('#secondary').children().last().click());
    }
};

TurnController.prototype.chooseIntensifier = function(doNext,value,cardPile) {
    if(cardPile.cardsLeft[value] > 0) {
        return $('<td>' + cardPile.type + ': ' + value + '</td>').hover(
            function(){$('.'+cardPile.type+'-'+value).addClass('highlight');$(this).addClass('highlight');},
            function(){$('.'+cardPile.type+'-'+value).removeClass('highlight');$(this).removeClass('highlight');}
        ).on('click',function(){
            cardPile.addCard(value);
            $('td').removeClass('light highlight');
            $('#secondary').html("");
            doNext();
        });
    }
};

TurnController.prototype.chooseTiles = function() {
    var section = this.sectionCards.queue.shift();
    var row = this.rowCards.queue.shift();
    var column = this.columnCards.queue.shift();
    this.updateCards();
    var tile = parseInt($(`.row-${row}.column-${column}.section-${section}`).attr('id'));
    return [tile, section,row, column];
};

TurnController.prototype.takeTrip = function(nextTurn) {
    $('td').removeClass('strong light highlight');
    
    var smallest = Math.min(this.sectionCards.queue.length,this.rowCards.queue.length,this.columnCards.queue.length);
    
    if(smallest < 2){
       $('#primary').html('');
       nextTurn();
    } else {
        var start = this.chooseTiles();
        var end = this.chooseTiles();
        $('#primary').html(start.slice(1).join() + ' -> ' + end.slice(1).join());
        
        var winners = this.board.bestPath(start[0],end[0]);
        
        $(`#${start[0]},#${end[0]}`).addClass('strong highlight');
        winners.path.forEach(x=>$('#'+x).addClass('light highlight'));
        $(`#${start[0]},#${end[0]}`).removeClass('light');
        
        $('#primary').append(`<th>distance:</th><td>${winners.steps}</td>`);
    
        if(winners.modes.length > 1) {
            $('#secondary').html('<th>choose the winners:</th>');
            winners.modes.forEach(mode => {
                $('#secondary').append(`<td>${mode.join()}</td>`);
                var child = $('#secondary td').last();
                mode.forEach(path => child.addClass(path));
                child.on('click',() => {
                    $('td').removeClass('strong light highlight')
                    this.scoreWinners(mode);
                    $('#secondary').html("");
                    this.intensify(nextTurn,winners.steps,end);
                });
            });
        } else {
            this.scoreWinners(winners.modes[0]);
            this.intensify(nextTurn,winners.steps,end);
        }
    }
};

TurnController.prototype.scoreWinners = function(winners) {
    var score = (winners.length > 1) ? 1 : 2;
    winners.forEach(x => {
        this.scores[x] += score;
        $('#scores .' + x).addClass('highlight').html(this.scores[x]);
    });
};

TurnController.prototype.buildHelper = function(coordinates,optionName,popCondition) {
    this.renderBoard();
    $('#primary,#secondary,#tertiary').html("").off();
    $('#game-board td').removeClass('highlight').off();
    
    //this.cards.depopulate(space);
    //this.updateCards();
    
    if(optionName === 'build station' || optionName === 'intensify space'){
        [this.sectionCards,this.rowCards,this.columnCards].forEach((x,i) => {
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
            that.sectionCards.addCard(coordinateNumbers[0]);
            that.rowCards.addCard(coordinateNumbers[1]);
            that.columnCards.addCard(coordinateNumbers[2]);
        },'turns':1},$('#tertiary'));
        
    });
};

TurnController.prototype.buildFirst = function() {
    $('#build div').addClass('circle');
    $("#trips").removeClass(this.turnOrder[0]);
    $("#build").addClass(this.turnOrder[0]);
    this.buildTurn(this.buildTurns);
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