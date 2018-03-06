function TurnController(sectionRows,rowsPerSection,sectionColumns,columnsPerSection,players,numCards,closeDist) {
    this.board = new Board(sectionColumns*columnsPerSection,sectionRows*rowsPerSection,players);
    this.sectionCards = new Cards(sectionRows*sectionColumns,numCards,"section");
    this.rowCards = new Cards(rowsPerSection,numCards,"row");
    this.columnCards = new Cards(columnsPerSection,numCards,"column");
    this.sectionRows = sectionRows;
    this.rowsPerSection = rowsPerSection;
    this.sectionColumns = sectionColumns;
    this.columnsPerSection = columnsPerSection;
    
    this.turnOrder = players;
    this.closeDist = closeDist;
    this.scores = {};
    players.forEach(player => this.scores[player] = 0);
    
    this.populateGame();
}

TurnController.prototype.populateGame = function(){
    $('#secondary').html('').off('click');
    $('#turns td').attr('colspan',this.turnOrder.length);
    this.updateTurnOrder();
    
    var rowHeaders = '<table><tbody/>' + range(this.sectionRows).map(x => '<tbody>' +
        range(this.rowsPerSection).map(y =>`<tr><th class="sr-${x}">${y}</th></tr>`).join('') +
    '</tbody>').join('') + '</table>';
    
    var fullNumber = this.sectionColumns*this.columnsPerSection*this.sectionRows*this.rowsPerSection;
    var rowSize = this.sectionColumns*this.columnsPerSection;
    var chunked = range(fullNumber).chunk(rowSize).map(x => x.chunk(this.columnsPerSection)).transpose().map(x => x.chunk(this.rowsPerSection));
    var html = chunked.map(
        (w,a) => '<table></th>' + range(this.columnsPerSection).map(x => `<th>${x}</th>`).join('') + '</tr>' + w.map(
            (x,b) => `<tbody class="sr-${b}">` + x.map(
                (y,c) => '<tr>' + y.map(
                    (z,d) => `<td id=${z} class="section-${a+b*this.sectionColumns} row-${c} column-${d}"><div><div></div></div></td>`
                ).join("") + '</tr>'
            ).join("") + '</tbody>'
        ).join("") + '</table>'
    ).join("");
    
    $('#game-board').html(rowHeaders + html);
    
    html = range(this.sectionRows).map(row => 
        '<tr>' + range(this.sectionColumns).map(column => `<td id="section-${this.sectionColumns*row+column}">${this.sectionColumns*row+column}</td>`).join('') + '</tr>'
    ).join('');
    $('#section-pop').html(`<table><tr><td colspan="${this.sectionColumns}">Choose section</td></tr>${html}</table>`);
    
    this.chooseHazards();
};

TurnController.prototype.chooseHazards = function() {
    var spaces = this.board.spaces;
    function toggleHazard(space) {
        space.toggleClass('hazard');
        spaces[space.attr('id')].hazard = !spaces[space.attr('id')].hazard;
    }
    
    $('#game-board td').on('click', function() {toggleHazard($(this));});
    
    $('#game-board th').on('click',function() {
        $(this).parents('table').find('.column-' + $(this).html()).each((i,x) => toggleHazard($(x)));
        $('#game-board').find(`.${$(this).attr('class')} .row-${$(this).html()}`).each((i,x) => toggleHazard($(x)));
    });
    
    $('#section-pop td').on('click', function(){
        $('#game-board').find(`.${$(this).attr('id')}`).each((i,x) => toggleHazard($(x)));
    });
    
    $('#primary').html('Click a space to toggle if it is a hazard. The row/column marker toggles the whole row. The section bit in the corner toggles a section.');
    html = range(this.sectionRows).map(row => 
        '<tr>' + range(this.sectionColumns).map(column => `<td id="section-${this.sectionColumns*row+column}"></td>`).join('') + '</tr>'
    ).join('');
    $('#secondary').html('<th>Start game</th>').on('click',() => {
        $('th,#secondary').off('click');
        
        $('#column-pop').html(`<table><tr><td colspan=${this.columnsPerSection}>Column population</td></tr><tr>${range(this.columnsPerSection).map(column => '<td id="column-' + column + '"></td>').join('')}</tr><table>`);
        $('#row-pop').html(`<table><tr><td rowspan=${this.rowsPerSection}>Row population</td><td id="row-${range(this.rowsPerSection).join('"></td></tr><tr><td id="row-')}"></td></tr><table>`);
        $('#section-pop td').first().html('Section population');
        
        this.populateCity();
    });
};

