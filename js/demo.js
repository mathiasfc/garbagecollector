//Trabalho IA T1

var WALL = 0;
var agenteIniciado =false;

class Agente {
	constructor(x,y,bateria,capacidade) {
	this.x = x;
	this.y = y;
	this.bateria = bateria;
	this.capacidade = capacidade;
	}
}
	
$(function() {
    var $grid = $("#search_grid"),
        $selectGridSize = $("#selectGridSize");
		//$("#nrLixeiras").val();
		//$("#nrPontoRecarga").val();

    var opts = {
        gridSize: $selectGridSize.val(),
		nrLixeiras: 4,
		nrPontosRecarga:4
    };

    var grid = new GraphSearch($grid, opts, astar.search);
    
	
    $("#btnInit").click(function() {
        //grid.initialize();
		
		//var capacidade = $("#tamRepositorio").val();
		//var nrLixeiras = $("#tamRepositorio").val();
		//var agente = new Agente(0,0,100,50);
		if(!agenteIniciado){
			var agente = new Agente(0,0,100,50);
			agente.initialize();
			agenteIniciado = true;	
		}
		
    });

    $selectGridSize.change(function() {
        grid.setOption({gridSize: $(this).val()});
        grid.initialize();
    });

});

var css = { start: "start", finish: "finish", wall: "wall", active: "active" };

function GraphSearch($graph, options) {
    this.$graph = $graph;
    this.opts = $.extend({wallFrequency:0.1, debug:true, gridSize:120}, options);
    this.initialize();
}
GraphSearch.prototype.setOption = function(opt) {
    this.opts = $.extend(this.opts, opt);
};
GraphSearch.prototype.initialize = function() {
	
    this.grid = [];
    var self = this,
        nodes = [],
        $graph = this.$graph;

    $graph.empty();

    var cellWidth = ($graph.width()/this.opts.gridSize)-2, //borda
        cellHeight = ($graph.height()/this.opts.gridSize)-2,
		lineHeight = (this.opts.gridSize >= 30 ? "9.px":($graph.height()/this.opts.gridSize)-10+"px"),
		fontSize = (this.opts.gridSize >= 30 ? "10px":"20px");
        $cellTemplate = $("<span />").addClass("grid_item").width(cellWidth).height(cellHeight).css("line-height",lineHeight).css("font-size",fontSize),
        startSet = false;

    for(var x = 0; x < this.opts.gridSize; x++) {
        var $row = $("<div class='row' />");
            //nodeRow = [],
            //gridRow = [];

        for(var y = 0; y < this.opts.gridSize; y++) {
            var id = "cell_"+x+"_"+y,
                $cell = $cellTemplate.clone();
            $cell.attr("id", id).attr("x", x).attr("y", y);
            $row.append($cell);
			
			var isWall = PreencheParede(x,y,this.opts.gridSize);
            if(isWall === 1) {
                $cell.addClass(css.wall);
            }
            else  {

					$cell.addClass('weight1');
            }
        }
        $graph.append($row);
    }
	ColocaLixeiras(this.opts.nrLixeiras);
	ColocaPontosRecarga(this.opts.nrPontosRecarga);
	var totalCelulasLivresAmbiente = Math.pow(this.opts.gridSize, 2) - this.opts.nrLixeiras - this.opts.nrPontosRecarga;
	ColocaSujeira(totalCelulasLivresAmbiente);
	
	console.log("matriz iniciada");
	
};


PreencheParede = function(x,y,size){
	var limitPointLeftUp = [2,3];
	var limitPointRightUp = [2,size-4];
	
	var limitPointLeftDown = [size-4,2];
	var limitPointRightDown = [size-4,size-4];
	
	
	if((x == 2 && y == 2) || (x == 2 && y == size-3)){
		return 1;
	}
	
	if((x == size-3 && y == 2) || (x == size-3 && y == size-3)){
		return 1;
	}
	
	if(x >= 2 && (y == 3 && x>=limitPointLeftUp[0] && x<= limitPointLeftDown[0]+1)){
		return 1;
	}
	
	if(x >= 2 && (y == size-4 && x>=limitPointRightUp[0] && x<= limitPointRightDown[0]+1)){
		return 1;
	}
	
	/*if( x == limitPointLeftUp[0] && (y > limitPointLeftUp[1] && y < limitPointRightUp[1]) && (limitPointRightUp[1] - limitPointLeftUp[1] > 4)){
		return 1;
	}
	
	if( x == limitPointLeftDown[0]+1 && (y > limitPointLeftDown[1] && y < limitPointRightDown[1]) && (limitPointRightDown[1] - limitPointLeftDown[1] > 4)){
		return 1;
	}*/
}

ColocaLixeiras = function(nrLixeiras){
	var gridSize = $("#selectGridSize").val();
	var i =0;
	while(i < nrLixeiras){
		var randomX = getRandomInt(1,gridSize-1);
		var randomY = getRandomInt(0,gridSize-1);
		var cell = $("#search_grid .row .grid_item[x="+randomX+"][y="+randomY+"]");
		if(!cell.hasClass("wall") && !cell.hasClass("lixeira")){
			cell.addClass("lixeira");
			cell.wrapInner("<span>L</span>");
			i++;
		}
	}
}

ColocaPontosRecarga = function(nrPontosRecarga){
	var gridSize = $("#selectGridSize").val();
	var i =0;
	while(i < nrPontosRecarga){
		var randomX = getRandomInt(1,gridSize-1);
		var randomY = getRandomInt(0,gridSize-1);
		var cell = $("#search_grid .row .grid_item[x="+randomX+"][y="+randomY+"]");
		if(!cell.hasClass("wall") && !cell.hasClass("lixeira") && !cell.hasClass("pontoRecarga")){
			cell.addClass("pontoRecarga");
			cell.wrapInner("<span>R</span>");
			i++;
		}
	}
}

ColocaSujeira = function(totalCelulasLivres){
	var gridSize = $("#selectGridSize").val();
	//Porcentagem de sujeira, entre 40 e 85
	var porcentagem = getRandomInt(10,20);
	var numeroDeSujeiras = (porcentagem/100)*totalCelulasLivres;
	console.log(porcentagem+"% de "+totalCelulasLivres+" = "+ numeroDeSujeiras.toFixed(0) +" sujeiras exibidas.");
	var i =0;
	while(i < numeroDeSujeiras){
		var randomX = getRandomInt(0,gridSize);
		var randomY = getRandomInt(0,gridSize);
		if(randomX == 0 && randomY == 0) continue;
		var cell = $("#search_grid .row .grid_item[x="+randomX+"][y="+randomY+"]");
		if(!cell.hasClass("wall") && !cell.hasClass("lixeira") && !cell.hasClass("pontoRecarga") && !cell.hasClass("sujeira")){
			cell.addClass("sujeira");
			cell.wrapInner("<span>s</span>");
			i++;
		}
	}
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


Agente.prototype.initialize = function() {
	/*var gridSize = $("#selectGridSize").val();
	for(var x = 0; x < gridSize; x++) {
		for(var y = 0; y < gridSize; y++) {
			
		}
	}*/
	//$agente = this.$agente;
	var cell = $("#search_grid .row .grid_item[x="+this.x+"][y="+this.y+"]");
	cell.addClass("agente");
	cell.wrapInner("<span>A</span>");
	console.log("agente iniciado");
};
