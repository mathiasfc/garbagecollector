//Trabalho IA T1
var WALL = 0;
var agenteIniciado = false;
var larguraGrid = $("#selectGridSize").val();
var distanciaTotal = Math.pow($("#selectGridSize").val(),2);

class Agente {
    constructor(x, y, bateria, capacidade,distancia) {
        this.x = x;
        this.y = y;
        this.bateria = bateria;
        this.capacidade = capacidade;
		this.distancia = distancia;
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
        nrPontosRecarga: 4
    };

    var grid = new GraphSearch($grid, opts, astar.search);


    $("#btnInit").click(function() {
        //grid.initialize();

        //var capacidade = $("#tamRepositorio").val();
        //var nrLixeiras = $("#tamRepositorio").val();
        //var agente = new Agente(0,0,100,50);
        if (!agenteIniciado) {
            var agente = new Agente(0, 0, 100, 50, 0);
            agente.initialize();
            agenteIniciado = true;
        }

    });

    $selectGridSize.change(function() {
        grid.setOption({
            gridSize: $(this).val()
        });
        grid.initialize();
    });

});

var css = {
    start: "start",
    finish: "finish",
    wall: "wall",
    active: "active"
};

function GraphSearch($graph, options, implementation) {
    this.$graph = $graph;
	this.search = implementation;
    this.opts = $.extend({
        wallFrequency: 0.1,
        debug: true,
        gridSize: 120
    }, options);
    this.initialize();
}
GraphSearch.prototype.setOption = function(opt) {
    this.opts = $.extend(this.opts, opt);
};

GraphSearch.prototype.animateNoPath = function() {
    var $graph = this.$graph;
    var jiggle = function(lim, i) {
	    if(i>=lim) { $graph.css("top", 0).css("left", 0); return;  }
	    if(!i) i=0;
	    i++;
	    $graph.css("top", Math.random()*6).css("left", Math.random()*6);
	    setTimeout( function() { jiggle(lim, i) }, 5 );
    };
    jiggle(15);
};

GraphSearch.prototype.animatePath = function(path) {
	var grid = this.grid;
	var timeout = 1000 / grid.length;
	var elementFromNode = function(node) {
		return grid[node.x][node.y];
	};

    var removeClass = function(path, i) {
	    if(i>=path.length) return;
	    elementFromNode(path[i]).removeClass("agente");
	    setTimeout( function() { removeClass(path, i+1) }, 200);
    }
    var addClass = function(path, i)  {
	    if(i>=path.length) {  // Finished showing path, now remove
	    	return removeClass(path, 0);
	    }
	    elementFromNode(path[i]).addClass("agente");
	    setTimeout( function() { addClass(path, i+1) }, 200);
    };

    addClass(path, 0)
    this.$graph.find("." + css.start).removeClass(css.start);
    this.$graph.find("." + css.finish).removeClass(css.finish).addClass(css.start);
	
	/*var i =0;
	setInterval(function(){
		if(i<= path.length){
			elementFromNode(path[i]).addClass("agente");
			setTimeout( function() { elementFromNode(path[i]).removeClass("agente"); }, 200);
			i++;
		}
	}, 200);*/

	
};
GraphSearch.prototype.initialize = function() {

    this.grid = [];
    var self = this,
        nodes = [],
        $graph = this.$graph;

    $graph.empty();

    var cellWidth = ($graph.width() / this.opts.gridSize) - 2, //borda
        cellHeight = ($graph.height() / this.opts.gridSize) - 2,
        lineHeight = (this.opts.gridSize >= 30 ? "9.px" : ($graph.height() / this.opts.gridSize) - 10 + "px"),
        fontSize = (this.opts.gridSize >= 30 ? "10px" : "20px");
    $cellTemplate = $("<span />").addClass("grid_item").width(cellWidth).height(cellHeight).css("line-height", lineHeight).css("font-size", fontSize),
        startSet = false;

    for (var x = 0; x < this.opts.gridSize; x++) {
        var $row = $("<div class='row' />");
        nodeRow = [],
        gridRow = [];

        for (var y = 0; y < this.opts.gridSize; y++) {
            var id = "cell_" + x + "_" + y,
                $cell = $cellTemplate.clone();
            $cell.attr("id", id).attr("x", x).attr("y", y);
            $row.append($cell);
			gridRow.push($cell);

            var isWall = PreencheParede(x, y, this.opts.gridSize);
            if (isWall === 1) {
                $cell.addClass(css.wall);
				distanciaTotal = distanciaTotal - 1;
				nodeRow.push(1);
            } else {

                $cell.addClass('weight1');
				nodeRow.push(0);
            }
        }
        $graph.append($row);
		this.grid.push(gridRow);
		nodes.push(nodeRow);
    }
	this.graph = new Graph(nodes);
	
    ColocaLixeiras(this.opts.nrLixeiras);
    ColocaPontosRecarga(this.opts.nrPontosRecarga);
    var totalCelulasLivresAmbiente = Math.pow(this.opts.gridSize, 2) - this.opts.nrLixeiras - this.opts.nrPontosRecarga;
    ColocaSujeira(totalCelulasLivresAmbiente);

	$("#infoSqmsRestantes").text(distanciaTotal);
    console.log("matriz iniciada");
	this.$cells = $graph.find(".grid_item");
	grid = this;
};


