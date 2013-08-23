// Author: merwan rodriguez
// date: around sept 2012
// depends on: d3.v2.js Japanese-JSON (v1) from github/merwan7
// Notes:
//    I opted to not namespace this js for several reasons, but mainly I didn't want to add more code to be parsed.
//
// yes this is a lot of globals.... but who cares!
var keys = [],
links = [],
link = [],
keyData = [],
gamesubset = [],
force, currParent = 1,
white = 'white',
red = '#bc002d',
green = 'white',
globalJapanese = {},
moves = 0,
totalMoves = 0,
timestamp = new Date(),
timerInterval = null,
scaleInterval = null

correct = 0,
isMobile = true,
height = 300,
width = 300,
CIRCLE_RADIUS = 20,
circleRadius = CIRCLE_RADIUS,
svg = d3.select("svg").attr("width", width).attr("height", height),
clickedNode = null,
prevNode = null,
context = null,
canvas = d3.select(".wrapper").append("canvas").attr("width", width).attr("height", height)
whiteNodes = [];


function SimpleArray(JapaneseJSON, x, y, desiredParent, desiredType) {
    var subset = [];
    
    for (var parent in JapaneseJSON) {
        if (JapaneseJSON.hasOwnProperty(parent)) {
            var vowels = JapaneseJSON[parent];
            
            for (var vowel in vowels) {
                if (vowels.hasOwnProperty(vowel)) {
                    var types = vowels[vowel];
                    
                    for (var type in types) {
                        if (types.hasOwnProperty(type)) {
                            var character = types[type];
                            if (parent === desiredParent) subset.push({
                                                                      japanese: character[desiredType.charAt(0).toUpperCase() + desiredType.slice(1)],
                                                                      'romaji': character['Romaji'],
                                                                      'x': x,
                                                                      'y': y
                                                                      });
                        }
                    }
                }
            }
        }
    }
    return subset;
}

var cloneNode = function (node, altChar) {
    var newNode = {}
    for (key in node) {
        if (node.hasOwnProperty(key)) newNode[key] = node[key];
    }
    newNode.id = altChar;
    
    return newNode;
}

// convenience function
function makeTranslate(x, y, z) {
    return 'translate(' + x + ',' + y + ',' + z + ')';
}

function checkClick(e) {
    var aPosition = getCursorPosition(e),
        x         = aPosition[0]
        y         = aPosition[1];


    keys.forEach(function (d) {
        if (Math.pow((x-d.x),2) + Math.pow((y-d.y),2) <= Math.pow(circleRadius,2)) {
            addMove();

            prevNode = prevNode || {tuple: {romaji: ''}};

            // console.log('prevNode = ' + prevNode.tuple.romaji);
            // console.log('d = ' + d.tuple.romaji);
            whiteNodes[d.id] = d;
            if (prevNode.tuple.romaji === d.tuple.romaji) {
                addCorrect(prevNode, d);
                prevNode = undefined;
            } else if ( prevNode.tuple.romaji === '' ){
                 prevNode = d;
            } else {
                delete whiteNodes[prevNode.id];
                delete whiteNodes[d.id];
                prevNode = null;
            }
        }     
    });
}

function init() {
    // doc.querySelector('canvas').addEventListener('mousemove', function(e){
    // var pageCrds = '('+ e.pageX +', '+ e.pageY +')',
    //     clientCrds = '('+ e.clientX +', '+ e.clientY +')';
    // //console.log(e.pageX + ', ' +  e.pageY + ' - ' + pageCrds);    
    // //console.log(e.clientX + ', ' + e.clientY + ' - ' + clientCrds);
    // });

    // Create the graph
    force = d3.layout
                .force()
                .gravity(0.2)
                .distance(200)
                .charge(-200)
                .links(links)
                //.on('tick', tickFn)
                .size([width, height]);
    

    setInterval(render, 16);
    // Add the data
    force.nodes(keys).start();
    // for (var i = keys.length * keys.length; i > 0; --i) force.tick();
    // force.stop();
    links = force.links();
    
    // Draw the nodes
    var node = svg.selectAll(".node").data(force.nodes());
    
    // // Update the new nodes
    // node.enter().append("svg:g");
    // node.append('circle').attr('r', circleRadius).attr('fill', '#bc002d')/*.attr('filter', 'url(#inner-shadow)')*/
    // ;
    
    // node.append('text').attr('dy', function (d) {
    //                          if (d.tuple.romaji != d.id) return '0.40em';
    //                          else return '0.25em';
    //                          }).text(
                                     
    //                                  function (d) {
    //                                  return d.id
    //                                  });
    
    //node.call(force.drag);
    //node.exit().remove();
    
    //link = svg.selectAll(".link").data(links).enter().append("line").attr("class", "link");
    timestamp = new Date();
    
}

