const http = require('http');
const readline =require('readline');

const requestHandler = require('./request');
const PeerToPeer = require('./peer-to-peer');

const handler = new requestHandler();
const peer = new PeerToPeer(null);


const rl = readline.createInterface({
    input: global.process.stdin,
    output: global.process.stdout
});

let STATE = 0;

const PORTS = [3000, 8080, 8000, 11000];
let PORT = 0;

let LOCAL_IP, LOCAL_PORT = PORTS[PORT];
LOCAL_IP = '127.0.0.1';

const server = http.createServer((req, res) => {
    handler.handle(req, res);
});

handler.get('/connect', (req, res) => {
    if(!peer.connect(req.headers['x-forwarded-for'])){
        res.writeHead(403, {'Content-type': 'application/json'});
        handler.json(res, {'error': 'already connected'});
    }
    else{
        res.writeHead(200, {'Content-type': 'application/json'});
        handler.json(res, {'msg': 'successfully connected'});
        STATE = 1;
        peer.connect(req.query.ip+':'+req.query.port);
        global.console.log(req.query);
    }
});

handler.get('/accept', (req, res) => {
    global.console.log('fuck you man');
    global.console.log(peer.ip);
    peer.ip = [];
    peer.connect(req.socket.localAddress+':'+req.socket.localPort);
    global.console.log(peer.ip);
    global.console.log(req.query);
    for(let i in req.query.peers){
        peer.ip.push(req.query.peers[i]);
    }
    global.console.log(peer.ip);
    handler.json(res, {'msg': 'successfully connected'});
});

handler.get('/message', (req, res) => {
    let name = req.query.name ? req.query.name : req.connection.remoteAddress+':'+req.connection.remotePort;
    global.console.log(`${name} --- ${req.query.msg}`);
    handler.json(res, {'msg': 'Message arrived'});
});

handler.get('/disconnect', (req, res) => {
    peer.disconnect(req.socket.localAddress);
    handler.json(res, {'msg': 'Request accepted'});
});

server.listen(PORTS[PORT]);

server.on('error', (e) => {
    if(e.code == 'EADDRINUSE'){
        ++PORT;
        if(PORT >= PORTS.length){
            global.console.err('All the ports are in use');
            process.exit(1);
        }
        LOCAL_PORT = PORTS[PORT];
        server.listen(PORTS[PORT]);
    }
});

server.on('listening', () => {
    global.console.log(`Server listening at 127.0.0.1:${PORTS[PORT]}`);
});

let readMessage = () => {
    rl.prompt();
    global.console.log('You can talk now');
    rl.on('line', (message) => {
        message = message.trim();
        if(message != null || message != ''){
            for(let i in peer.ip){
                handler.send('http://'+peer.ip[i], '/message', {msg: message}, () => {});
            }
        }
        rl.prompt();
    });
};

let readIp = () => {
    rl.question('Enter the url you want to connect to : ', (ip) => {
        if(STATE == 1)
            return readMessage();

        ip = ip.trim();
        if(ip && ip != ''){
            handler.send('http://'+ip,'/connect', {ip:LOCAL_IP, port:LOCAL_PORT}, (res, err) => {
                if(err){
                    global.process.stderr.write(`An error occurred ${err.message}\n`);
                    global.process.stdout.write('Connection failed try again: ');
                    readIp();
                }
                else if(res.statusCode != 200){
                    global.process.stdout.write('Connection failed try again: ');
                    readIp();
                }
                else{
                    peer.connect(ip);
                    global.console.log(`successfully connected to ${ip}`);
                    return readMessage();
                }
            });
        }
        else
            readIp();
    });
};

readIp();
