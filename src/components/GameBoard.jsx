import * as PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy } from "@fortawesome/free-solid-svg-icons";
import { toast, ToastContainer } from "react-toastify";
import Square from "./Square.jsx";

function checkForWinners(board) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

export function GameBoard({ game, setGame, userId, socket }) {
  const isX = game.X === userId;
  const isOnMove = isX === (game.next === "X");
  const isFilled = !game.board.some( a => a === null);
  let winner = checkForWinners(game.board);
  console.log(game);
  const notify = (message) => {
    toast.info(message, {
      position: "bottom-right",
      autoClose: 2000,
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
    //Any player is not connected
    if (!(game.X || game.O)) {
      notify("You must wait for other player!");
      return;
    }
    if (isX === (game.next === "X") && newBoard[i] === null) {
      newBoard[i] = game.next;
      socket.send(
        JSON.stringify({
          action: "move",
          gameId: game.gameId,
          userId: userId,
          game: {...game, board: newBoard},
        }),
      );
      setGame({...game, board:newBoard});
    } else {

      notify("Wrong move!");
    }
  }

  function handleCopy(e) {
    e.stopPropagation();
    navigator.clipboard.writeText(game.gameId).catch(reason => console.log(reason));
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

      {!winner && (!game.O || !isOnMove) && (
        <div className="loading">
          <img src="/src/assets/loading.gif" alt="loading" />
          <p>
            {isOnMove ? "Waiting for other player" : "Waiting for response"}
          </p>
        </div>
      )}
      <div className="board">
        {new Array(3).fill(0).map((_, i) => (
          <div key={i} className="board-row">
            {new Array(3).fill(0).map((_, j) => {
              const index = i * 3 + j;
              return (
                <Square
                  key={index}
                  value={game.board[index]}
                  onSquareClick={() => handleClick(index)}
                  disabled={!(isOnMove || winner)}
                />
              );
            })}
          </div>
        ))}
      </div>
      {(winner || isFilled) && <div className="game-id">{winner?winner + " won!": "It's a draw"} </div>}
      {(winner || isFilled) && (
        <button
          className="intro-button"
          onClick={() =>{
            if(game.bot){
              socket.send(
                  JSON.stringify({ action: "newBotGame", userId: userId }),
              )
            }else{
             socket.send(JSON.stringify({ action: "newGameAgain", userId: userId, gameId: game.gameId }))
            }
          }
        }
        >
          Play again
        </button>
      )}
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
