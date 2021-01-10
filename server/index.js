const express = require('express');
const next = require('next');

const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });

const app = express();
const handle = nextApp.getRequestHandler();
const server = require('http').Server(app);
const io = module.exports.io = require('socket.io')(server);
const socket = require('./socket');

nextApp.prepare().then(() => {
    app.all('*', (req, res) => handle(req, res));

    io.on('connection', socket);

    server.listen(port, (err) => {
        if (err) throw err;
        console.log(`> Ready on http://localhost:${ port }`);
    });
});