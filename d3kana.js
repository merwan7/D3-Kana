// Author: merwan rodriguez
// date: around sept 2012
// depends on: d3.v2.js Japanese-JSON (v1) from github/merwan7
// Notes:
//    I opted to not namespace this js for several reasons, but mainly I didn't want to add more code to be parsed.
//


var keys = [], links = [], link = [], keyData = [], gamesubset = [], force, currParent = 1,
    white = 'white', red = '#bc002d', green = 'white',
    globalJapanese = {}, moves = 0, correct = 0,
    isMobile = false, //typeof window.Touch !== 'undefined', // chrome reports back as not undefined now so... useragents?
    height = 300, width = 300, circleRadius = 20,
    svg = d3.select("svg").attr("width", width).attr("height", height),
    clickedNode = null, prevNode = null;



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
                            if ( parent === desiredParent ) 
                               subset.push({japanese: character[desiredType.charAt(0).toUpperCase() + desiredType.slice(1)],
                                                       'romaji': character['Romaji'],
                                                        'x': x, 'y': y});
                        }
                    }
                }
            }
        }
    }
    return subset;
} 

var cloneNode = function(node, altChar) {
    var newNode = {}
    for (key in node) {
        if(node.hasOwnProperty(key))
            newNode[key] = node[key];
    }
    newNode.id = altChar;

    return newNode;
}

// convenience function
function makeTranslate(x, y, z) {
    return 'translate(' + x + ',' + y + ',' + z + ')';
}    
    
function init() {
    // Create the graph
    force = d3.layout.force()
              .gravity(0.2)
              .distance(300)
              .charge(-100)
              .links(links)
              .on('tick', tick)
              .size([width, height]);

    // Add the data
    force.stop();
    force.nodes(keys)
         .start();

    links = force.links();

    // Draw the nodes
    var node = svg.selectAll(".node").data(force.nodes());
 
    // Update the new nodes 
    node.enter().append("svg:g");
    node.append('circle').attr('r', circleRadius).attr('fill', '#bc002d')/*.attr('filter', 'url(#inner-shadow)')*/;
    
    node.append('text')
        .attr('dy', function (d) {
                if ( d.tuple.romaji != d.id )
                    return '0.40em';
                else return '0.30em';
        }).text(
            function(d) { 
                return d.id 
            }
        );

    node.call(force.drag); 
    node.exit().remove();

    link = svg.selectAll(".link")
              .data(links)
              .enter().append("line")
              .attr("class", "link");

    function tick ()
    {
        svg.selectAll("line.link")
           .attr("x1", function(d) { return d.source.x; })
           .attr("y1", function(d) { return d.source.y; })
           .attr("x2", function(d) { return d.target.x; })
           .attr("y2", function(d) { return d.target.y; });

        node.attr("transform", function(d) { 
                return "translate(" + d.x + "," + d.y + ")"; 
        });
    }
}


    function addLink (node, altNode) {
        links.push({ "source": node, "target": altNode});
        link = svg.selectAll(".link")
                  .data(links)
                  .enter().insert("line")
                  .attr("class", "link");
        force.stop();
        force.start();
    }


 

 function events(firstRun) {     
     var g = d3.selectAll('g');     

     g.on(isMobile ? 'touchstart' : 'click' , function(d,i) {         
         var isGreen = d3.select(this).select('circle').attr('fill') === green, // TODO: should use classes for this...
             isRed = d3.select(this).select('circle').attr('fill') === red,             
             isWhite = d3.select(this).select('circle').attr('fill') === white;

        if (prevNode === null && !isGreen) {
            prevNode = d3.select(this); 
            this.querySelector('circle').setAttribute('fill', 'white');
            d3.select(this.querySelector('text')).attr('class', 'active');

        } else if (!isGreen && !isWhite) {
            prevNodeData = prevNode.data()[0];
            
            clickedNode = d3.select(this);
            clickedNode.select('circle').attr('fill', white);
            clickedNode.select('text').attr('class', 'active');
            addMove();

            if ( d.tuple === prevNodeData.tuple ) {
                addLink(prevNodeData, d);
                addCorrect(prevNode, clickedNode)
                
            }
            else {
                addIncorrect(prevNode, clickedNode);
            }

            prevNode = null;
            clickedNode = null;
        }
    });

    if (firstRun){
        var controls = document.querySelectorAll('nav .key li, nav .type li'),
            closeButton = document.querySelector('nav button');

        [].forEach.call(controls, function (el) {
            el.addEventListener( isMobile ? 'touchstart' : 'click', function () {
                clearKeyTypeSelection(this);
                this.classList.add('active');

                restart(document.querySelector('nav .key li.active').innerHTML,
                        document.querySelector('nav .type li.active').innerHTML.toLowerCase());
            });
        });

        closeButton.addEventListener('click', function (e) {
            document.querySelector('section.settings').classList.remove('show');
        });

    }
};


