import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import "./index.css";
import "./App.css";
import User_profile from "../components/User_profile.jsx";
import Square from "../components/square.jsx";
import Header from "../components/Header.jsx";

const socket = io("https://reactjs-projects.onrender.com");

const App = () => {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState(null);
  const [playOnline, setPlayOnline] = useState(false);
  const [room, setRoom] = useState("");
  const [gameStarted, setGameStarted] = useState(false);
  const [playerSymbol, setPlayerSymbol] = useState(null);
  const [playersCount, setPlayersCount] = useState(0);
  const [playerNames, setPlayerNames] = useState({ X: "", O: "" });
  const [playerName, setPlayerName] = useState(""); // Store user's input name

  useEffect(() => {
    const handlePlayerNames = (names) => setPlayerNames(names);
    const handlePlayerSymbol = (symbol) => setPlayerSymbol(symbol);
    const handleGameState = (gameState) => {
      setBoard(gameState.board);
      setIsXNext(gameState.isXNext);
      setWinner(gameState.winner);
    };
    const handleWinner = (winnerName) => {
      setWinner(winnerName);
      alert(`Game Over! Winner: ${winnerName}`);
    };

    socket.on("playerNames", handlePlayerNames);
    socket.on("playerSymbol", handlePlayerSymbol);
    socket.on("gameState", handleGameState);
    socket.on("winner", handleWinner);
    socket.on("roomFull", () => alert("Room is full! Please join another room."));

    return () => {
      socket.off("playerNames", handlePlayerNames);
      socket.off("playerSymbol", handlePlayerSymbol);
      socket.off("gameState", handleGameState);
      socket.off("winner", handleWinner);
    };
  }, []);

  const joinGame = () => {
    if (room.trim() !== "" && playerName.trim() !== "") {
      socket.emit("joinGame", { room, name: playerName });
      setGameStarted(true);
    } else {
      alert("Enter both room ID and name!");
    }
  };

  const handleClick = (index) => {
    if (!gameStarted || board[index] || winner) return;
    if ((isXNext && playerSymbol !== "X") || (!isXNext && playerSymbol !== "O")) return;

    socket.emit("makeMove", { room, index });
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
          <div className="user-input">
            <div className="user-container"><p>Enter the details To enter the game</p>
            <input id="pname"
              type="text"
              placeholder="Enter Name"
              onChange={(e) => setPlayerName(e.target.value)}
            />
            <input id="room-id"
              type="text"
              placeholder="Enter Room ID"
              onChange={(e) => setRoom(e.target.value)}
            />
            <button onClick={joinGame}>Join Game</button>
            </div>
          </div>
        ) : (
          <>
          <div className="player-head">
            <h2> You are: {playerName} ({playerSymbol})</h2>
            <h2>{winner ? `Winner: ${winner}` : `Current Turn: ${isXNext ? playerNames.X : playerNames.O}`}</h2></div>
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