function render() {
    context = document.querySelector('canvas').getContext('2d');
    context.clearRect(0, 0, width, height);
    keys.forEach(function(d) {
        context.beginPath();
        context.moveTo(d.x, d.y);
        context.arc(d.x, d.y, circleRadius, 0, 2 * Math.PI, false);
        context.lineWidth = 5;
        context.strokeStyle = white;
        context.stroke();
        
        context.fillStyle = whiteNodes[d.id] ? white : red;
        context.fill();
        context.textAlign = 'center';
        context.font = "bold 20px Helvetica";
        context.fillStyle = whiteNodes[d.id] ? red : white;

        if (d.id !== d.tuple.romaji) {
            context.fillText(d.id, d.x, d.y+8);
        } else {
            context.fillText(d.id, d.x, d.y+6);
        }
        return;
    });

}


function tickFn(tickEvt) {

}

function getCircleBounds(d) {
  return {
    top: d.y - circleRadius,
    left: d.x - circleRadius,
    width: circleRadius * 2,
    height: circleRadius * 2
  }
}

function getCursorPosition(e) {
    
    return [e.layerX, e.layerY];

}


function addLink(node, altNode) {
    links.push({
               "source": node,
               "target": altNode
               });
    //link = svg.selectAll(".link").data(links).enter().insert("line").attr("class", "link");
    force.links(links);
    force.start();

}

function timer() {
    document.querySelector('.history li').innerHTML = (((new Date()).getTime() - timestamp.getTime()) / 1000).toFixed(1) + 's';
}



function events(firstRun) {
    if (firstRun) {
        var controls = document.querySelectorAll('nav .key li, nav .type li'),
        closeButton = document.querySelector('nav button');
        
        var doc = document;
        context = canvas.node().getContext("2d");
        doc.querySelector('canvas').addEventListener('click', function (e) {
            checkClick(e);
        });

        [].forEach.call(controls, function (el) {
                        el.addEventListener(isMobile ? 'touchstart' : 'click', function () {
                                            clearKeyTypeSelection(this);
                                            this.classList.add('active');
                                            restart();
                                            });
                        });
        
        closeButton.addEventListener('click', function (e) {
                                     document.querySelector('section.settings').classList.remove('show');
                                     });
        
    }
};


var showSettings = function (el) {
    document.querySelector('section.settings').classList.toggle('show');
}

var clearKeyTypeSelection = function (el) {
    var controls = el.parentNode.children;
    
    [].forEach.call(controls, function (el) {
                    el.classList.remove('active');
                    });
}


var addMove = function () {
    moves++;
}

