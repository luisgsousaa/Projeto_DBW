// chatManager.js

const Room = require("../../models/room");

/**
 * Adiciona uma nova mensagem a uma sala específica na base de dados
 * @param {String} roomID ID da sala onde a mensagem será adicionada
 * @param {Object} messageData Dados da mensagem a ser adicionada
 * @returns {Boolean} True se a mensagem foi adicionada com sucesso, false caso contrário
 */
async function addMessageToRoom(roomID, messageData) {
    try {
        const room = await Room.findById(roomID);
        if (room) {
            room.messages.push(messageData);
            await room.save();
            return true;
        }
        return false;
    } catch (err) {
        console.error(`Erro ao adicionar mensagem à sala ${roomID} na base de dados`, err);
        return false;
    }
}

/**
 * Recupera todas as mensagens de uma sala específica
 * @param {String} roomID ID da sala
 * @returns {Array} Array com todas as mensagens da sala ou um array vazio se a sala não for encontrada ou não houver mensagens na mesma
 */
async function getRoomMessages(roomID) {
    const room = await Room.findById(roomID);
    if (room && room.messages) {
        return room.messages;
    }
    return [];
}

module.exports = { addMessageToRoom, getRoomMessages };