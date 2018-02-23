function TurnController(sectionRows,rowsPerSection,sectionColumns,columnsPerSection,players,numCards,closeDist) {
    this.board = new Board(sectionColumns*columnsPerSection,sectionRows*rowsPerSection,players);
    this.sectionCards = new Cards(sectionRows*sectionColumns,numCards);
    this.rowCards = new Cards(rowsPerSection,numCards);
    this.columnCards = new Cards(columnsPerSection,numCards);
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
    $('#turns td').attr('colspan',this.turnOrder.length);
    this.updateTurnOrder();
    
    var fullNumber = this.sectionColumns*this.columnsPerSection*this.sectionRows*this.rowsPerSection;
    var rowSize = this.sectionColumns*this.columnsPerSection;
    var chunked = range(fullNumber).chunk(rowSize).map(x => x.chunk(this.columnsPerSection)).transpose().map(x => x.chunk(this.rowsPerSection));
    var html = chunked.map(
        (w,a) => '<table>' + w.map(
            (x,b) => '<tbody>' + x.map(
                (y,c) => '<tr>' + y.map(
                    (z,d) => '<td id=' + z + ' class="section-' + (a+b*this.sectionColumns) + ' row-' + c + ' column-' + d +'">' + z + '</td>'
                ).join("") + '</tr>'
            ).join("") + '</tbody>'
        ).join("") + '</table>'
    ).join("");
    
    $('#game-board').html(html);
    this.populateCity();
};

TurnController.prototype.updateTurnOrder = function() {
    $('#turn-order').html("");
    $('#scores').html("");
    var scores = this.scores;
    this.turnOrder.forEach(function(player){
        $('#turn-order').append('<td class=' + player + '>' + player + '</td>');
        $('#scores').append('<td class=' + player + '>' + scores[player] + '</td>');
    });
};

TurnController.prototype.renderBoard = function() {
    var spaces = this.board.spaces;
    var indices = range(spaces.length);
    
    this.turnOrder.concat('station').map(function(x){
        $('#game-board td').removeClass(x);
        indices.filter(y => spaces[y][x]).map(y => $('#' + y).addClass(x));
    });
};

TurnController.prototype.getRandom = function(length) {
    return Math.floor(Math.random() * length);
};

TurnController.prototype.populateCity = function() {
    var last = this.turnOrder.shift();
    this.turnOrder.push(last);
    this.updateTurnOrder();
    
    $('#build').removeClass(last);
    $('#add-in').addClass(this.turnOrder[0]);
    
    //#active
    [this.rowCards,this.columnCards,this.sectionCards].forEach(x => {
        var card = this.getRandom(x.cardsLeft.length);
        x.addCard(card);
    });
    
    //go on to next phase
    $('#turns').on('click', () => {
        $('#turns').off('click');
        $('#add-in').removeClass(this.turnOrder[0]);
        $('#trips').addClass(this.turnOrder[0]);
        var numberOfTrips = Math.min(this.rowCards.trips,this.columnCards.trips,this.sectionCards.trips);
        this.takeTrip(numberOfTrips);
    });
};

TurnController.prototype.intensify = function(times,steps,end) {
    var doNext = () => typeof times === 'function'? times() : this.takeTrip(times-1);
    
    if(steps < this.closeDist) {
        $('#secondary').html('<th>choose who to intensify:</th>');
        $('#secondary').append(this.chooseIntensifier(doNext,"row",end[1],this.rowCards));
        $('#secondary').append(this.chooseIntensifier(doNext,"column",end[2],this.columnCards));
        $('#secondary').append(this.chooseIntensifier(doNext,"section",end[3],this.sectionCards));
    } else {
        doNext();
    }
};

TurnController.prototype.chooseIntensifier = function(doNext,name,value,cardPile) {
    return $('<td>' + name + ': ' + value + '</td>').hover(
        function(){$('.'+name+'-'+value).addClass('highlight');$(this).addClass('highlight');},
        function(){$('.'+name+'-'+value).removeClass('highlight');$(this).removeClass('highlight');}
    ).on('click',function(){
        cardPile.addCard(value);
        $('td').removeClass('highlight');
        $('#secondary').html("");
        //$('#active').html(spot);
        doNext();
    });
};

