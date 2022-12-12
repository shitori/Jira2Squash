var WebSocket = require('faye-websocket')

//v2
const Jira = require('../models/v2/apiJira')
const Proxy = require('../models/v2/proxy')
const Squash = require('../models/v2/apiSquash')

const dotenv = require('dotenv')
dotenv.config()

function test() {
    var proxyJira = new Proxy('') //TODO mettre à jour
    var proxySquash = new Proxy('') //TODO mettre JSSESIONID
    var jira = new Jira(proxyJira.getProxy())
    var squash = new Squash(proxySquash.getProxy())
    jira.getIssues(
        'project = FCCNB AND issuetype in (Improvement, Bug, Story) AND Sprint = 35330 ORDER BY priority DESC, updated DESC'
    )
        .then((res) => {
            return squash.importInSquashWithAPI(res, 999)
        })
        .then((squashReturn) => console.info(squashReturn))
        .catch((err) => console.error(err))
}

function testSocket() {
    var client = new WebSocket.Client('ws://localhost:3002/')
    client.on('open', function () {
        console.info('Connection established!')
        client.send('In testSocket')
    })

    client.on('message', function (message) {
        console.info("Data from WebSocketServer '" + message.data + "'")
    })

    client.on('close', function (message) {
        console.info('Connection closed!', message.code, message.reason)

        client = null
    })
}

module.exports = {
    test,
    testSocket,
}
