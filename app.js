import express from 'express';
const app = express();

import http from 'http';
const server = http.createServer(app);

import { Chess } from 'chess.js';
const chess = new Chess();

import { Server } from "socket.io";  
const io = new Server(server, {
    cors: {
    origin: "https://chess-game-play.vercel.app",
    methods: ["GET", "POST"]
  }
});


import 'dotenv/config';
const port = 3000;

let players = {}
let currentPlayer = 'W'

app.get('/', (req, res) => {
    res.send("Server is running");
})


io.on('connection', (socket) => {
    console.log(socket.id,'connected');

    if(!players.white) {
        players.white = socket.id;
        socket.emit('playerRole', 'w');

    } else if(!players.black) {
        players.black = socket.id;
        socket.emit('playerRole', 'b');

    } else {
        socket.emit('spectatorRole');
    }

    socket.on('move', (move) => {
    console.log("Move received:", move, "from:", socket.id);

    if (chess.turn() === 'w' && socket.id !== players.white) return;
    if (chess.turn() === 'b' && socket.id !== players.black) return;

    try {
        const result = chess.move(move);
        if (result) {
            currentPlayer = chess.turn();
            io.emit('move', move);           // optional – you can remove this
            io.emit('boardState', chess.fen());
        } else {
            console.log("Illegal move:", move);
            socket.emit("invalid_move", { 
                reason: "Illegal move", 
                attempted: move 
            });
        }
    } catch (err) {
        console.error("Error processing move:", err);
        socket.emit("invalid_move", { 
            reason: err.message || "Invalid move format", 
            attempted: move 
        });
    }
});
    socket.on('disconnect', () => {
        if(socket.id === players.white) {
            delete players.white;
        } else if( socket.id === players.black ){
            delete players.black;
        }
    })
})

server.listen(process.env.PORT || port, () => {
    console.log(`server is listening`)
})