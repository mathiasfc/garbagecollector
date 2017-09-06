//Trabalho IA T1
var velocidadeAgente = 40;

class Agente {
    constructor(x, y, bateria, capacidade, distancia) {
        this.x = x;
        this.y = y;
        this.bateria = bateria;
        this.capacidade = capacidade;
        this.distancia = distancia;
    }
}

$(function() {
    IniciaGrid();

    $("#btnInit").click(function() {
        if (!agenteIniciado) {
            var bateria = ($("#nrBateria").val()) ? $("#nrBateria").val() : 100;
            var cap = ($("#tamRepositorio").val()) ? $("#tamRepositorio").val() : 20;
            var agente = new Agente(0, 0, bateria, cap, 0);
            agente.initialize();
            agenteIniciado = true;
        }
    });

    $("#btnReset").click(function() {
        $("#logWindowInner").empty();
        ResetaVariaveisGlobais();
        IniciaGrid();
		
    });
});

IniciaGrid = function() {
    var $grid = $("#search_grid"),
        $selectGridSize = $("#selectGridSize");
    var nrLixos = ($("#nrLixeiras").val()) ? $("#nrLixeiras").val() : 4;
    var nrRecarga = ($("#nrPontoRecarga").val()) ? $("#nrPontoRecarga").val() : 4;

    var opts = {
        gridSize: $selectGridSize.val(),
        nrLixeiras: nrLixos,
        nrPontosRecarga: nrRecarga
    };

    var grid = new GraphSearch($grid, opts, astar.search);
}

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
    //var $graph = this.$graph;
    //var jiggle = function(lim, i) {
    //    if(i>=lim) { $graph.css("top", 0).css("left", 0); return;  }
    //    if(!i) i=0;
    //    i++;
    //    $graph.css("top", Math.random()*6).css("left", Math.random()*6);
    //    setTimeout( function() { jiggle(lim, i) }, 5 );
    //};
    //jiggle(15);
};