TurnController.prototype.chooseTiles = function() {
    var row = this.rowCards.chooseCard();
    var column = this.columnCards.chooseCard();
    var sector = this.sectionCards.chooseCard();
    var tile = parseInt($('.row-'+row+'.column-'+column+'.section-'+sector).attr('id'));
    return [tile, row, column, sector];
};

TurnController.prototype.takeTrip = function(times) {
    if(times < 1){
        $('#primary').html('');
       this.buildFirst();
    } else {
        var start = this.chooseTiles();
        var end = this.chooseTiles();
        $('#active').html(start[0] + ' -> ' + end[0]);
        //reörganize #flips
        
        var winners = this.board.bestPath(start[0],end[0]);
        
        $('#primary').html('<th>distance:</th><td>' + winners.steps + '</td>');
    
        if(winners.modes.length > 1) {
            $('#secondary').html('<th>choose the winners:</th>');
            winners.modes.forEach(mode => {
                $('#secondary').append('<td>' + mode.join() + '</td>');
                var child = $('#secondary td').last();
                mode.forEach(path => child.addClass(path));
                child.on('click',() => {
                    this.scoreWinners(mode);
                    $('#secondary').html("");
                    this.intensify(times,winners.steps,end);
                });
            });
        } else {
            this.scoreWinners(winners.modes[0]);
            this.intensify(times,winners.steps,end);
        }
    }
};

TurnController.prototype.scoreWinners = function(winners) {
    var score = (winners.length > 1) ? 1 : 2;
    winners.forEach(x => this.scores[x] += score);
    this.updateTurnOrder();
};

TurnController.prototype.buildHelper = function(space,optionName,popCondition) {
    this.renderBoard();
    $('#primary,#secondary').off();
    $('#primary,#secondary').html("");
    $('#game-board td').off();
    $('#game-board td').removeClass('highlight');
    var nextTurn = ()=>(popCondition ? this.populateCity() : this.buildSecond());
    
    //this.cards.depopulate(space);
    
    if(optionName === 'build station'){
        this.takeTrip(nextTurn);
    } else {
        nextTurn();
    }
};

TurnController.prototype.buildFirst = function() {
    $("#trips").removeClass(this.turnOrder[0]);
    $("#build").addClass(this.turnOrder[0]);
    $("active").html("<td>o</td><td>o</td>");
    
    var player = this.turnOrder[0];
    var that = this;
    
    $("#game-board td").on('click',function() {
        $("#game-board td").removeClass('highlight');
        $(this).addClass('highlight');
        var space = $(this).html();
        var options = that.board.getOptions(space,player);
        
        $('#primary,#secondary').off();
        $('#primary').html('<th>space:</th><td>' + space + '</td><th>action:</th><td>' + options.text + '</td>');
        $('#primary').on('click',function() {
            options['function']();
            that.buildHelper(space,options.text,options['two turn']);
        });
        
        $('#secondary').html('<th>player:</th><td>' + player + '</td>');
        
        if(options.alternate){
            $('#secondary').append('<th>secondary action:</th><td>' + options.alternate + '</td>');
            $('#secondary').on('click',function() {
                options['alternate function']();
                that.buildHelper(space,options.text,options['two turn']);
            });
        }
    });
};

TurnController.prototype.buildSecond = function() {
    $("active").html("<td>x</td><td>o</td>")
    var player = this.turnOrder[0];
    var that = this;
    
    $("#game-board td").on('click',function() {
        $("#game-board td").removeClass('highlight')
        $(this).addClass('highlight');
        var space = $(this).html();
        var options = that.board.getOptions(space,player);
        
        $('#primary,#secondary').off();
        
        if(options['two turn']) {
            $('#primary').html('<th>This move is illegal</th>');
            $('#secondary').html('<td>Try another square</td>');
        } else {
            $('#primary').html('<th>space:</th><td>' + space + '</td><th>action:</th><td>' + options.text + '</td>');
            $('#primary').on('click',function() {
                options['function']();
                that.buildHelper(space,options.text,true);
            });
            
            $('#secondary').html('<th>player:</th><td>' + player + '</td>');
            
            if(options.alternate){
                $('#secondary').append('<th>secondary action:</th><td>' + options.alternate + '</td>');
                $('#secondary').on('click',function() {
                    options['alternate function']();
                    that.buildHelper(space,options.text,true);
                });
            }
        }
    });
};