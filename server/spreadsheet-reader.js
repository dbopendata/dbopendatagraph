const google = require('googleapis')
const sheets = google.sheets('v4')

module.exports.getNodes = (auth, spreadsheetId, dataSelector, mapNode) => {
    return new Promise((fulfil, fail) => {
        sheets.spreadsheets.values.get({
            auth: auth,
            spreadsheetId: spreadsheetId,
            range: dataSelector
        }, function(err, response) {
            if (err) {
                fail([500, 'The API returned an error: ' + err])
            } else {
                const rows = response.values
                if (rows.length == 0) {
                    fail([404, 'No data found.'])
                } else {
                    fulfil({nodes: rows.splice(1).map(mapNode)})
                }
            }
        })
    })
}
