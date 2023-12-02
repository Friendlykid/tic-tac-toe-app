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
  ws.isAlive = true;
  ws.on("error", console.error);
  ws.on("pong", heartbeat);

  ws.on("message", function message(data) {
    const res = processData(JSON.parse(data));
    console.log("received: %s", data);
    console.log(
      "sending %s to %s",
      JSON.stringify(res),
      JSON.stringify(JSON.parse(data).userId),
    );
    if (res.type === "move" && res.game.O === "bot"){
      setTimeout(() =>ws.send(JSON.stringify(res)), 1000 );
    }else{
      ws.send(JSON.stringify(res));
    }
    if (data.action === "move" && res.sendTo !== "bot") {
      clients.get(res.sendTo).send(JSON.stringify(res));
    }
    if (data.action === "joinToGame") {
      //send to other player
      clients.get(res.game.X).send(
        JSON.stringify({
          status: "success",
          message: "Player joined",
          type: "playerJoined",
          O: res.game.O,
        }),
      );
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
      if (games.has(data.gameId)) {
        games.set(data.gameId, { ...games.get(data.gameId), O: data.userId });
        result.game = {
          gameId: data.gameId,
          board: games.get(data.gameId),
        };
        result.gameId = data.gameId;
        result.message = "Added to game";
      } else {
        result.status = "error";
        result.message = "Game does not exist.";
      }
      break;
    }
    case "move": {
      result.type = "move";
      const oldGame = games.get(data.gameId);
      games.set(data.gameId, {
        ...oldGame,
        board: data.board,
        next: oldGame.next === "X" ? "O" : "X",
      });
      result.game = games.get(data.gameId);
      result.message = "Player made a move";
      if (games.get(data.gameId).bot) {
        result.sendTo = "bot";
        result.game = {gameId: data.gameId, ...makeBotMove(games.get(data.gameId))};
      } else if (games.get(data.gameId)[data.game?.next]) {
        result.sendTo = games.get(data.gameId)[data.game.next];
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
    default: {
      result.status = "error";
      result.message = "unknown error";
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
  openFields = openFields.filter( a => a !== undefined);
  const newBoard = [...game.board];
  newBoard[openFields[getRandomInt(openFields.length - 1)]] = "O";

  const newGame = { ...game, board: newBoard, next: "X" };
  games.set(game.gameId, newGame);
  return newGame;
}

function getRandomInt(max) {
  return Math.floor(Math.random() * (max + 1));
}
