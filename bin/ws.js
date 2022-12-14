const serverPort = 3002,
    http = require('http'),
    express = require('express'),
    app = express(),
    server = http.createServer(app),
    WebSocket = require('ws'),
    websocketServer = new WebSocket.Server({ server })

//when a websocket connection is established
websocketServer.on('connection', (webSocketClient) => {
    //send feedback to the incoming connection
    webSocketClient.send('{ "connection" : "ok"}')

    //when a message is received
    webSocketClient.on('message', (message) => {
        //for each websocket client
        websocketServer.clients.forEach((client) => {
            //send the client the current message
            //client.send(`{ "message" : "${message}" }`);
            client.send(message)
        })
    })
})

//start the web server
server.listen(serverPort, () => {
    console.info(`Websocket server started on port ` + serverPort)
})
