/**
 * Definition of getProjectListAsCSV.js
 *
 * @author     joachim.schirrmacher@deutschebahn.com
 */
/*global define*/
'use strict';

requirejs.config({
    baseUrl: '.',
    paths: {
    }
});

define(['lib/text!data/projects.json'], function (projects) {
    JSON.parse(projects).nodes.forEach(function (project, index) {
        if (!index) {
            document.write(Object.keys(project).join(',') + '<br>');
        }
        var row = [];
        Object.keys(project).forEach(function (key) {
            row.push('"' + project[key] + '"');
        });
        document.write(row.join(','), '<br>');
    });
});
