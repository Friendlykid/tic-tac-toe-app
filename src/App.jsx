import { useEffect, useState } from "react";
import "./App.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { GameBoard } from "./components/GameBoard.jsx";
import { Intro } from "./components/Intro.jsx";
import { processMessage } from "./utils/ProcessMessage.js";
import { errorToast, notify } from "./utils/Notify.js";

function App() {
  const [socket, setSocket] = useState(false);
  const [userId, setUserId] = useState(null);
  const [game, setGame] = useState(null);
  useEffect(() => {
    let check = true;
    const newSocket = new WebSocket("ws://localhost:8080");
    //const newSocket = new WebSocket("wss://websocket-server-3lie.onrender.com");

    // Connection opened
    newSocket.addEventListener("open", () => {
      notify("Connected to Websocket!");
    });

    // Listen for messages
    newSocket.addEventListener("message", (event) => {
      const json = JSON.parse(event.data);
      if (json.status !== "error") {
        processMessage(json, setUserId, setGame, game);
        console.log(json);
        if (json.type === "move") {
          notify(json);
        }
        notify(json.message);
      } else {
        errorToast(json.message);
        console.log(json);
      }
    });

    if (check) {
      setSocket(newSocket);
    }

    return () => {
      check = false;
      console.log("Disconnected from server.");
      newSocket.close();
    };
    //empty dependency array is correct!
  }, []);

  return (
    <>
      <h1>Online Tic Tac</h1>
      {!game && (
        <Intro socket={socket} userId={userId} game={game} setGame={setGame} />
      )}
      {game && (
        <GameBoard
          game={game}
          setGame={setGame}
          userId={userId}
          socket={socket}
        />
      )}

      <ToastContainer />
    </>
  );
}
//
export default App;
