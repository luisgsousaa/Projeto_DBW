// /timersManager.js

const Room = require("../../models/room.js");

const roomTimers = {}; // armazena temporizadores ativos de cada sala
const ROOM_INACTIVITY_TIMEOUT = 3 * 60 * 1000; // maximo de 5 minutos de inatividade da sala antes de apagar a sala

/**
 * Inicia ou reinicia um temporizador de inatividade para uma sala
 * Se a sala ficar sem jogadores durante 5 minutos, será removida da base de dados e todos os clientes vão receber o evento para atualizar a lista de salas disponiveis no pre-game
 * Chamado quando a sala é criada ou quando um jogador sai da sala e ela fica vazia
 * @param {String} roomID ID da sala
 * @param {Server} io Instância do servidor Socket.IO
 * @param {Function} deleteRoom Função que remove a sala da base de dados
 * @param {Function} getRooms Função que retorna a lista atual de salas da base de dados
 */
function startInactivityTimer(roomID, io, deleteRoom, getRooms) {
    if (roomTimers[roomID]) clearTimeout(roomTimers[roomID]); // se já existir um temporizador associado a essa sala, é cancelado

    // cria um novo temporizador
    roomTimers[roomID] = setTimeout(async () => {

        // se o temporizador chegar ao fim, executa este código
        const room = await Room.findById(roomID); // encontra a sala na bd
        if (room) {
            await deleteRoom(roomID); // apaga a sala da base de dados
            io.emit("updateRooms", await getRooms()); // broadcast para atualizar a lista das salas no pre-game
        }
        delete roomTimers[roomID]; // apaga o temporizador

    }, ROOM_INACTIVITY_TIMEOUT);
}

/**
 * Cancela e remove o temporizador de inatividade de uma sala (se existir)
 * Chamado quando um jogador entra na sala
 * @param {String} roomID ID da sala
 */
function clearInactivityTimer(roomID) {
    if (roomTimers[roomID]) {
        clearTimeout(roomTimers[roomID]);
        delete roomTimers[roomID];
    }
}




module.exports = { startInactivityTimer, clearInactivityTimer };