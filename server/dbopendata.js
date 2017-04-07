/**
 * Definition of dbopendata.js
 *
 * @author joachim.schirrmacher@deutschebahn.com
 */

const Auth = require('./google-auth')
const express = require('express')
const app = express()
const winston = require('winston')
const reader = require('./spreadsheet-reader')

winston.level = process.env.LOG_LEVEL || 'info'
const port = process.env.PORT || 3000
const spreadsheetId = '1jY4hQ4AJ4SN9acfO9e7vARuW0E1hjb8xe0ZR1KFQa7I'

Auth().then(auth => {
    function mapNode(row) {
        return {
            'id': row[0],
            'title': row[1],
            'description': row[2],
            'contact': row[3],
            'event': row[4],
            'date': row[5],
            'sources': row[6] ? row[6].split(',') : null,
            'type': row[7],
            'category': row[8],
            'link': row[9]
        }
    }

    function mapSources(row) {
        return {
            'title': row[0],
            'type': row[1],
            'description': row[2],
            'link': row[3]
        }
    }

    function getNodes(req, res) {
        let nodes
        reader.getNodes(auth, spreadsheetId, 'Projekte!A:J', mapNode)
            .then(data => {
                nodes = data
            })
            .then(() => {
                return reader.getNodes(auth, spreadsheetId, 'Datenquellen!A:D', mapSources)
            })
            .then(data => {
                nodes.sources = data.nodes
                return nodes
            })
            .then(data => {
                res.header('Access-Control-Allow-Origin', 'https://dbopendata.github.io')
                res.json(data)
            })
            .catch(err => {
                winston.log('error', err)
                res.status(err[0]).send(err[1])
            })
    }

    app.get('/', getNodes)
    app.listen(port)
    winston.log('info', 'Listening on port ' + port)
})