var addCorrect = function (prevNode, clickedNode) {
    correct++;
    whiteNodes[prevNode.id] = prevNode;
    whiteNodes[clickedNode.id] = clickedNode;
    
    //prevNode.select('circle').attr('fill', green);
    //prevNode.select('text').attr('class', '');
    
    //clickedNode.select('circle').attr('fill', green);
    //clickedNode.select('text').attr('fill', white);
    addLink(prevNode, clickedNode);
    console.log(correct + ' - ' + moves);
    document.querySelector('.dots').innerHTML =  Math.floor(correct / (moves/2) * 100) + '%'; //'&bull;';

    //todo keys.length? why not?
    if (keys.length / 2 === force.links().length) {
        if ( parseInt(document.querySelector('.dots').innerHTML.replace('%', ''), 10) < 60 ) {
            alert('Let\'s try it again!');
            restart();
        }
       
        scaleInterval = setInterval(function () {
            circleRadius += 2;
        }, 16);

        clearInterval(timerInterval);
        force.stop().distance('0').charge('0').start();


        
        setTimeout(function () {
           var doc = document,
               nextKey = (doc.querySelector('ul.key .active').nextElementSibling && doc.querySelector('ul.key .active').nextElementSibling.innerHTML) || document.querySelector('ul.key li:nth-child(2)').innerHTML;
           if (nextKey === '&nbsp;') { // stupid..
                nextKey = 'r';
           }

           //doc.querySelector('svg').className.baseVal = '';
           circleRadius = 20;
           clearInterval(scaleInterval);

           restart(nextKey, doc.querySelector('ul.type .active').innerHTML);
                             
       }, 4000);
    }
};

var restart = function (desiredParent, desiredType) {
    
    var doc = document;
    
    keys = [];
    nodes = [];
    links = [];
    keyData = [];
    prevNode = null;
    
    correct = 0;
    totalMoves += moves;
    moves = 0;

    desiredParent = desiredParent || document.querySelector('nav .key li.active').innerHTML;
    desiredType = desiredType || document.querySelector('nav .type li.active').innerHTML;
    
    document.querySelector('nav .type li.active').innerHTML.toLowerCase()
    //timerInterval = setInterval(timer, 100);

    doc.querySelector('.dots').innerHTML = '';
    
    if (typeof force !== 'undefined') {
        force.stop();
        d3.selectAll('g').remove();
        d3.selectAll('.link').remove();
    }
    d3.json("japanese.json", function (japanese) {
            globalJapanese = japanese;
            
            
            var gamesubset = SimpleArray(japanese, 0, 0, desiredParent, desiredType);
            desiredParent = (desiredParent === '*' ? 'star' : (desiredParent === '-' ? 'dash' : desiredParent));
            
            clearKeyTypeSelection(doc.querySelector('ul.key .active'));
            document.querySelector('ul.type .' + desiredType).classList.add('active');
            document.querySelector('ul.key .' + desiredParent).classList.add('active');
            
            
            
            var c = 0;
            [].forEach.call(gamesubset, function (tuple, i) {
                            
                            var col, row;
                            
                            row = Math.floor(i / 10);
                            col = c++;
                            
                            if (c > 9) c = 0;
                            
                            
                            var node = {
                            x: col * 50,
                            y: row * 100,
                            px: 0,
                            py: 0,
                            fixed: false,
                            weight: 1,
                            id: tuple['romaji'],
                            "tuple": tuple,
                            }
                            
                            var altNode = cloneNode(node, tuple.japanese)
                            keys.push(node, altNode);
                            //console.log(keys);
                            //console.log({ "source": keys[i], "target": keys[i+1]}, { "source": keys[i+1], "target": keys[i]});
                            //links.push({ "source": node, "target": altNode})
                            });
            init();
            events(false);
            });
}



var addIncorrect = function (prevNode, clickedNode) {
    prevNode.select('circle').transition().duration(200).attr('fill', white);
    setTimeout(function () {
               prevNode.select('circle').transition().duration(200).attr('fill', red);
               prevNode.select('text').attr('class', '');
               }, 200);
    
    clickedNode.select('circle').transition().duration(200).attr('fill', white);
    setTimeout(function () {
               clickedNode.select('circle').transition().duration(200).attr('fill', red);
               clickedNode.select('text').attr('class', '');
               }, 200);
};


var shakeEventDidOccur = function () {
    if (confirm('restart?')) restart('-', document.querySelector('#type').value);
}



var setup = function () {
    events(true);
    restart('m', 'hiragana');
    window.scrollTo(0, 1);
    document.ontouchmove = function (event) {
        event.preventDefault();
    }
    
    //window.addEventListener('shake', shakeEventDidOccur, false);
    document.querySelector('.wrapper').className += isMobile ? ' touch' : '';
}

window.addEventListener('DOMContentLoaded', setup);