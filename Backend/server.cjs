const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const rooms = {}; // Store rooms and game states

// Function to check for a winner
const checkWinner = (board) => {
  const winningCombos = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]             // Diagonals
  ];

  for (const [a, b, c] of winningCombos) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a]; // Return the winner ("X" or "O")
    }
  }

  return board.includes(null) ? null : "Draw"; // Return "Draw" if board is full
};

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("joinGame", ({ room, name }) => {
    if (!rooms[room]) {
      rooms[room] = { players: [], board: Array(9).fill(null), isXNext: true, playerNames: {} };
    }

    if (rooms[room].players.length < 2) {
      rooms[room].players.push(socket.id);
      socket.join(room);

      const playerSymbol = rooms[room].players.length === 1 ? "X" : "O";
      rooms[room].playerNames[playerSymbol] = name; // Store player name

      socket.emit("playerSymbol", playerSymbol);
      io.to(room).emit("playerNames", rooms[room].playerNames);

      console.log(`Players in Room ${room}:`, rooms[room].playerNames);
    } else {
      socket.emit("roomFull");
    }
  });

  socket.on("makeMove", ({ room, index }) => {
    if (!rooms[room]) return;

    const { board, isXNext, playerNames } = rooms[room];

    if (board[index] !== null) return;

    const currentSymbol = isXNext ? "X" : "O";
    board[index] = currentSymbol; // Update board
    rooms[room].isXNext = !isXNext; // Toggle turn

    const winnerSymbol = checkWinner(board); // Check if someone won
    const winnerName = winnerSymbol ? playerNames[winnerSymbol] : null; // Get winner name

    console.log(`Move made in Room ${room}:`, board);
    
    io.to(room).emit("gameState", {
      board,
      isXNext: rooms[room].isXNext,
      winner: winnerName ? winnerName : (winnerSymbol === "Draw" ? "Draw" : null),
    });

    if (winnerName) {
      console.log(`Winner in Room ${room}: ${winnerName}`);
      io.to(room).emit("winner", winnerName);
    }
  });

  socket.on("resetGame", (room) => {
    if (rooms[room]) {
      rooms[room].board = Array(9).fill(null);
      rooms[room].isXNext = true;
      io.to(room).emit("gameState", rooms[room]);
    }
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

server.listen(3001, () => {
  console.log("Server running on port 3001");
});
