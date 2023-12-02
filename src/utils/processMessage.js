export function processMessage(data, setUserId, setGame, game) {
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
      alert(JSON.stringify(data));
      setGame({
        ...game,
      });
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
  }
}
