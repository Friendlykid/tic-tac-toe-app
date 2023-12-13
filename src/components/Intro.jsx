import * as PropTypes from "prop-types";
import { useEffect, useState } from "react";

export function Intro({ socket, userId }) {
  const [showInput, setShowInput] = useState(false);
  const [gameCode, setGameCode] = useState("");
  const [loadingText, setLoadingText] = useState("Connecting to server.");

  useEffect(() => {
    // Function to update the loading text with three trailing dots
    const updateLoadingText = () => {
      setLoadingText((prevText) => {
        // Add a dot or reset to three dots if already present
        const numberOfDots = (prevText.match(/\./g) || []).length + 1;
        if (numberOfDots < 4) {
          return prevText.concat(".");
        }
        return `Connecting to server.`;
      });
    };

    // Update the loading text in set interval
    const intervalId = setInterval(updateLoadingText, 500);

    // Cleanup: clear the interval when the component is unmounted
    return () => clearInterval(intervalId);
  }, []); // Empty dependency array to run the effect only once
  function handleNewGame() {
    socket.send(JSON.stringify({ action: "newGame", userId: userId }));
  }
  function handleJoinGame(e) {
    e.preventDefault();
    socket.send(
      JSON.stringify({
        action: "joinToGame",
        userId: userId,
        gameId: gameCode,
      }),
    );
  }
  function handleBotGame() {
    socket.send(JSON.stringify({ action: "newBotGame", userId: userId }));
  }

  return (
    <>
      <div className="intro">
        <button
          className="intro-button"
          onClick={handleNewGame}
          disabled={socket.readyState === WebSocket.CONNECTING}
        >
          Start New Game
        </button>
        <button
          className="intro-button"
          onClick={() => {
            setShowInput(true);
          }}
          disabled={!socket || socket.readyState === WebSocket.CONNECTING}
        >
          Join Game
        </button>
        <button
          className="intro-button"
          onClick={handleBotGame}
          disabled={!socket || socket.readyState === WebSocket.CONNECTING}
        >
          Play against computer
        </button>
      </div>
      {!socket ||
        (socket.readyState === WebSocket.CONNECTING && <p>{loadingText}</p>)}
      {showInput && (
        <>
          <label>Game code:</label>
          <form onSubmit={handleJoinGame}>
            <input onChange={(e) => setGameCode(e.target.value)} />
          </form>
        </>
      )}
    </>
  );
}

Intro.propTypes = {
  socket: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
  userId: PropTypes.string,
};
