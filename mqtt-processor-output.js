const net = require('net');
const fs = require('fs')
const mqtt = require('mqtt')
var sockets = [];
var options = {
    retain: false,
    qos: 1
};

var ConfigIniParser = require("config-ini-parser").ConfigIniParser;
var delimiter = "\n"; //or "\n" for *nux
parser = new ConfigIniParser(delimiter); //If don't assign the parameter delimiter then the default value \n will be used
parser.parse(fs.readFileSync('/home/cunit/tmp/config/externrelay.ini', 'utf-8'));
var deviceuid = parser.get("relay", "Relay1").replace(/['"]+/g, '');

var Memcached = require('memcached');
var memcached = new Memcached('127.0.0.1:11211');

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
    jsonObj = JSON.parse(cleanData);
    jsonObj.DEVICEUID = deviceuid;

    memcached.get('timer', function (err, data) {
        jsonObj.MAXTIME = parseInt(data);
        cleanData = cleanInput(JSON.stringify(jsonObj));
//        console.log('DATA: recieved.');
        if (client.connected == true) {
            client.publish("relays/" + deviceuid + "/v1/incoming", cleanData, options)
//          console.log('DATA: published.');
        }
    });
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


// CREATE SOCKET LISTENING ON PORT 7777
var server = net.createServer(newSocket);
server.listen(7777);
