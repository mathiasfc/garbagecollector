//Trabalho IA T1
var velocidadeAgente = 100;

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

    if ($("#ckPosicoes").is(":checked")) {
        $("#cover").show();
        $("#search_grid").css("visibility", "hidden");
        clearInterval(processor);
        //Calcula todas as distancias [recarga, lixeira]
        BuscaPosicaoParaCadaNodo();
    } else {
        $("#btnInit").prop('disabled', false);
        clearInterval(processor);
        $("#cover").hide();
        $("#search_grid").css("visibility", "visible");
    }
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

    var bVaiCarregar = false;
    var bVaiDespejar = false;
    var infoAgenteAntesDaAcao = {};

    timerId = setInterval(function() {
        agente.x = x;
        agente.y = y;
        currentCell = $("#search_grid .row .grid_item[x=" + x + "][y=" + y + "]");

        //######Limpa Sujeira###################
        if (currentCell.hasClass("sujeira") && agente.capacidade > 0) {
            currentCell.removeClass("sujeira");
            currentCell.html("");
            agente.capacidade--;
            $("#infoSujeiras").text(sujeirasRestantes--);
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
            Log("Finalizou varredura...", true);
        }
        agente.distancia++;

        if (agente.bateria <= grid.graph.nodes[agente.x][agente.y].posRecarga + 5) {
            if (!bVaiCarregar) {
                Log("Agente indo carregar...");
                //$("#search_grid .row .grid_item[x=" +agente.x+ "][y=" + agente.y + "]").css("background-color","orange");
                infoAgenteAntesDaAcao = {
                    x: agente.x,
                    y: agente.y
                };
                bVaiCarregar = true;
            }
        }

        if (agente.capacidade == 0) {
            if (!bVaiDespejar) {
				Log("Capacidade máxima atingida.");
                Log("Agente indo despejar...");
                //$("#search_grid .row .grid_item[x=" +agente.x+ "][y=" + agente.y + "]").css("background-color","yellow");
                infoAgenteAntesDaAcao = {
                    x: agente.x,
                    y: agente.y
                };
                bVaiDespejar = true;
            }
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
            if (bVaiCarregar) {
                //Se chegou no ponto de recarga, recarrega
                if (grid.graph.nodes[agente.x][agente.y].cordRecarga.x == agente.x && grid.graph.nodes[agente.x][agente.y].cordRecarga.y == agente.y) {
                    Log("RECARREGANDO...", true);
                    bVaiCarregar = false;
                    cellEnd = $("#search_grid .row .grid_item[x=" + infoAgenteAntesDaAcao.x + "][y=" + infoAgenteAntesDaAcao.y + "]");
                    agente.bateria = ($("#nrBateria").val()) ? $("#nrBateria").val() : 100;
                } else {
                    cellEnd = $("#search_grid .row .grid_item[x=" + grid.graph.nodes[agente.x][agente.y].cordRecarga.x + "][y=" + grid.graph.nodes[agente.x][agente.y].cordRecarga.y + "]");
                }

            } else if (bVaiDespejar) {
                //Se chegou na lixeira, despeja
                if (grid.graph.nodes[agente.x][agente.y].cordLixeira.x == agente.x && grid.graph.nodes[agente.x][agente.y].cordLixeira.y == agente.y) {
                    Log("DESPEJANDO SUJEIRAS...", true);
                    bVaiDespejar = false;
                    cellEnd = $("#search_grid .row .grid_item[x=" + infoAgenteAntesDaAcao.x + "][y=" + infoAgenteAntesDaAcao.y + "]");
                    agente.capacidade = ($("#tamRepositorio").val()) ? $("#tamRepositorio").val() : 20;
                } else {
                    cellEnd = $("#search_grid .row .grid_item[x=" + grid.graph.nodes[agente.x][agente.y].cordLixeira.x + "][y=" + grid.graph.nodes[agente.x][agente.y].cordLixeira.y + "]");
                }
            }
            path = grid.mover(currentCell, cellEnd);
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

ProcuraCelulaVaziaAoLadoDoPonto = function(x, y) {
    //cima
    if (ExisteCelula((x - 1), y) && CelulaLivre((x - 1), y)) {
        return [(x - 1), y];
    }
    //esq
    else if (ExisteCelula(x, (y - 1)) && CelulaLivre(x, (y - 1))) {
        return [x, (y - 1)];
    }
    //baixo
    else if (ExisteCelula((x + 1), y) && CelulaLivre((x + 1), y)) {
        return [(x + 1), y];
    }
    //dir
    else if (ExisteCelula(x, (y + 1)) && CelulaLivre(x, (y + 1))) {
        return [x, (y + 1)];
    }
    //TODO DIAGONAIS
}

ProcuraProximaCelulaLivre = function(x, y, dir) {
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

GraphSearch.prototype.mover = function($start, $end) {
    var end = this.nodeFromElement($end);

    if ($end.hasClass(css.wall) || $end.hasClass(css.start)) {
        return;
    }

    var start = this.nodeFromElement($start);
    var path = this.search(this.graph.nodes, start, end, true);

    if (!path || path.length == 0) {
        //this.animateNoPath();
    } else {
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
var processor = 0;
var posLixeiras = [];
var posRecargas = [];
var percorreMesmaLinha = false;
var logNumber = 1;
var sujeirasRestantes = 0;
var posicaoRecargaMaisProxima = {};

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


AtualizaPontoRecargaMaisProximo = function(agente) {
    var posicaoAtual = $("#search_grid .row .grid_item[x=" + agente.x + "][y=" + agente.y + "]");
    var valorMinimo = 9999;
    for (var x = 0; x < posRecargas.length; x++) {
        var posPonto = ProcuraCelulaVaziaAoLadoDoPonto(posRecargas[x][0], posRecargas[x][1])
        var possivelPontoDeRecarga = $("#search_grid .row .grid_item[x=" + posPonto[0] + "][y=" + posPonto[1] + "]");
        var path = grid.mover(posicaoAtual, possivelPontoDeRecarga);
        if (path) {
            if (path.length < valorMinimo) {
                valorMinimo = path.length;
                posicaoRecargaMaisProxima = {
                    x: posRecargas[x].x,
                    y: posRecargas[x].y,
                    dist: valorMinimo
                }
            }
        }
    }
}

function BuscaPosicaoParaCadaNodo() {
    Log("Início da verificação");
    var i = 0,
        x = 0,
        busy = false;
    $("#btnInit").attr("disabled", "disabled");
    processor = setInterval(function() {
        if (!busy) {
            busy = true;
            Log("Verificando posição [" + i.toString() + "," + x.toString() + "]");
            var start = $("#search_grid .row .grid_item[x=" + grid.graph.nodes[i][x].x + "][y=" + grid.graph.nodes[i][x].y + "]");
            var valorMinimoRec = 9999;
            for (var j = 0; j < posRecargas.length; j++) {
                var posPonto = ProcuraCelulaVaziaAoLadoDoPonto(posRecargas[j][0], posRecargas[j][1])
                var possivelPontoDeRecarga = $("#search_grid .row .grid_item[x=" + posPonto[0] + "][y=" + posPonto[1] + "]");
                var path = grid.mover(start, possivelPontoDeRecarga);
                if (path) {
                    if (path.length < valorMinimoRec) {
                        valorMinimoRec = path.length;
                        grid.graph.nodes[i][x].posRecarga = valorMinimoRec;
                        grid.graph.nodes[i][x].cordRecarga = {
                            x: posPonto[0],
                            y: posPonto[1]
                        };
                    }
                } else {
                    grid.graph.nodes[i][x].posRecarga = 0;
                    grid.graph.nodes[i][x].cordRecarga = {
                        x: posPonto[0],
                        y: posPonto[1]
                    };
                    break;
                }
            }

            var valorMinimoLix = 9999;
            for (var j = 0; j < posLixeiras.length; j++) {
                var posPonto = ProcuraCelulaVaziaAoLadoDoPonto(posLixeiras[j][0], posLixeiras[j][1])
                var possivelLixeira = $("#search_grid .row .grid_item[x=" + posPonto[0] + "][y=" + posPonto[1] + "]");
                var path = grid.mover(start, possivelLixeira);
                if (path) {
                    if (path.length < valorMinimoLix) {
                        valorMinimoLix = path.length;
                        grid.graph.nodes[i][x].posLixeira = valorMinimoLix;
                        grid.graph.nodes[i][x].cordLixeira = {
                            x: posPonto[0],
                            y: posPonto[1]
                        };
                    }
                } else {
                    grid.graph.nodes[i][x].posLixeira = 0;
                    grid.graph.nodes[i][x].cordLixeira = {
                        x: posPonto[0],
                        y: posPonto[1]
                    };
                    break;
                }
            }

            LoadingGrid((x + 1) + (i * larguraGrid), Math.pow(larguraGrid, 2));

            if (x >= grid.graph.nodes[i].length - 1) {
                Log("Próxima linha");
                i++;
                x = 0;

                if (i >= grid.graph.nodes.length) {
                    Log("Grid Carregado!");
                    clearInterval(processor);
                    $("#cover").hide();
                    $("#search_grid").css("visibility", "visible");
                    $("#btnInit").prop('disabled', false);
                }

            } else {
                Log("Próxima coluna");
                x++;
            }

            busy = false;
        }
    }, 10);
}

function LoadingGrid(atual, maximo) {
    var elem = document.getElementById("myBar");
    var width = (atual / maximo * 100);
    elem.style.width = width.toString() + '%';
}