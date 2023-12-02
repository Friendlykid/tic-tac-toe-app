import * as PropTypes from "prop-types";
import {useState} from "react";

export function Intro({socket,userId }){
    const [showInput, setShowInput] = useState(false);
    const [gameCode, setGameCode] = useState('');
    function handleNewGame(){
        socket.send(JSON.stringify({action:'newGame', userId:userId}));
    }
    function handleJoinGame(){
        socket.send(JSON.stringify({action:'joinToGame', userId:userId, gameId:gameCode}))
    }
    function handleBotGame(){
        socket.send(JSON.stringify({action:'newBotGame', userId:userId}))
    }

    return (
        <>
            <div className="intro">
                <button className="intro-button" onClick={handleNewGame}>Start New Game</button>
                <button className="intro-button" onClick={() => {
                    setShowInput(true);
                }}>Join Existing Game</button>
                <button className="intro-button" onClick={handleBotGame}>Play against computer</button>
            </div>
            {showInput &&
                <>
                    <label>Game code:</label>
                    <form onSubmit={handleJoinGame}>
                        <input onChange={(e) => setGameCode(e.target.value)}/>
                    </form>
                </>
            }
        </>

    );
}

Intro.propTypes = {
    socket: PropTypes.object,
    userId: PropTypes.string,
};