TurnController.prototype.updateTurnOrder = function() {
    $('#turn-order').html("");
    $('#scores').html("");
    var scores = this.scores;
    this.turnOrder.forEach(function(player){
        $('#turn-order').append(`<td class=${player}>${player}</td>`);
        $('#scores').append(`<td class=${player}>${scores[player]}</td>`);
    });
};

TurnController.prototype.renderBoard = function() {
    var spaces = this.board.spaces;
    var indices = range(spaces.length);
    
    this.turnOrder.map(function(x){
        $('#game-board td').removeClass(x);
        indices.filter(y => spaces[y][x]).map(y => $('#' + y).addClass(x));
    });
    
    $('div').removeClass('station');
    indices.filter(y => spaces[y].station).map(y => $(`#${y} div`).addClass('station'));
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

TurnController.prototype.populateCity = function() {
    var last = this.turnOrder.shift();
    this.turnOrder.push(last);
    this.updateTurnOrder();
    
    $('#build,#build div').removeClass(last);
    $('td').removeClass('highlight').off('click');
    $('#add-in').addClass(this.turnOrder[0]);
    
    $('#primary,#secondary').html('');
    
    [this.sectionCards,this.rowCards,this.columnCards].forEach(x => {
        var card = this.getRandom(x.cardsLeft.length);
        $(`.highlight.${x.type}-${card}`).addClass('second');
        $(`.${x.type}-${card}`).addClass('highlight');
        $('#primary').append(`<th>${x.type}:</th><td>${card}</td>`);
        x.addCard(card);
        x.fillQueue();
        this.updateCards();
    });
    
    $('.highlight').not('.second').addClass('light');
    
    $('#turns,#game-board,#cards').on('click', () => {
        $('#turns,#game-board,#cards').off('click');
        $('td').removeClass('light highlight second');
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
            $('td').removeClass('highlight');
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
    $('td').removeClass('highlight');
    
    var smallest = Math.min(this.sectionCards.queue.length,this.rowCards.queue.length,this.columnCards.queue.length);
    
    if(smallest < 2){
       $('#primary').html('');
       nextTurn();
    } else {
        var start = this.chooseTiles();
        var end = this.chooseTiles();
        $('#primary').html(start.slice(1).join() + ' -> ' + end.slice(1).join());
        $(`#${start[0]},#${end[0]}`).addClass('highlight');
        
        var winners = this.board.bestPath(start[0],end[0]);
        $('#primary').append(`<th>distance:</th><td>${winners.steps}</td>`);
    
        if(winners.modes.length > 1) {
            $('#secondary').html('<th>choose the winners:</th>');
            winners.modes.forEach(mode => {
                $('#secondary').append(`<td>${mode.join()}</td>`);
                var child = $('#secondary td').last();
                mode.forEach(path => child.addClass(path));
                child.on('click',() => {
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
    var coordinateNumbers = coordinates.map(x => x.replace(/[^0-9\.]/g, ''));
    this.renderBoard();
    $('#primary,#secondary').html("").off();
    $('#game-board td').removeClass('highlight').off();
    
    var nextTurn = ()=>(popCondition > 0 ? this.buildTurn(popCondition) : this.populateCity());
    
    //this.cards.depopulate(space);
    //this.updateCards();
    
    if(optionName === 'build station'){
        [this.sectionCards,this.rowCards,this.columnCards].forEach((x,i) => {
            x.drawCards(1);
            x.queue.unshift(coordinateNumbers[i]);
        });
        
        this.takeTrip(nextTurn);
    } else {
        nextTurn();
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
        
        $('#primary,#secondary').off();
        
        if(options.turns > number) {
            $('#primary').html('<th>This move is illegal</th>');
            $('#secondary').html('<td>Try another square</td>');
        } else {
            $('#primary').html(`<th>space:</th><td>${coordinates.join(', ').replace(/-/g,': ')}</td><th>action:</th><td>${options.text}</td>`);
            $('#primary').on('click',function() {
                options['function']();
                that.buildHelper(coordinates,options.text,number-options.turns);
            });
            
            $('#secondary').html(`<th>player:</th><td class="${player}">${player}</td>`);
            
            if(options.alternate){
                $('#secondary').append(`<th>secondary action:</th><td>${options.alternate}</td>`);
                $('#secondary').on('click',function() {
                    options['alternate function']();
                    that.buildHelper(coordinates,options.alternate,number-options.turns);
                });
            }
        }
    });
};

TurnController.prototype.buildFirst = function() {
    $('#build div').addClass('circle');
    $("#trips").removeClass(this.turnOrder[0]);
    $("#build").addClass(this.turnOrder[0]);
    this.buildTurn(2);
};