GraphSearch.prototype.initialize = function() {

    this.grid = [];
    var self = this,
        nodes = [],
        $graph = this.$graph;

    $graph.empty();

    var cellWidth = ($graph.width() / this.opts.gridSize) - 2, //borda
        cellHeight = ($graph.height() / this.opts.gridSize) - 2,
        lineHeight = (this.opts.gridSize >= 30 ? "9.px" : ($graph.height() / this.opts.gridSize) - 5 + "px"),
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
    //console.log("matriz iniciada");
    Log("Matriz iniciada.", true);
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
            posLixeiras.push([randomX, randomY]);
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
            posRecargas.push([randomX, randomY]);
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
    Log(porcentagem + "% de " + totalCelulasLivres + " = " + numeroDeSujeiras.toFixed(0) + " sujeiras exibidas.", true);
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
	sujeirasRestantes = i;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

Agente.prototype.initialize = function() {
    Log("Agente iniciado.", true);
    AtualizaInformacoesAgente(this);

    var agente = this;
    var goToLeft = false;
    var goToRight = true;
    var limiteDireito = larguraGrid - 1;
    var limiteEsquerdo = 0;
    var lastPos = 0;
    var path = [];
    var completedPath = true;
    var jaPassouNaUltimaDaDireita = false;
    var jaPassouNaUltimaDaEsquerda = false;
    timerId = setInterval(function() {
        agente.x = x;
        agente.y = y;
        currentCell = $("#search_grid .row .grid_item[x=" + x + "][y=" + y + "]");

        //######Limpa Sujeira###################
        if (currentCell.hasClass("sujeira")) {
            currentCell.removeClass("sujeira");
            currentCell.html("");
            agente.capacidade--;
			$("#infoSujeiras").text(sujeirasRestantes--);
            if (agente.capacidade == 0) {
                Log("Capacidade máxima atingida.");
            }
        }
        //#######################################

        //######Atualiza informações agente######
        agente.bateria--;
        AtualizaInformacoesAgente(agente);
        if (agente.bateria == 0) {
            Log("Agente sem bateria.", false);
            stopInterval(timerId);
            return false;
        }

        if (agente.x == larguraGrid - 1 && agente.y == larguraGrid - 1) {
            jaPassouNaUltimaDaDireita = true;
        }

        if (agente.x == larguraGrid - 1 && agente.y == 0) {
            jaPassouNaUltimaDaEsquerda = true;
        }
        //Validação p/ garantir que varreu todo o grid
        if ((agente.x == larguraGrid - 1 && agente.y == 0 || agente.x == larguraGrid - 1 && agente.y == larguraGrid - 1) && (jaPassouNaUltimaDaDireita && jaPassouNaUltimaDaEsquerda)) {
            stopInterval(timerId);
        }
        agente.distancia++;

        //#######################################

        /*if(VerificaBateriaRestante(agente)){
        	
        }*/

        if (agente.capacidade == 0) {

        }

        if (goToRight && y == limiteDireito) {
            if (percorreMesmaLinha) {
                goToLeft = true;
                goToRight = false;
                percorreMesmaLinha = false;
            } else {
                if (CelulaLivre((x + 1), y)) {
                    cellEnd = $("#search_grid .row .grid_item[x=" + (x + 1) + "][y=" + y + "]");
                    x++;
                    goToLeft = true;
                    goToRight = false;
                } else {
                    cellEnd = ProcuraProximaCelulaLivre(x, y, "limDir");
                    goToLeft = true;
                    goToRight = false;
                }
            }


        } else if (goToLeft && y == limiteEsquerdo) {
            if (percorreMesmaLinha) {
                goToLeft = false;
                goToRight = true;
                percorreMesmaLinha = false;
            } else {
                if (CelulaLivre((x + 1), y)) {
                    cellEnd = $("#search_grid .row .grid_item[x=" + (x + 1) + "][y=" + y + "]");
                    x++;
                    goToLeft = false;
                    goToRight = true;
                } else {
                    cellEnd = ProcuraProximaCelulaLivre(x, y, "limEsq");
                    goToLeft = false;
                    goToRight = true;
                }
            }

        } else if (goToRight) {
            if (CelulaLivre(x, (y + 1))) {
                cellEnd = $("#search_grid .row .grid_item[x=" + x + "][y=" + (y + 1) + "]");
                y++;
            } else {
                cellEnd = ProcuraProximaCelulaLivre(x, y, "dir");
            }
        } else if (goToLeft) {
            if (CelulaLivre(x, (y - 1))) {
                cellEnd = $("#search_grid .row .grid_item[x=" + x + "][y=" + (y - 1) + "]");
                y--;
            } else {
                cellEnd = ProcuraProximaCelulaLivre(x, y, "esq");
            }
        }

        if (completedPath) {
            path = grid.move(currentCell, cellEnd);
        }

        if (lastPos == path.length - 1) {
            completedPath = true;
        }

        if (path.length > 1 && lastPos < path.length && lastPos != path.length - 1) {
            x = path[lastPos].x;
            y = path[lastPos].y;
            lastPos++;
            completedPath = false;
        } else if (completedPath) {
            x = path[lastPos].x;
            y = path[lastPos].y;
            lastPos = 0;

        }
        grid.$cells.removeClass("agente");
        $("#search_grid .row .grid_item[x=" + x + "][y=" + y + "]").addClass("agente");
        Log("Agente moveu-se para: [" + x + "," + y + "]", true);

    }, velocidadeAgente);

    
};


stopInterval = function(timerId) {
        clearInterval(timerId);
};
	
VerificaBateriaRestante = function(agente) {
    var valorMinimo = 0;
    var bateriaRestante = agente.bateria;
    var posicaoAtual = $("#search_grid .row .grid_item[x=" + agente.x + "][y=" + agente.y + "]");
    for (var x = 0; i < posRecargas.length; x++) {
        var possivelPontoDeRecarga = $("#search_grid .row .grid_item[x=" + posRecargas[x].x + "][y=" + posRecargas[x].y + "]");
        var path = grid.move(posicaoAtual, possivelPontoDeRecarga);
        //valorMinimo = Math.min(path.len
    }



}

ProcuraProximaCelulaLivre = function(x, y, dir) {
    //var larguraGrid = parseInt(larguraGrid);
    if (dir == "limDir") {
        //procura a celula mais proxima na linha de baixo
        //verifica se não é a ultima linha
        if (x != larguraGrid) {
            for (var y = y; y >= 0; y--) {
                if (CelulaLivre((x + 1), y)) {
                    return PegaCelula((x + 1), y);
                }
            }
        }
    } else if (dir == "limEsq") {
        //procura a celula mais proxima na linha de baixo
        //verifica se não é a ultima linha
        if (x != larguraGrid) {
            for (var y = y; y <= larguraGrid; y++) {
                if (CelulaLivre((x + 1), y)) {
                    return PegaCelula((x + 1), y);
                }
            }
        }
    } else if (dir == "dir") {
        //verifica se tem celula vazia na linha
        for (var y = y; y < larguraGrid - 1; y++) {
            if (CelulaLivre(x, (y + 1))) {
                return PegaCelula(x, (y + 1));
            }
        }
        //se nao tiver desce e mantem a direcao inicial
        for (var x = x; x <= larguraGrid - 1; x++) {
            if (CelulaLivre((x + 1), y)) {
                percorreMesmaLinha = true;
                return PegaCelula((x + 1), y);
            }
        }

    } else if (dir == "esq") {
        //verifica se tem celula vazia na linha
        for (var y = y; y > 0; y--) {
            if (CelulaLivre(x, (y - 1))) {
                return PegaCelula(x, (y - 1));
            }
        }
        //se nao tiver desce e mantem a direcao inicial
        for (var x = x; x <= larguraGrid - 1; x++) {
            if (CelulaLivre((x + 1), y)) {
                percorreMesmaLinha = true;
                return PegaCelula((x + 1), y);
            }
        }
    }

}

var grid;

GraphSearch.prototype.move = function($start, $end) {

    var end = this.nodeFromElement($end);

    if ($end.hasClass(css.wall) || $end.hasClass(css.start)) {
        return;
    }

    //this.$cells.removeClass("agente");
    //$end.addClass("agente");
    //var $start = this.$cells.filter(start);
    var start = this.nodeFromElement($start);
    var path = this.search(this.graph.nodes, start, end, true);

    if (!path || path.length == 0) {
        this.animateNoPath();
    } else {
        //this.animatePath(path);
        return path;
    }
};

GraphSearch.prototype.nodeFromElement = function($cell) {
    return this.graph.nodes[parseInt($cell.attr("x"))][parseInt($cell.attr("y"))];
};

CelulaLivre = function(x, y) {
    var bNaoTemParede = !$("#search_grid .row .grid_item[x=" + x + "][y=" + y + "]").hasClass("wall");
    var bNaoTemLixeira = !$("#search_grid .row .grid_item[x=" + x + "][y=" + y + "]").hasClass("lixeira");
    var bNaoTemRecarga = !$("#search_grid .row .grid_item[x=" + x + "][y=" + y + "]").hasClass("pontoRecarga");
    return bNaoTemParede && bNaoTemLixeira && bNaoTemRecarga;
}

PegaCelula = function(x, y) {
    return $("#search_grid .row .grid_item[x=" + x + "][y=" + y + "]");
}

AtualizaInformacoesAgente = function(agente) {
    if (agente.bateria < 0) {
        $("#infoBateria").text("Esgotada.");
    } else {
        $("#infoBateria").text(agente.bateria);
    }
    $("#infoCapacidade").text(agente.capacidade);
    $("#infoSqms").text(agente.distancia);
}

LimpaMarcaAgente = function() {
    $("#search_grid .row .grid_item").removeClass("agente");
}

ExisteCelula = function(x, y) {
    return ((x >= 0 && x < larguraGrid) && (y >= 0 && y < larguraGrid));
}

Log = function(text, green) {
    var $console = $("#logWindowInner");
    if (green) {
        var logText = (logNumber > 1) ? "<br><span>" + logNumber + " - " + text + "</span>" : "<span>" + logNumber + " - " + text + "</span>";
    } else {
        var logText = (logNumber > 1) ? "<br><span style='color:red'>" + logNumber + " - " + text + "</span>" : "<span style='color:red'>" + logNumber + " - " + text + "</span>";
    }
    $console.append(logText);
    $console.scrollTop($console[0].scrollHeight);
    logNumber++;
}

var WALL = 0;
var agenteIniciado = false;
var larguraGrid = $("#selectGridSize").val();
var distanciaTotal = Math.pow($("#selectGridSize").val(), 2);
var x = 0;
var y = 0;
var timerId = 0;
var posLixeiras = [];
var posRecargas = [];
var percorreMesmaLinha = false;
var logNumber = 1;
var sujeirasRestantes = 0;

ResetaVariaveisGlobais = function() {
    agenteIniciado = false;
	stopInterval(timerId);
    larguraGrid = $("#selectGridSize").val();
    distanciaTotal = Math.pow($("#selectGridSize").val(), 2);
    x = 0;
    y = 0;
    posLixeiras = [];
    posRecargas = [];
    logNumber = 1;
    $("#infoBateria").text("Não iniciado.");
    $("#infoCapacidade").text("Não iniciado.");
    $("#infoSqms").text("Não iniciado.");
}