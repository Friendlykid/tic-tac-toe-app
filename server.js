import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });
/**
 * key: userId
 * value: websocket
 */
const clients = new Map();

/**games {
 X: userId,
 O: userId,
 board: new Array(9) filled with 0 or X,
 next: "X" | "O",
 bot: false | true  if 2 players then false
  }
  */
const games = new Map();

function heartbeat() {
  this.isAlive = true;
}

wss.on("connection", function connection(ws) {
  const userID = crypto.randomUUID();
  clients.set(userID, ws);
  console.log("connected: " + userID);
  console.log(`${clients.size} connected.`);
  ws.isAlive = true;
  ws.on("error", console.error);
  ws.on("pong", heartbeat);

  ws.on("message", function message(data) {
    const res = processData(JSON.parse(data));
    console.log("received: %s", JSON.parse(data));
    console.log(
      "sending %s to %s",
      JSON.stringify(res),
      JSON.stringify(JSON.parse(data).userId),
    );
    if (res.type === "move" && res.game.O === "bot") {
      setTimeout(() => ws.send(JSON.stringify(res)), 1000);
    } else {
      ws.send(JSON.stringify(res));
    }
    if (res.type === "move" && res.game.O !== "bot") {
      console.log(
        "sending %s to %s",
        JSON.stringify(res),
        JSON.stringify(res.sendTo),
      );
      clients.get(res.sendTo).send(JSON.stringify(res));
    }
    if (res.type === "joinedGame" && res.status === "success") {
      //send to other player
      clients.get(findGameByPlayer(userID).X).send(
        JSON.stringify({
          status: "success",
          message: "Player joined",
          type: "playerJoined",
          game: res.game,
        }),
      );
    }
    if (res.type === "newGameAgain") {
      clients.get(res.sendTo).send(JSON.stringify(res));
    }
  });
  ws.on("close", () => {
    console.log(`Client ${userID} disconnected.`);
    const game = findGameByPlayer(userID);
    const otherPlayer = game?.X === userID ? game?.O : game?.X;
    if (game && otherPlayer !== "bot") {
      clients
        .get(otherPlayer)
        ?.send(JSON.stringify(processData({ action: "playerDisconnected" })));
    }
    // Remove the client from the map
    clients.delete(userID);
    console.log(`${clients.size} connected.`);
  });
  console.log(
    "sending: %s",
    JSON.stringify({
      userId: userID,
      status: "success",
      message: "Assigned userId",
      type: "userId",
    }),
  );
  ws.send(
    JSON.stringify({
      userId: userID,
      status: "success",
      message: "Assigned user id",
      type: "userId",
    }),
  );
});

console.log("server is working");

const interval = setInterval(function ping() {
  wss.clients.forEach(function each(ws) {
    if (ws.isAlive === false) return ws.terminate();

    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on("close", function close() {
  clearInterval(interval);
});

/** generates return message for client
 *
 * @param data data sent by client
 * @returns {{status: string,
 *            type: string,
 *            }}
 */
function processData(data) {
  let result = { status: "success", type: "" };
  switch (data.action) {
    //Always is X and stars new game
    case "newGame": {
      const gameId = crypto.randomUUID();
      games.set(gameId, {
        X: data.userId,
        O: null,
        board: new Array(9),
        next: "X",
        bot: false,
      });
      result.type = "newGame";
      result.gameId = gameId;
      result.game = games.get(gameId);
      result.message = "New game started";
      console.log("New game started.");
      break;
    }
    //Always is X and stars new game
    case "newBotGame": {
      const gameId = crypto.randomUUID();
      games.set(gameId, {
        X: data.userId,
        O: "bot",
        board: new Array(9),
        next: "X",
        bot: true,
      });
      result.type = "newBotGame";
      result.gameId = gameId;
      result.game = games.get(gameId);
      result.message = "New game started";
      console.log("New game started.");
      break;
    }
    //Always is O
    case "joinToGame": {
      result.type = "joinedGame";
      const game = games.get(data.gameId);
      if (game && !game.bot && !game.O) {
        games.set(data.gameId, { ...games.get(data.gameId), O: data.userId });
        result.game = {
          gameId: data.gameId,
          ...games.get(data.gameId),
        };
        result.gameId = data.gameId;
        result.message = "Added to game";
      } else {
        result.status = "error";
        result.message = "Game does not exist or is in play.";
        console.log(game, data.gameId);
      }
      break;
    }
    case "move": {
      result.type = "move";
      const game = games.get(data.gameId);
      game.board = data.game.board;
      game.next = game.next === "X" ? "O" : "X";
      games.set(data.gameId, game);
      result.game = { ...games.get(data.gameId), gameId: data.gameId };
      result.message = "Player made a move";
      if (games.get(data.gameId).bot) {
        result.sendTo = "bot";
        result.game = {
          gameId: data.gameId,
          ...makeBotMove(games.get(data.gameId)),
        };
      } else if (games.get(data.gameId)[data.game.next]) {
        result.sendTo = game.next === "X" ? game.X : game.O;
      } else {
        result.status = "error";
        result.message = "invalid move";
      }
      console.log("New move");
      break;
    }
    case "playerDisconnected": {
      result.type = "playerDisconnected";
      result.message = "Player disconnected!";
      break;
    }
    case "newGameAgain": {
      // user sends gameId and userId
      result.type = "newGameAgain";
      const game = games.get(data.gameId);
      //const playersSymbol = game.X === data.userId ? "X": "O";
      result.sendTo = game.X === data.userId ? game.O : game.X;
      game.next = "X";
      game.board = new Array(9);
      games.set(game.gameId, game);
      result.game = { ...game, gameId: data.gameId };
      break;
    }
    default: {
      result.status = "error";
      result.message = "unknown error";
      console.log(JSON.stringify(data));
      break;
    }
  }
  return result;
}

function findGameByPlayer(userId) {
  for (const [gameId, game] of games) {
    if (game.X === userId || game.O === userId) {
      return games.get(gameId);
    }
  }
  return null;
}

function makeBotMove(game) {
  let openFields = game.board.map((value, i) => {
    if (value == null) return i;
  });
  openFields = openFields.filter((a) => a !== undefined);
  const newBoard = [...game.board];
  newBoard[openFields[getRandomInt(openFields.length - 1)]] = "O";

  const newGame = { ...game, board: newBoard, next: "X" };
  games.set(game.gameId, newGame);
  return newGame;
}

function getRandomInt(max) {
  return Math.floor(Math.random() * (max + 1));
}
