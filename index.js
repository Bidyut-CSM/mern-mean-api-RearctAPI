require('dotenv').config();
const PORT = process.env.PORT;
const SOCKET_PORT = process.env.SOCKETPORT;
const path = require('path');
const Fileupload = require('express-fileupload');
var cors = require('cors')
const express = require('express');
var bodyParser = require("body-parser");
 

////web socket///
const http = require('http');
const webSocketServer = require('websocket').server;
const server = http.createServer();
server.listen(SOCKET_PORT);
const wsServer = new webSocketServer({
    httpServer: server,
    autoAcceptConnections: false
});
const clients = {}; 

var GetUniqueID = () => {
    const now = new Date();
    return `${now.getFullYear()}_${now.getMonth() + 1}_${now.getDate()}_${now.getHours()}-${now.getMinutes()}_${now.getSeconds()}_${now.getMilliseconds()}`;
}
function originIsAllowed(origin) {
    return true;
}
wsServer.on('request', (request) => {


    var userID = GetUniqueID();
    if (originIsAllowed(request.origin) === true) {
        console.log(new Date() + ' Recieved a new connrction from origin ' + request.origin);
    } else {
        request.reject(); return;
    }
    const connection = request.accept(null, request.origin);
    clients[userID] = connection;

    connection.on('message', function (message) {
        if (message.type === 'utf8') {
            console.log('Received Message: ', message.utf8Data);
            for (key in clients) {
                clients[key].sendUTF(message.utf8Data);
            }
        }
        else if (message.type === 'binary') {
            console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
            for (key in clients) {
                clients[key].sendBytes(message.binaryData);
            }
        }
    });


    connection.on('close', function (reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });

});

////web socket////

const app = express();
app.use(express.json());
app.use(Fileupload());
app.use(cors())
app.use(bodyParser.json());
app.use("/users-file", express.static('./public/users/'));
app.use("/users-chat-file", express.static('./public/chat-files/'));
app.use(require('./routes/Route'));
app.listen(PORT);
