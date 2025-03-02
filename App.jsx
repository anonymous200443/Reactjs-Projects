import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import "./index.css";
import "./App.css";
import User_profile from "../components/User_profile.jsx";
import Square from "../components/Square";
import Header from "../components/Header";

const socket = io("https://tic-tac-toe-oqjp.onrender.com"); // Connect to the server

const App = () => {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState(null);
  const [winningSquares, setWinningSquares] = useState([]); 
  const [playOnline, setPlayOnline] = useState(false);

  const [room, setRoom] = useState("");
  const [gameStarted, setGameStarted] = useState(false);
  const [playerSymbol, setPlayerSymbol] = useState(null);
  const [playerName, setPlayerName] = useState(""); // New state for player name
  const [opponentName, setOpponentName] = useState("");
  const [playersCount, setPlayersCount] = useState(0);

  useEffect(() => {
    socket.on("playerCount", (count) => {
      setPlayersCount(count);
    });

    socket.on("gameState", (gameState) => {
      setBoard(gameState.board);
      setIsXNext(gameState.isXNext);
      setWinner(gameState.winner);
    });

    socket.on("roomFull", () => {
      alert("Room is full! Please join another room.");
    });

    return () => {
      socket.off("playerCount");
      socket.off("gameState");
      socket.off("roomFull");
    };
  }, []);

  const joinGame = () => {
    if (room.trim() !== "" && playerName.trim() !== "") {
      socket.emit("joinGame", { room, playerName }, (response) => {
        if (response.error) {
          alert(response.error);
        } else {
          setGameStarted(true);
          setPlayerSymbol(response.symbol);
          setOpponentName(response.opponentName || "Waiting for opponent...");
        }
      });
    } else {
      alert("Please enter a Room ID and Name!");
    }
  };

  const handleClick = (index) => {
    if (board[index] || winner || !gameStarted) return;
    if ((isXNext && playerSymbol !== "X") || (!isXNext && playerSymbol !== "O")) return;

    if (socket.connected) {
      socket.emit("makeMove", { room, index }, (response) => {
        if (response?.error) {
          alert(response.error);
        }
      });
    } else {
      alert("Socket is not connected!");
    }
  };

  const resetGame = () => {
    socket.emit("resetGame", room);
  };

  if (!playOnline) {
    return (
      <div className="playOnline">
        <button onClick={() => setPlayOnline(true)}>Play Online</button>
      </div>
    );
  }

  return (
    <>
      <Header />
      <User_profile />
      <div className="container1">
        {!gameStarted ? (
          <div>
            <input
              type="text"
              placeholder="Enter Room ID"
              onChange={(e) => setRoom(e.target.value)}
            />
            <input
              type="text"
              placeholder="Enter Your Name"
              onChange={(e) => setPlayerName(e.target.value)}
            />
            <button onClick={joinGame}>Join Game</button>
          </div>
        ) : (
          <>
            <h2>You are {playerName} ({playerSymbol})</h2>
            <h2>Opponent: {opponentName}</h2>
            <h2>{winner ? `Winner: ${winner}` : `Current Player: ${isXNext ? "X" : "O"}`}</h2>
            <div className="board">
              {board.map((value, index) => (
                <Square key={index} value={value} onClick={() => handleClick(index)} />
              ))}
            </div>
          </>
        )}
      </div>

      {winner && <button onClick={resetGame}>Restart Game</button>}
    </>
  );
};

export default App;
