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
    case "joinedGame": {
      setGame(
        data.game
      );
      break;
    }
    case "userId": {
      setUserId(data.userId);
      break;
    }
    case "move": {
      setGame(data.game);
      break;
    }
    case "playerJoined":{
      setGame(data.game);
      break;
    }
    default:{
      break;
    }
  }
}