var showSettings = function (el) {
    document.querySelector('section.settings').classList.add('show');
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

var addCorrect = function(prevNode, clickedNode) {
    correct++;

    prevNode.select('circle').attr('fill', green);
    //prevNode.select('text').attr('class', '');

    clickedNode.select('circle').attr('fill', green);
    clickedNode.select('text').attr('fill', white);

    if (d3.selectAll('circle')[0].length/2 === force.links().length) {
        d3.selectAll('circle').attr('r', '20');

        force.stop().distance('0').charge('0').start();
        d3.select('svg circle').transition().ease('square').duration(500).attr('transform', isMobile ? 'scale(7.0)' : 'scale(7.2)');
        //d3.selectAll('svg text').attr('class', 'win').text(document.querySelector('.time').innerHTML);
        
         setTimeout(function () {
             //d3.select('svg circle').transition().ease('square').duration(1000).attr('transform', 'scale(0)');
             document.querySelector('svg').className.baseVal = 'win';
         }, 1000)

        setTimeout(function () {
            var doc = document,
            currentlySelected = doc.querySelector('ul.key .active'),
            nextKey = currentlySelected.nextElementSibling || currentlySelected.parentNode.children[0];
            doc.querySelector('svg').className.baseVal = '';

            clearKeyTypeSelection(currentlySelected);
            restart(nextKey.innerHTML, doc.querySelector('ul.type .active').innerHTML);
            
        }, 2000);
    } else {
        document.querySelector('.dots').innerHTML = Math.floor(correct / moves * 100) + '% Accuracy';   //'&bull;';
    }
};

var restart = function (desiredParent, desiredType) {
    
    var doc = document;

    keys = [];
    nodes = [];
    links = [];
    keyData = [];
    
    var historyLi = doc.createElement('li');
    historyLi.innerHTML = doc.querySelector('.time').innerHTML
    doc.querySelector('.time').innerHTML = 0;
    doc.querySelector('.history').appendChild(historyLi);
    window.scrollTo(0,1);

    doc.querySelector('.dots').innerHTML = '';

    if (typeof force !== 'undefined') {
        force.stop();
        d3.selectAll('g').remove();
        d3.selectAll('.link').remove();
    } 
    d3.json("japanese.json", function(japanese) {
        globalJapanese = japanese;

        var gamesubset = SimpleArray(japanese, 0, 0, desiredParent, desiredType); 
        desiredParent = (desiredParent === '*' ? 'star' : (desiredParent === '-' ? 'dash' : desiredParent));
       
        document.querySelector('ul.type .' + desiredType).classList.add('active');
        document.querySelector('ul.key .' + desiredParent).classList.add('active');
        

        

        var c = 0;
        [].forEach.call(gamesubset, function(tuple, i){

                var col, row;

                row = Math.floor(i / 10);
                col = c++;

                if ( c > 9 ) c=0;


                var node = {
                    x: col*50, y: row*100, px: 0, py: 0, fixed: false, weight: 1, 
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



var addIncorrect = function (prevNode, clickedNode){
    prevNode.select('circle').transition().duration(200).attr('fill', white);
    setTimeout(function() {
        prevNode.select('circle').transition().duration(200).attr('fill', red);    
        prevNode.select('text').attr('class', '');
    }, 200);
                
    clickedNode.select('circle').transition().duration(200).attr('fill', white);
    setTimeout(function() {
        clickedNode.select('circle').transition().duration(200).attr('fill', red);    
        clickedNode.select('text').attr('class', '');
    }, 200);
};


var shakeEventDidOccur =  function() {
    if ( confirm('restart?') )
        restart('-', document.querySelector('#type').value );
}



var setup = function () {
    events(true);
    init();
    restart('-',  document.querySelector('ul.type .active' ).innerHTML );
    window.scrollTo(0,1);
    document.ontouchmove = function(event){
        event.preventDefault();
    }

    window.addEventListener('shake', shakeEventDidOccur, false);
    document.querySelector('.wrapper').className += isMobile ? ' touch' : '';
    //showSettings();
}

window.addEventListener('DOMContentLoaded', setup);
