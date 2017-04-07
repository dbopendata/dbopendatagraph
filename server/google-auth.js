const fs = require('fs')
const readline = require('readline')
const googleAuth = require('google-auth-library')
const winston = require('winston')
winston.level = process.env.LOG_LEVEL || 'info'

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/sheets.googleapis.com-nodejs-quickstart.json
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']
const TOKEN_DIR = './'
const TOKEN_PATH = TOKEN_DIR + 'sheets.googleapis.com-nodejs-quickstart.json'

module.exports = () => {
    return new Promise((fulfil, reject) => {
        // Load client secrets from a local file.
        fs.readFile('client_secret.json', (err, content) => {
            if (err) {
                reject('Error loading client secret file: ' + err)
            } else {
                // Authorize a client with the loaded credentials, then setup routes
                fulfil(authorize(JSON.parse(content)))
            }
        })
    })

    function authorize(credentials) {
        const clientSecret = credentials.installed.client_secret
        const clientId = credentials.installed.client_id
        const redirectUrl = credentials.installed.redirect_uris[0]
        const auth = new googleAuth()
        const oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl)

        return new Promise((fulfil) => {
            // Check if we have previously stored a token.
            fs.readFile(TOKEN_PATH, function(err, token) {
                if (err) {
                    fulfil(getNewToken(oauth2Client))
                } else {
                    oauth2Client.credentials = JSON.parse(token)
                    fulfil(oauth2Client)
                }
            })
        })
    }

    /**
     * Get and store new token after prompting for user authorization, and then
     * execute the given callback with the authorized OAuth2 client.
     *
     * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
     *     client.
     */
    function getNewToken(oauth2Client) {
        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES
        })
        return new Promise((fulfil, reject) => {
            winston.log('info', 'Authorize this app by visiting this url: ', authUrl)
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            })
            rl.question('Enter the code from that page here: ', function(code) {
                rl.close()
                oauth2Client.getToken(code, function(err, token) {
                    if (err) {
                        reject('Error while trying to retrieve access token: ' + err)
                    } else {
                        oauth2Client.credentials = token
                        storeToken(token)
                        fulfil(oauth2Client)
                    }
                })
            })
        })
    }

    /**
     * Store token to disk be used in later program executions.
     *
     * @param {Object} token The token to store to disk.
     */
    function storeToken(token) {
        try {
            fs.mkdirSync(TOKEN_DIR)
        } catch (err) {
            if (err.code != 'EEXIST') {
                throw err
            }
        }
        fs.writeFile(TOKEN_PATH, JSON.stringify(token))
        winston.log('info', 'Token stored to ' + TOKEN_PATH)
    }
}
