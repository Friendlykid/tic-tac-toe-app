export function processMessage(data, setUserId, setGame) {
  switch (data.type) {
    case "newGame":
    case "newBotGame": {
      setGame({
        gameId: data.gameId,
        ...data.game,
      });
      break;
    }
    case "joinedGame":
    case "move":
    case "playerJoined":
    case "newGameAgain": {
      setGame(data.game);
      break;
    }
    case "userId": {
      setUserId(data.userId);
      break;
    }
    default: {
      break;
    }
  }
}
