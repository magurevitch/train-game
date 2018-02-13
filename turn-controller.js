function TurnController(width,height,players,numCards,closeDist) {
    this.board = new Board(width,height,players);
    this.cards = new Cards(width*height,numCards);
    this.turnOrder = players;
    this.actions = 2;
    this.scores = {};
    this.closeDist = closeDist;
    players.forEach(player => this.scores[player] = 0);
    this.populateGame();
}

TurnController.prototype.populateGame = function(){
    $('#turns td').attr('colspan',this.turnOrder.length);
    this.updateTurnOrder();
    
    var width = range(this.board.width);
    var height = range(this.board.height);
    $('#game-board').append('<tr><th></th><th>' + width.join('</th><th>') + '</th></tr>');
    height.forEach(function(j){
        $('#game-board').append('<tr><th>' + j + width.map(function(i){return '<td id=' + (j*width.length + i) + '>' + (j*width.length + i) + '</td>';}).join('') + '</th></tr>');
    });
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

TurnController.prototype.getRandom = function() {
    return Math.floor(Math.random() * this.cards.cardsLeft.length);
};

TurnController.prototype.populateCity = function() {
    var last = this.turnOrder.shift();
    this.turnOrder.push(last);
    this.updateTurnOrder();
    
    $('#build').removeClass(last);
    $('#add-in').addClass(this.turnOrder[0]);
    
    var card = this.getRandom();
    $('#active').html(card);
    this.cards.addCard(card);
    
    //go on to next phase
    $('#turns').on('click', () => {
        $('#turns').off('click');
        $('#add-in').removeClass(this.turnOrder[0]);
        $('#trips').addClass(this.turnOrder[0]);
        this.takeTrip(this.cards.trips);
    });
};

TurnController.prototype.intensify = function(times,steps,end) {
    if(steps < this.closeDist) {
        $('#secondary').html('<th>choose who to intensify:</th>');
        var neighbors = this.board.getNeighbors(end).filter(x => this.cards.cardsLeft[x] > 0);
        neighbors.forEach(neighbor => {
            $('#' + neighbor).addClass('highlight');
            $('#secondary').append('<td>' + neighbor + '</td>');
        });
        
        var that = this;
        $('#secondary td,td.highlight').on('click',function(){
            var spot = parseInt($(this).html());
            that.cards.addCard(spot);
            $('#secondary').html("");
            $('td').off('click');
            $('td').removeClass('highlight');
            $('#active').html(spot);
            that.takeTrip(times-1);
        });
    } else {
        this.takeTrip(times-1);
    }
};

TurnController.prototype.takeTrip = function(times) {
    if(times < 1){
        $('#primary').html('');
       this.buildFirst();
    } else {
        var start = this.cards.chooseCard();
        var end = this.cards.chooseCard();
        $('#active').html(start + ' -> ' + end);
        $('#flips').html(this.cards.trips);
        
        var winners = this.board.bestPath(start,end);
        
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

TurnController.prototype.buildFirst = function() {
    $("#trips").removeClass(this.turnOrder[0]);
    $("#build").addClass(this.turnOrder[0]);
    
    this.buildSecond();
};

TurnController.prototype.buildSecond = function() {
    if(this.cards.trips === 0 && this.cards.cardsInPlay.length > 9){
        this.cards.trips = 1;
    }
    
    $('#turns').on('click', ()=> {
        $('#turns').off('click');
        this.populateCity();
    });
};