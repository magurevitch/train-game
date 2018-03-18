function showWelcomeScreen () {
    var welcomeScreen = '<table>' +
        '<tr><td>sections up and down</td><td colspan="4">sections across</td></tr>' +
        `<tr><td rowspan="5">${numberInput('sections-up-and-down',4)}</td>` + 
        `<td colspan="4">${numberInput('sections-across',4)}</td></tr>` +
        '<tr><td>rows per section</td><td colspan="2">columns per section</td></tr>' +
        `<tr><td rowspan="3">${numberInput('rows-per-section',4)}</td>` + 
        `<td colspan=3>${numberInput('columns-per-section',4)}</td></tr>` +
        '<tr><td>deck size limit</td><td>closeness distance</td><td>builds per turn</td></tr>' +
        `<tr><td>${numberInput('num-cards',12)}</td><td>${numberInput('close-dist',6)}</td><td>${numberInput('builds',2)}</td></tr>` +
        '</table>';
    
    $('#reset').on('click',()=>{
        $('#turn-order,#scores,#game-board,#primary,#secondary,#column-pop,#row-pop,#section-pop').html("");
        $('*').removeClass().off('click');
        showWelcomeScreen();
    });
    $('#game-board').append(welcomeScreen);
    $('#primary').html('<table><tr><th>Choose players</th></tr></table>');
    ['red','blue','green'].forEach(color =>
        $('#primary').append(`<td class="${color}"><input id="has-${color}" type="checkbox"/></td>`)
    );
    $('#secondary').append('<button>Populate game</button>');
    $('#secondary').on('click',function(){
        var players = ['red','blue','green'].filter(x=>$(`#has-${x}:checked`).val());
        if(players.length){
            $('#primary').removeClass('highlight');
            var turnController = new TurnController(
                $('#sections-up-and-down').val(),
                $('#rows-per-section').val(),
                $('#sections-across').val(),
                $('#columns-per-section').val(),
                players,
                $('#num-cards').val(),
                $('#close-dist').val(),
                $('#builds').val()
            );
        } else if ($('.pressed').length === 0){
            $('#primary').append('<td class="pressed">you must choose at least one player</td>');
        } else {
            $('#primary').addClass('highlight');
        }
    });
}

function populateGame(players,buildTurns,sectionRows,rowsPerSection,sectionColumns,columnsPerSection){
    $('#secondary').html('').off('click');
    $('#turns td').attr('colspan',players.length);
    $('#build').append("<div></div>".repeat(buildTurns));
    
    var rowHeaders = '<table><tbody/>' + range(sectionRows).map(x => '<tbody>' +
        range(rowsPerSection).map(y =>`<tr><th class="sr-${x}">${y}</th></tr>`).join('') +
    '</tbody>').join('') + '</table>';
    
    var fullNumber = sectionColumns*columnsPerSection*sectionRows*rowsPerSection;
    var rowSize = sectionColumns*columnsPerSection;
    var chunked = range(fullNumber).chunk(rowSize).map(x => x.chunk(columnsPerSection)).transpose().map(x => x.chunk(rowsPerSection));
    var html = chunked.map(
        (w,a) => '<table></th>' + range(columnsPerSection).map(x => `<th>${x}</th>`).join('') + '</tr>' + w.map(
            (x,b) => `<tbody class="sr-${b}">` + x.map(
                (y,c) => '<tr>' + y.map(
                    (z,d) => `<td id=${z} class="section-${a+b*sectionColumns} row-${c} column-${d}"><div><div></div></div></td>`
                ).join("") + '</tr>'
            ).join("") + '</tbody>'
        ).join("") + '</table>'
    ).join("");
    
    $('#game-board').html(rowHeaders + html);
    
    html = range(sectionRows).map(row => 
        '<tr>' + range(sectionColumns).map(column => `<td id="section-${sectionColumns*row+column}">${sectionColumns*row+column}</td>`).join('') + '</tr>'
    ).join('');
    $('#section-pop').html(`<table><tr><td colspan="${sectionColumns}">Choose section</td></tr>${html}</table>`);
};

function chooseHazards(spaces) {
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
};