PreencheParede = function(x, y, size) {
    var limitPointLeftUp = [2, 3];
    var limitPointRightUp = [2, size - 4];

    var limitPointLeftDown = [size - 4, 2];
    var limitPointRightDown = [size - 4, size - 4];


    if ((x == 2 && y == 2) || (x == 2 && y == size - 3)) {
        return 1;
    }

    if ((x == size - 3 && y == 2) || (x == size - 3 && y == size - 3)) {
        return 1;
    }

    if (x >= 2 && (y == 3 && x >= limitPointLeftUp[0] && x <= limitPointLeftDown[0] + 1)) {
        return 1;
    }

    if (x >= 2 && (y == size - 4 && x >= limitPointRightUp[0] && x <= limitPointRightDown[0] + 1)) {
        return 1;
    }

    /*if( x == limitPointLeftUp[0] && (y > limitPointLeftUp[1] && y < limitPointRightUp[1]) && (limitPointRightUp[1] - limitPointLeftUp[1] > 4)){
    	return 1;
    }
	
    if( x == limitPointLeftDown[0]+1 && (y > limitPointLeftDown[1] && y < limitPointRightDown[1]) && (limitPointRightDown[1] - limitPointLeftDown[1] > 4)){
    	return 1;
    }*/
}

ColocaLixeiras = function(nrLixeiras) {
    var gridSize = $("#selectGridSize").val();
    var i = 0;
    while (i < nrLixeiras) {
        var randomX = getRandomInt(1, gridSize - 1);
        var randomY = getRandomInt(0, gridSize - 1);
        var cell = $("#search_grid .row .grid_item[x=" + randomX + "][y=" + randomY + "]");
        if (!cell.hasClass("wall") && !cell.hasClass("lixeira")) {
            cell.addClass("lixeira");
			cell.type = 1;
            cell.wrapInner("<span>L</span>");
            i++;
        }
    }
	$("#infoLixeiras").text(i);
	distanciaTotal = distanciaTotal - i;
}

ColocaPontosRecarga = function(nrPontosRecarga) {
    var gridSize = $("#selectGridSize").val();
    var i = 0;
    while (i < nrPontosRecarga) {
        var randomX = getRandomInt(1, gridSize - 1);
        var randomY = getRandomInt(0, gridSize - 1);
        var cell = $("#search_grid .row .grid_item[x=" + randomX + "][y=" + randomY + "]");
        if (!cell.hasClass("wall") && !cell.hasClass("lixeira") && !cell.hasClass("pontoRecarga")) {
            cell.addClass("pontoRecarga");
			cell.type = 1;
            cell.wrapInner("<span>R</span>");
            i++;
        }
    }
	distanciaTotal = distanciaTotal - i;
	$("#infoRecarga").text(i);
}

