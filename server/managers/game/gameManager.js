//gameManager.js

const Room = require("../../models/room");

/**
 * Define que o jogo começou (true) e armazena os jogadores que começaram o jogo (só esses poderão reentrar se saírem da sala)
 * @param {String} roomID ID da sala
 * @returns {Boolean} True se a operação foi bem-sucedida, false caso contrário
 */
async function markGameStartedAndAllowedPlayers(roomID) {
    try {
        const room = await Room.findById(roomID);
        if (room) {
            room.allowed_reentries = room.players.map(p => p.username);
            room.game_started = true;
            await room.save();
            return true;
        }
        return false;
    } catch (err) {
        console.error(`Erro ao definir que o jogo começou (true) ou a guardar jogadores permitidos a reentrar na sala ${roomID} na base de dados`, err);
        return false;
    }
}

/**
 * Atualiza o estado atual do jogo de uma sala
 * @param {String} roomID ID da sala
 * @param {String} state Novo estado do jogo (ex: "waiting-room", "brainstorming", "voting", "results")
 * @returns {Boolean} True se a operação foi bem-sucedida, false caso contrário
 */
async function setRoomGameState(roomID, state) {
    try {
        const room = await Room.findById(roomID);
        if (room) {
            room.game_state = state;
            await room.save();
            return true;
        }
        return false;
    } catch (err) {
        console.error(`Erro ao atualizar o estado do jogo da sala ${roomID} na base de dados`, err);
        return false;
    }
}

module.exports = { markGameStartedAndAllowedPlayers, setRoomGameState };
