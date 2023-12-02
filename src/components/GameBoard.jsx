import * as PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy } from "@fortawesome/free-solid-svg-icons";
import { toast, ToastContainer } from "react-toastify";
function Square({ value, onSquareClick }) {
  return (
    <button className="square" onClick={onSquareClick}>
      {value}
    </button>
  );
}
Square.propTypes = {
  value: PropTypes.string,
  onSquareClick: PropTypes.func,
};

export function GameBoard({ game, setGame, userId, socket }) {
  const isX = game.X === userId;
  const notify = (message) => {
    toast.info(message, {
      position: "bottom-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: false,
      progress: undefined,
      theme: "dark",
    });
  };

  function handleClick(i) {
    const newBoard = [...game.board];
    if (isX === (game.next === "X")) {
      newBoard[i] = game.next;

      setGame({ ...game, board: newBoard });
      socket.send(
        JSON.stringify({
          action: "move",
          gameId: game.gameId,
          board: newBoard,
        }),
      );
    }
  }

  function handleCopy(e) {
    e.stopPropagation();
    navigator.clipboard.writeText(game.gameId);
    notify("Game id copied to clipboard");
  }

  return (
    <>
      <div>Your symbol is {isX ? "X" : "O"}</div>
      <div className="game-id" onClick={handleCopy} title="Copy to clipboard">
        <label>Game id:</label>
        {game.gameId}
        <FontAwesomeIcon icon={faCopy} className="faCopy" />
      </div>

      {!game.O && (
        <div className="loading">
          <img src="/src/assets/loading.gif" alt="loading" />
          <p>Waiting for other player</p>
        </div>
      )}
      <div className="board">
        <div className="board-row">
          <Square value={game.board[0]} onSquareClick={() => handleClick(0)} />
          <Square value={game.board[1]} onSquareClick={() => handleClick(1)} />
          <Square value={game.board[2]} onSquareClick={() => handleClick(2)} />
        </div>
        <div className="board-row">
          <Square value={game.board[3]} onSquareClick={() => handleClick(3)} />
          <Square value={game.board[4]} onSquareClick={() => handleClick(4)} />
          <Square value={game.board[5]} onSquareClick={() => handleClick(5)} />
        </div>
        <div className="board-row">
          <Square value={game.board[6]} onSquareClick={() => handleClick(6)} />
          <Square value={game.board[7]} onSquareClick={() => handleClick(7)} />
          <Square value={game.board[8]} onSquareClick={() => handleClick(8)} />
        </div>
      </div>

      <ToastContainer />
    </>
  );
}

GameBoard.propTypes = {
  game: PropTypes.object,
  setGame: PropTypes.func,
  userId: PropTypes.string,
  socket: PropTypes.object,
};
