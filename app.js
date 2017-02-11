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

    var colors = d3.scaleOrdinal(d3.schemeCategory20);

    var simulation = d3.forceSimulation()
        .force('link', d3.forceLink().id(function(d) { return d.id; }))
        .force('charge', d3.forceManyBody())
        .force('center', d3.forceCenter(width / 2, height / 2));

    var sourceIds = {};

    d3.json('data/sources.json', function (error, sources) {
        d3.json('data/projects.json', function(error, data) {
            if (error) throw error;

            sources.forEach(function (d) {
                sourceIds[d] = data.nodes.length;
                data.nodes.push({
                    "id": data.nodes.length,
                    "class": "source",
                    "title": d,
                    "users": 0
                })
            });

            data.links = [];

            data.nodes.forEach(function (d) {
                if (d.class !== 'source') {
                    d.sources.forEach(function (s) {
                        if (!sourceIds[s]) {
                            debugger;
                        }
                        data.links.push({
                            source: d.id,
                            target: sourceIds[s],
                            value: 1
                        });
                        data.nodes[sourceIds[s]].users++
                    })
                }
            });

            simulation
                .nodes(data.nodes)
                .on('tick', tick);

            simulation
                .force('link')
                .links(data.links)
                .distance(function (d) {
                    return 10 * ((d.source.sources ? d.source.sources.length : 1) + d.target.users);
                });

            var node = view.selectAll('.node')
                .data(data.nodes)
                .enter().append('g')
                .attr('class', 'node')
                .call(d3.drag()
                    .on('start', beginDrag)
                    .on('drag', drag)
                    .on('end', endDrag)
            );

            node.append('circle')
                .attr('r', 10)
                .attr('fill', function(d) { return colors(d.type); });

            node.append('text')
                .attr('dx', 0)
                .attr('dy', '2em')
                .text(function(d) { return d.title; });

            var link = view.append('g')
                .attr('class', 'links')
                .selectAll('line')
                .data(data.links)
                .enter().append('line');

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
