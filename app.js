/**
 * Definition of network
 *
 * @author     joachim.schirrmacher@deutschebahn.com
 */
'use strict';

requirejs.config({
    baseUrl: '.',
    paths: {
        'd3': 'https://cdnjs.cloudflare.com/ajax/libs/d3/4.5.0/d3'
    }
});

requirejs(['d3'], function(d3) {
    var width = window.innerWidth;
    var height = window.innerHeight;

    var zoom = d3.zoom()
        .scaleExtent([0.1, 4]);

    var body = d3.select('body');

    var svg = body.append('svg:svg')
        .attr('width', width)
        .attr('height', height)
        .attr('class', 'if-diagram')
        .call(zoom.on('zoom', function () {
            view.attr('transform', d3.event.transform);
        }));

    var view = svg.append('g');

    var showList = body.append('button')
        .attr('id', 'showList');

    showList.append('span').attr('class', 'if-diagram').text('Liste anzeigen');
    showList.append('span').attr('class', 'if-list').text('Diagramm anzeigen');

    var list = body.append('div')
        .attr('id', 'list')
        .attr('class', 'if-list')
        .append('div');

    var displayMode = 'diagram';
    var currentActive;

    var colors = d3.scaleOrdinal([
        '#f01414',
        '#0a1e6E',
        '#CC0000',
        '#878c96',
        '#FF5A64',
        '#375FC3',
        '#B20000',
        '#000A5A'
    ]);

    var categoryMapping = {
        DBAPI: "API der Deutschen Bahn AG",
        DBOD: "OpenData der Deutschen Bahn AG",
        EXAPI: "API einer anderen Quelle",
        EXOD: "OpenData einer anderen Quelle"
    };

    var simulation = d3.forceSimulation()
        .force('link', d3.forceLink().id(function(d) { return d.id; }))
        .force('charge', d3.forceManyBody().strength(-200))
        .force('center', d3.forceCenter(width / 2, height / 2));

    var sourceIds = {};

    d3.json('https://dilab.co/dbopendata', function(error, data) {
        if (error) throw error;

        data.sources.forEach(function (d) {
            d.id = sourceIds[d.title] = data.nodes.length + 1;
            d.class = 'source';
            d.connections = 0;
            d.category = categoryMapping[d.type];
            data.nodes.push(d);

            list.append('div')
                .text(d.title)
                .on('click', function () {
                    var d = d3.event.target;
                    if (currentActive) {
                        currentActive.setAttribute('class', null);
                    }
                    currentActive = d;
                    d.setAttribute('class', 'active');
                })
                .append('div')
                .html(getInfo(d));
        });

        data.links = [];

        data.nodes.forEach(function (d) {
            if (d.sources) {
                d.sources.forEach(function (s) {
                    if (sourceIds[s]) {
                        data.links.push({
                            source: d.id,
                            target: sourceIds[s],
                            value: 1
                        });
                        data.nodes[sourceIds[s] - 1].connections++;
                    }
                });
                data.nodes[d.id - 1].connections = d.sources.length;
            }
            data.nodes[d.id - 1].class = data.nodes[d.id - 1].class || 'project';
        });

        simulation
            .nodes(data.nodes)
            .on('tick', tick);

        simulation
            .force('link')
            .links(data.links)
            .distance(function (d) {
                return 20 + 10 * (d.source.connections + d.target.connections);
            });

        var link = view.append('g')
            .attr('class', 'links')
            .selectAll('line')
            .data(data.links)
            .enter().append('line')
            .attr('stroke', function (d) {
                return colors(d.source.type);
            });

        var node = view.selectAll('.node')
            .data(data.nodes)
            .enter().append('g')
            .attr('class', function (d) {
                return d.class + ' node';
            })
            .call(d3.drag()
                .on('start', beginDrag)
                .on('drag', drag)
                .on('end', endDrag)
            );

        svg.selectAll('.source')
            .append('circle')
            .attr('r', function (d) {
                return 20 + 3 * d.connections;
            })
            .attr('fill', function (d) {
                return colors(d.type);
            })
            .on('click', showInfo);

        var overlay = d3.select('#overlay')
            .on('click', function () {
                overlay.attr('style', null);
            });

        showList.on('click', function () {
            displayMode = displayMode === 'diagram' ? 'list' : 'diagram';
            body.attr('class', 'is-' + displayMode);
        });

        if (document.implementation.hasFeature("www.http://w3.org/TR/SVG11/feature#Extensibility", "1.1")) {
            node.append('foreignObject')
                .attr("x", -50)
                .attr("y", -10)
                .attr("width", 100)
                .attr("height", 50)
                .append('xhtml:body')
                .on('click', showInfo)
                .append('div')
                .attr("style", function (d) {
                    if (d.class === 'project') {
                        return "border-color: " + colors(d.type);
                    }
                })
                .text(function (d) {
                    return d.title;
                });
        } else {
            node.append('rect')
                .attr('class', 'text-bg')
                .attr('x', '-50')
                .attr('y', '-10')
                .attr('width', '100')
                .attr('height', '15')
                .attr('fill', function (d) {
                    return d.class === 'project' ? 'white' : 'transparent';
                })
                .attr('stroke', function (d) {
                    return d.class === 'project' ? colors(d.type) : 'transparent';
                })
                .on('click', showInfo);

            node.append('text')
                .text(function (d) {
                    return d.title;
                });
        }

        function getInfo(d) {
            var content = (d.description ? '<p>' + d.description + '</p>' : '') +
            (d.contact ? '<p class="labeled"><b>Ansprechpartner:</b> ' + d.contact.replace('\n', ', ') + '</p>' : '') +
            (d.event ? '<p class="labeled"><b>Entstanden:</b> ' + d.event + '</p>' : '') +
            (d.date ? '<p class="labeled"><b>Wann:</b> ' + d.date + '</p>' : '') +
            (d.category ? '<p class="labeled"><b>Kategorie:</b> ' + d.category + '</p>' : '');
            if (d.link) {
                content += '<p>' + d.link.replace(/(https?:\/\/[^\s]+)/gi, '<a href="$1" target="_blank">$1</a>') + '</p>';
            }
            return content;
        }

        function showInfo(d) {
            d3.event.stopImmediatePropagation();
            var content = '<h2>' + d.title + '</h2>' + getInfo(d) + '<button>Schließen</button>';
            overlay
                .attr("style", "display: block")
                .select('div').html(content)
        }

        function tick() {
            link
                .attr('x1', function(d) { return d.source.x; })
                .attr('y1', function(d) { return d.source.y; })
                .attr('x2', function(d) { return d.target.x; })
                .attr('y2', function(d) { return d.target.y; });

            node.attr('transform', function(d) {
                return 'translate(' + d.x + ',' + d.y + ')';
            });
        }
    });

    function beginDrag(d) {
        if (!d3.event.active) {
            simulation.alphaTarget(0.4).restart();
        }
        d.fx = d.x;
        d.fy = d.y;
    }

    function drag(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }

    function endDrag(d) {
        if (!d3.event.active) {
            simulation.alphaTarget(0);
        }
        d.fx = null;
        d.fy = null;
    }
});
