function showWelcomeScreen () {
    var welcomeScreen = '<table>' +
        `<tr><td></td><td colspan="3">Number of neighborhoods across ${numberInput('neighborhoods-across',4)}</td><td></td></tr>` +
        '<tr>' + 
            `<td rowspan="3">Number of <br> neighborhoods <br> up and down <br> ${numberInput('neighborhoods-up-and-down',4)}</td>` +
            `<td></td><td>Columns per neighborhood ${numberInput('columns-per-neighborhood',4)}</td><td rowspan="3"></td>` +
            `<td>Distance considered close <br> ${numberInput('close-dist',6)}</td>` +
        '</tr>' +
        '<tr>' +
            `<td>Rows per <br> neighborhood <br> ${numberInput('rows-per-neighborhood',4)}</td>` +
            `<td>Maximum number of each card <br> ${numberInput('num-cards',12)}</td>` +
            `<td>Distance considered too far <br> ${numberInput('close-dist',20)}</td>` +
        '</tr>' +
        `<tr><td colspan="3"></td><td>Builds per turn <br> ${numberInput('builds',3)} </td></tr>` +
        '</table>'
     
    $('#reset').on('click',()=>{
        $('#turn-order,#scores,#game-board,#primary,#secondary,#neighborhood-pop,#plot-pop').html("");
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
                $('#neighborhoods-up-and-down').val(),
                $('#rows-per-neighborhood').val(),
                $('#neighborhoods-across').val(),
                $('#columns-per-neighborhood').val(),
                players,
                $('#num-cards').val(),
                $('#close-dist').val(),
                $('#far-dist').val(),
                $('#builds').val()
            );
        } else if ($('.pressed').length === 0){
            $('#primary').append('<td class="pressed">you must choose at least one player</td>');
        } else {
            $('#primary').addClass('highlight');
        }
    });
}

function populateGame(players,buildTurns,neighborhoodRows,rowsPerNeighborhood,neighborhoodColumns,columnsPerNeighborhood){
    $('#secondary').html('').off('click');
    $('#turns td').attr('colspan',players.length);
    $('#build').append("<div></div>".repeat(buildTurns));
    
    var rowHeaders = '<table><tbody/>' + range(neighborhoodRows).map(x => '<tbody>' +
        range(rowsPerNeighborhood).map(y =>`<tr><th class="row-${x*rowsPerNeighborhood+y}">${y}</th></tr>`).join('') +
    '</tbody>').join('') + '</table>';
    
    var fullNumber = neighborhoodColumns*columnsPerNeighborhood*neighborhoodRows*rowsPerNeighborhood;
    var rowSize = neighborhoodColumns*columnsPerNeighborhood;
    var chunked = range(fullNumber).chunk(rowSize).map(x => x.chunk(columnsPerNeighborhood)).transpose().map(x => x.chunk(rowsPerNeighborhood));
    var html = chunked.map(
        (w,a) => '<table></th>' + range(columnsPerNeighborhood).map(x => `<th>${x}</th>`).join('') + '</tr>' + w.map(
            (x,b) => `<tbody>` + x.map(
                (y,c) => '<tr>' + y.map(
                    (z,d) => `<td id=${z} class="neighborhood-${a+b*neighborhoodColumns} plot-${c*columnsPerNeighborhood+d}"><div><div></div></div></td>`
                ).join("") + '</tr>'
            ).join("") + '</tbody>'
        ).join("") + '</table>'
    ).join("");
    
    $('#game-board').html(rowHeaders + html);
    
    $('#neighborhood-pop').html(makePopulationTable(neighborhoodRows, neighborhoodColumns, 'neighborhood'));
    $('#plot-pop').html(makePopulationTable(rowsPerNeighborhood, columnsPerNeighborhood, 'plot'));
};

function makePopulationTable(rows, columns, name) {
    html = range(rows).map(row => 
        '<tr>' + range(columns).map(column => `<td id="${name}-${columns*row+column}">${columns*row+column}</td>`).join('') + '</tr>'
    ).join('');
    return `<table><tr><td colspan="${columns}">Choose ${name}</td></tr>${html}</table>`
};

function chooseHazards(spaces, rowSize, columnsPerNeighborhood) {
    function toggleHazard(space) {
        space.toggleClass('hazard');
        spaces[space.attr('id')].hazard = !spaces[space.attr('id')].hazard;
    }
    
    $('#game-board td').on('click', function() {toggleHazard($(this));});
    
    $('#game-board th').on('click',function() {
        var row = $(this).attr('class');
        
        if (row) {
            var n = parseInt(row.replace(/\D/g,''));
            range(rowSize*(n+1), false, rowSize*n).forEach(x => toggleHazard($('#' + x)));
        } else {
            var section = $('#game-board').children().index($(this).closest('table')) - 1;
            var column = columnsPerNeighborhood*section + parseInt($(this).html());
            
            spaces.map((x,i) => i).filter(x => x % rowSize === column).forEach(x => toggleHazard($('#' + x)))
        }
    });
    
    $('#neighborhood-pop td, #plot-pop td').on('click', function(){
        $('#game-board').find(`.${$(this).attr('id')}`).each((i,x) => toggleHazard($(x)));
    });
    
    $('#primary').html('Click a space to toggle if it is a hazard. The row/column marker toggles the whole row. The neighborhood and plot bits in the corner toggles a section.');
};