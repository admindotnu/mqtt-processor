// Create a new server and provide a callback for when a connection occurs
var server = net.createServer(newSocket);
// Listen on port 8888
server.listen(8888);
