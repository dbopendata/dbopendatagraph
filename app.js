/**
 * Definition of network
 *
 * @author     joachim.schirrmacher@deutschebahn.com
 */
'use strict';

requirejs.config({
    baseUrl: '.',
    paths: {
    }
});

requirejs(['node_modules/d3/build/d3.min'], function(d3) {
    var width = window.innerWidth;
    var height = window.innerHeight;

    var zoom = d3.zoom()
        .scaleExtent([0.1, 4])
        .translateExtent([[-100, -100], [width + 90, height + 100]]);

    var svg = d3.select('body').append('svg:svg')
        .attr('width', width)
        .attr('height', height)
        .call(zoom.on('zoom', function () {
            view.attr('transform', d3.event.transform);
        }));

    var view = svg.append('g');

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

    var simulation = d3.forceSimulation()
        .force('link', d3.forceLink().id(function(d) { return d.id; }))
        .force('charge', d3.forceManyBody())
        .force('center', d3.forceCenter(width / 2, height / 2));

    var sourceIds = {};

    d3.json('data/sources.json', function (error, sources) {
        d3.json('data/projects.json', function(error, data) {
            if (error) throw error;

            sources.forEach(function (d) {
                sourceIds[d.title] = data.nodes.length;
                data.nodes.push({
                    "id": data.nodes.length,
                    "class": "source",
                    "type": d.type,
                    "title": d.title,
                    "connections": 0
                })
            });

            data.links = [];

            data.nodes.forEach(function (d) {
                if (d.sources) {
                    d.sources.forEach(function (s) {
                        if (!sourceIds[s]) {
                            debugger;
                        }
                        data.links.push({
                            source: d.id,
                            target: sourceIds[s],
                            value: 1
                        });
                        data.nodes[sourceIds[s]].connections++;
                    });
                    data.nodes[d.id - 1].connections = d.sources.length;
                    data.nodes[d.id - 1].class = 'project';
                }
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
                    return d.class;
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
                });

            var overlay = d3.select('#overlay')
                .on('click', function () {
                    overlay.attr('style', null);
                });

            svg.selectAll('.project')
                .on('click', function (e) {
                    var content = '<h2>' + e.title + '</h2><p>' + e.description + '</p><p>' + e.contact + '</p>' +
                            '<p>' + e.event + '</p>' +
                            '<p>' + e.date + '</p>' +
                            '<p>' + e.category + '</p>' +
                            '<p><a target="_blank" href="' + e.link + '">' + e.link + '</a></p>' +
                            '<button>Schließen</button>';
                    overlay
                        .attr("style", "display: block")
                        .select('div').html(content)
                });

            node.append('foreignObject')
                .attr("x", -50)
                .attr("y", -10)
                .attr("width", 100)
                .attr("height", 50)
                .append('xhtml:body')
                .append('div')
                .attr("style", function (d) {
                    if (d.class === 'project') {
                        return "border-color: " + colors(d.type);
                    }
                })
                .text(function(d) { return d.title; });

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
