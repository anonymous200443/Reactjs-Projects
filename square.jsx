import React from "react";

const Square = ({ value, onClick, isWinning, winner }) => {
  const getWinningColor = () => {
    if (!isWinning) return ""; // Default no color
    return winner === "X" ? "winning-x" : "winning-o";
  };

  return (
    <button className={`square ${getWinningColor()}`} onClick={onClick}>
      {value}
    </button>
  );
};

export default Square;
