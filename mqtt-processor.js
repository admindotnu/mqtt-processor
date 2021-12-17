const net = require('net');
const mqtt = require('mqtt')
var sockets = [];
var options = {
    retain: false,
    qos: 1
};


const host = '127.0.0.1'
const port = '1883'
const clientId = `mhe_${Math.random().toString(16).slice(3)}`


const connectUrl = `mqtt://${host}:${port}`

const client = mqtt.connect(connectUrl, {
    clientId,
    clean: true,
    connectTimeout: 1000,
    reconnectPeriod: 1000,
})

/*
 * Cleans the input of carriage return, newline
 */
function cleanInput(data) {
    return data.toString().replace(/(\r\n|\n|\r)/gm, "");
}

function newSocket(socket) {
    sockets.push(socket);
    // socket.write('Welcome to the Telnet server!\n');
    socket.on('data', function (data) {
        receiveData(socket, data);
    });
    socket.on('close', function () {
        closeSocket(socket);
    })
}


/*
 * Method executed when data is received from a socket
 */
function receiveData(socket, data, options) {
    var cleanData = cleanInput(data);

    console.log('DATA: recieved.');
    if (client.connected == true) {
        client.publish("relays/10BAEABD380CA/v1/incoming", cleanData, options)
        console.log('DATA: published.');
    }

}

/*
 * Method executed when a socket ends
 */
function closeSocket(socket) {
    var i = sockets.indexOf(socket);
    if (i != -1) {
        sockets.splice(i, 1);
    }
}


// CREATE SOCKET LISTENING ON PORT 9999
var server = net.createServer(newSocket);
server.listen(7777);