ColocaSujeira = function(totalCelulasLivres) {
    var gridSize = $("#selectGridSize").val();
    //Porcentagem de sujeira, entre 40 e 85
    var porcentagem = getRandomInt(10, 20);
    var numeroDeSujeiras = (porcentagem / 100) * totalCelulasLivres;
    console.log(porcentagem + "% de " + totalCelulasLivres + " = " + numeroDeSujeiras.toFixed(0) + " sujeiras exibidas.");
    var i = 0;
    while (i < numeroDeSujeiras) {
        var randomX = getRandomInt(0, gridSize);
        var randomY = getRandomInt(0, gridSize);
        if (randomX == 0 && randomY == 0) continue;
        var cell = $("#search_grid .row .grid_item[x=" + randomX + "][y=" + randomY + "]");
        if (!cell.hasClass("wall") && !cell.hasClass("lixeira") && !cell.hasClass("pontoRecarga") && !cell.hasClass("sujeira")) {
            cell.addClass("sujeira");
            cell.wrapInner("<span>s</span>");
            i++;
        }
    }
	$("#infoSujeiras").text(i);
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


Agente.prototype.initialize = function() {
    console.log("agente iniciado");
	AtualizaInformacoesAgente(this);
    var x = 0;
    var y = 0;
	var agente = this;
	
	var lastDir = "right";
	var tryTo = "";
	var trying = false;
	
	var right = true;
	var up = false;
	var down = false;
	var left = false;
    var timerId = 0;

    /*timerId = setInterval(function(){
        LimpaMarcaAgente();
        var cell = $("#search_grid .row .grid_item[x=" + agente.x + "][y=" + agente.y + "]");
        cell.addClass("agente");
		//######Limpa Sujeira######
		if(cell.hasClass("sujeira")){
			cell.removeClass("sujeira");
			cell.html("");
			agente.capacidade--;
		}
		//######Move agente[[Por padrão começa para direita]]######
		if(right){
			lastDir = "right";
			if(tryTo == "down" && trying){
				if(CelulaLivre(agente.x+1,agente.y)){
					trying = false;
					right = false;
					down = true;
					agente.x++;
				}
			}else if(tryTo == "up" && trying){
				if(CelulaLivre(agente.x-1,agente.y)){
					trying = false;
					right = false;
					up = true;
					agente.x--;
				}
			}
			
			if(right){
				//verifica se tem um sqm válido
				if(ExisteCelula(agente.x,agente.y+1)){
					//avança direita se estiver livre
					if(CelulaLivre(agente.x,agente.y+1)){
						agente.y++;
					}
					else{
						right = false;
						//verifica cima
						if(CelulaLivre(agente.x-1,agente.y)){
							up = true;
							trying = true;
						}
						//verifica baixo
						else if(CelulaLivre(agente.x+1,agente.y)){
							down = true;
							trying = true;
						}
					}
				}else{
					agente.x++;
					right = false;
					left = true;
				}
			}
		}
		
		else if(left){
			lastDir = "left";
			if(tryTo == "down" && trying){
				if(CelulaLivre(agente.x+1,agente.y)){
					trying = false;
					left = false;
					down = true;
					agente.x++;
				}
			}else if(tryTo == "up" && trying){
				if(CelulaLivre(agente.x-1,agente.y)){
					trying = false;
					left = false;
					up = true;
					agente.x--;
				}
			}
			
			if(left){
				if(ExisteCelula(agente.x,agente.y-1)){
					if(CelulaLivre(agente.x,agente.y-1)){
						agente.y--;
					}else{
						left = false;
						
						//verifica baixo
						if(CelulaLivre(agente.x+1,agente.y)){
							down = true;
							trying = true;
						}//verifica cima
						else if(CelulaLivre(agente.x-1,agente.y)){
							up = true;
							trying = true;
						}
						
					}
				}else{
					agente.x++;
					right = true;
					left = false;
				}
			}
		}
		
		else if(up){
			tryTo = "down";
			if(lastDir == "left"){
				if(CelulaLivre(agente.x,agente.y-1)){
					up = false;
					left = true;
					agente.y--;
				}
			}else if(lastDir == "right"){
				if(CelulaLivre(agente.x,agente.y+1)){
					up = false;
					right = true;
					agente.y++;
				}
			}
			if(up){
				if(ExisteCelula(agente.x-1,agente.y)){
					if(CelulaLivre(agente.x-1,agente.y)){
						agente.x--;
					}else{
						up = false;
						//verifica esquerda
						if(CelulaLivre(agente.x,agente.y-1)){
							left = true;
							agente.y--;
						}
						//verifica direita
						else if(CelulaLivre(agente.x,agente.y+1)){
							right = true;
							agente.y++;
						}
						//verifica baixo
						else if(CelulaLivre(agente.x+1,agente.y)){
							down = true;
							agente.x++;
						}
						
					}
				}else{
					agente.x++;
					up = false;
					down = true;
				}
			}
			
		}

		else if(down){
			tryTo = "up";
			if(lastDir == "left"){
				if(CelulaLivre(agente.x,agente.y-1)){
					down = false;
					left = true;
					agente.y--;
				}
			}else if(lastDir == "right"){
				if(CelulaLivre(agente.x,agente.y+1)){
					down = false;
					right = true;
					agente.y++;
				}
			}
			
			if(down){
				if(ExisteCelula(agente.x+1,agente.y)){
					if(CelulaLivre(agente.x+1,agente.y)){
						agente.x++;
					}else{
						down = false;
						//verifica esquerda
						if(CelulaLivre(agente.x,agente.y-1)){
							left = true;
							agente.y--;
						}
						//verifica direita
						else if(CelulaLivre(agente.x,agente.y+1)){
							right = true;
							agente.y++;
						}
						//verifica cima
						else if(CelulaLivre(agente.x-1,agente.y)){
							up = true;
							agente.x--;
						}
					}
				}else{
					agente.x--;
					up = true;
					down = false;
				}
			}
		}
		
		//--------------
		
		
		//######Possiveis condições de parada######
        //if (agente.y == larguraGrid) {
        //    agente.x++;
        //    left = true;
        //}
        //if (x == larguraGrid) {
        //    stopInterval();
		//}
        
		//######Atualiza informações agente######
		agente.bateria--;
		if(agente.bateria == 0){
			stopInterval();
		}
		agente.distancia++;
		AtualizaInformacoesAgente(agente);
		//------------------------------------
    }, 100);*/
    /*var x = 0;
	timerId = setInterval(function(){
		//var cell = $("#search_grid .row .grid_item[x=" + x + "][y=" + y + "]");
		var cell = $("#search_grid .row .grid_item[x=0][y=6]");
		cellClicked(cell);
		x++;
	}, 100);*/
	
	var x = 0;
	var y = 0;
	var goToLeft = false;
	var goToRight = true;
	var limiteDireito = larguraGrid -1;
	var limiteEsquerdo = 0;
	timerId = setInterval(function(){
		currentCell = $("#search_grid .row .grid_item[x="+x+"][y="+y+"]");
		currentCell.addClass("agente");
		if(goToRight && y == limiteDireito){
			if(CelulaLivre((x+1),y)){
				cellEnd = $("#search_grid .row .grid_item[x="+(x+1)+"][y="+y+"]");
			    x++;
			    goToLeft = true;
			    goToRight = false;
			}else{
				cellEnd = ProcuraProximaCelulaLivre(x,y,"limDir");
			}
			
		}else if(goToLeft && y == limiteEsquerdo){
			if(CelulaLivre((x+1),y)){
				cellEnd = $("#search_grid .row .grid_item[x="+(x+1)+"][y="+y+"]");
				x++;
				goToLeft = false;
				goToRight = true;
			}else{
				cellEnd = ProcuraProximaCelulaLivre(x,y,"limEsq");
			}
		}else if(goToRight){
			if(CelulaLivre(x,(y+1))){
				cellEnd = $("#search_grid .row .grid_item[x="+x+"][y="+(y+1)+"]");
				y++;
			}else{
				cellEnd = ProcuraProximaCelulaLivre(x,y,"dir");
			}
		}else if(goToLeft){
			if(CelulaLivre(x,(y-1))){
				cellEnd = $("#search_grid .row .grid_item[x="+x+"][y="+(y-1)+"]");
				y--;
			}else{
				cellEnd = ProcuraProximaCelulaLivre(x,y,"esq");
			}
		}
	
		grid.move(currentCell,cellEnd);
		
	}, 100);
	
    var stopInterval = function() {
        clearInterval(timerId);
    };
};

ProcuraProximaCelulaLivre = function(x,y,dir){
	if(dir == "limDir"){
		//procura a celula mais proxima na linha de baixo
		//verifica se não é a ultima linha
		if(x != larguraGrid){
			for(var y = y; y>=0;y--){
				if(CelulaLivre((x+1),y)){
					return PegaCelula((x+1),y);
				}
			}
		}
	}else if(dir == "limEsq"){
		//procura a celula mais proxima na linha de baixo
		//verifica se não é a ultima linha
		if(x != larguraGrid){
			for(var y = y; y<=larguraGrid;y++){
				if(CelulaLivre((x+1),y)){
					return PegaCelula((x+1),y);
				}
			}
		}
	}else if(dir == "dir"){
		//verifica se tem celula vazia na linha
		for(var y = y; y<=larguraGrid;y++){
			if(CelulaLivre(x,(y+1))){
				return PegaCelula(x,(y+1));
			}
		}
		//se nao tiver desce e mantem a direcao inicial
		
	}else if(dir == "esq"){
		//verifica se tem celula vazia na linha
		for(var y = y; y>=0;y--){
			if(CelulaLivre(x,(y-1))){
				return PegaCelula(x,(y-1));
			}
		}
		//se nao tiver desce e mantem a direcao inicial
	}
	
}

var grid;

GraphSearch.prototype.move = function($start,$end) {
	
    var end = this.nodeFromElement($end);

   	if($end.hasClass(css.wall) || $end.hasClass(css.start)) {
   		log("clicked on wall or start...", $end);
   		return;
   	}

   	this.$cells.removeClass("agente");
   	//$end.addClass("agente");
   	//var $start = this.$cells.filter(start);
   	var start = this.nodeFromElement($start);

	var sTime = new Date();
    var path = this.search(this.graph.nodes, start, end, true);
	var fTime = new Date();

	if(!path || path.length == 0)	{
	    $("#message").text("couldn't find a path ("+(fTime-sTime)+"ms)");
	    this.animateNoPath();
	}
	else {
	    $("#message").text("search took " + (fTime-sTime) + "ms.");
    	if(this.opts.debug) {
	    	//this.drawDebugInfo(this.opts.debug);
	    }
	    this.animatePath(path);
	}
};

GraphSearch.prototype.nodeFromElement = function($cell) {
    return this.graph.nodes[parseInt($cell.attr("x"))][parseInt($cell.attr("y"))];
};

CelulaLivre = function(x,y){
	var bNaoTemParede = !$("#search_grid .row .grid_item[x=" + x + "][y=" + y + "]").hasClass("wall");
	var bNaoTemLixeira = !$("#search_grid .row .grid_item[x=" + x + "][y=" + y + "]").hasClass("lixeira");
	var bNaoTemRecarga = !$("#search_grid .row .grid_item[x=" + x + "][y=" + y + "]").hasClass("pontoRecarga");
	return bNaoTemParede && bNaoTemLixeira && bNaoTemRecarga;
}

PegaCelula = function(x,y){
	return $("#search_grid .row .grid_item[x=" + x + "][y=" + y + "]");
}

AtualizaInformacoesAgente = function(agente){
		if(agente.bateria < 0){
			$("#infoBateria").text("Esgotada.");
		}else{
		$("#infoBateria").text(agente.bateria);
		}
		$("#infoCapacidade").text(agente.capacidade);
		$("#infoSqms").text(agente.distancia);
}

LimpaMarcaAgente = function(){
	$("#search_grid .row .grid_item").removeClass("agente");
}

ExisteCelula = function(x,y){
	return ((x >= 0 && x < larguraGrid) && (y >= 0 && y< larguraGrid));
}


