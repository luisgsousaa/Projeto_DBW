// roomManager.js

const { sanitizeInput } = require("../../utils/sanitize.js");
const { startInactivityTimer, clearInactivityTimer } = require("./timersManager.js");

const Room = require("../../models/room.js");
const Played = require("../../models/played.js");

/**
 * Cria uma nova sala na base de dados e faz a validação back-end dos dados
 * 
 * @param {Object} roomData Dados da sala a ser criada
 * @param {String} roomData.tema Tema da sala
 * @param {Number} roomData.tempo Tempo do brainstorming
 * @param {Number} roomData.maxPlayers Número máximo de jogadores
 * @param {String} roomData.creatorUsername Username do criador da sala
 * @param {Object} socket Instância do socket do criador
 * @param {Object} io Instância do servidor Socket.IO
 * @returns {Object|null} Sala criada ou null em caso de erro/validação falhada
 */
async function createRoom({ tema, tempo, maxPlayers, creatorUsername }, socket, io) {
    try {
        tema = sanitizeInput(tema);
        const userCreatedRooms = await Room.find({ creator_username: creatorUsername });
        if (userCreatedRooms.length >= 3) {
            socket.emit("roomCreationError", "Atingiste o limite de salas criadas. Uma sala é apagada por inatividade (0 pessoas) em 3 minutos ou quando o jogo termina.");
            return null;
        }
        const duplicateRoom = await Room.findOne({ tema, tempo, maxPlayers });
        if (duplicateRoom) {
            socket.emit("roomCreationError", "Já existe uma sala criada com esses dados.");
            return null;
        }
        if (isNaN(tempo) || tempo < 10 || tempo > 120) {
            socket.emit("roomCreationError", "Por favor, insira um tempo válido entre 10 e 120 segundos.");
            return null;
        }
        if (tema.length > 20) {
            socket.emit("roomCreationError", "O nome da sala não pode ter mais de 20 caracteres.");
            return null;
        }

        const newRoom = new Room({
            tema,
            tempo,
            maxPlayers,
            players: [],
            creator_username: creatorUsername,
            admin_username: "",
            game_started: false,
            allowed_reentries: [],
            game_state: "waiting-room",

        });
        const savedRoom = await newRoom.save();

        gameID = savedRoom._id.toString();

        
        const played = new Played({
            theme: tema,
            gameID: gameID
        });
        await played.save();

        
        startInactivityTimer(savedRoom._id.toString(), io, deleteRoom, getRooms); // inicia o timer de inatividade para a sala
        return savedRoom;
    } catch (err) {
        console.error("Erro ao tentar criar a sala na base de dados: ", err);
        return null;
    }
}

/**
 * Apaga uma sala da base de dados
 * 
 * @param {String} roomID ID da sala
 * @returns {Boolean} True se a sala foi apagada com sucesso, false caso contrário
 */
async function deleteRoom(roomID) {
    try {
        const room = await Room.findByIdAndDelete(roomID);
        if (room) {
            console.log(`A sala ${roomID} foi removida com sucesso`);
            return true;
        } else {
            console.log(`Erro ao tentar remover a sala ${roomID} da base de dados`);
            return false;
        }
    } catch (error) {
        console.error(error);
        return false;
    }
}

/**
 * Adiciona um jogador a uma sala na base de dados, faz validação back-end, define o admin da sala e apaga o timer de inatividade
 * 
 * @param {Object} socket Instância do socket do jogador
 * @param {String} roomID ID da sala
 * @param {String} username Username do jogador
 * @returns {Boolean} True se o jogador entrou com sucesso, false cc
 */
async function joinRoom(socket, roomID, username) {
    if (!username || username.trim() === '') {
        socket.emit('error', 'O seu username não encontrado. Tente novamente mais tarde.');
        return false;
    }
    try {
        const room = await Room.findById(roomID);

        if (!room) {
            socket.emit('error', 'Esta sala não existe.');
            return false;
        }
        // verifica se o jogo ja começou e se a pessoa pode reentrar na sala
        if (room.game_started && !room.allowed_reentries.includes(username)) {
            socket.emit('error', 'Este jogo já começou e não fazes parte da lista de jogadores que o iniciou.');
            return false;
        }

        // verifica se o jogador já está na sala
        const existingPlayer = room.players.find(player => player.username === username);
        if (existingPlayer) {
            socket.emit('error', 'Já estás nesta sala.');
            return false;
        }

        const isCreator = room.creator_username === username; // boleano para identificar se o jogador é o criador da sala
        // verifica se a sala já está cheia
        if (room.players.length >= room.maxPlayers) {
            // no caso da pessoa que clicou ser o criador da sala, ele expulsa para poder entrar na sala
            if (isCreator) {
                // expulsa o último jogador
                const lastPlayer = room.players[room.players.length - 1];
                const kickedSocketId = lastPlayer.socket_id;

                // Remover o último jogador da lista
                room.players.pop();

                // Atualiza admin se necessário
                if (room.admin_username === lastPlayer.username) {
                    room.admin_username = username;
                }

                // Notifica o jogador expulso
                const kickedSocket = socket.server.sockets.sockets.get(kickedSocketId);
                if (kickedSocket) {
                    kickedSocket.emit('kickedForCreatorJoin');
                }

                console.log(`O jogador ${lastPlayer.username} foi expulso da sala ${roomID} para o criador entrar.`);

            } else {
                socket.emit('error', 'Esta sala já está cheia.');
                return false;
            }
        }

        let newAdmin = room.admin_username; // guarda o admin atual

        if (!isCreator && !room.players.length) {
            newAdmin = username; // se o jogador nao for o admin e a sala tiver vazia passa a ser o novo admin (primeiro a entrar)
        } else if (isCreator) {
            newAdmin = username; // se o criador entrar na sala, torna-se admin
        }

        // adiciona o jogador à sala na bd
        room.players.push({
            username: username,
            socket_id: socket.id,
        });
        room.admin_username = newAdmin; // recarrega o admin na bd (seja o atual ou o novo)

        await room.save();
        console.log(`O jogador ${socket.id} com o username ${username} entrou na sala ${roomID}.`);
        clearInactivityTimer(roomID); // limpa o timer de inatividade da sala
        return true;
    } catch (err) {
        console.error(`Tentativa falhada de adicionar o jogador ${socket.id} com o username ${username} à sala ${roomID}.`, err);
        socket.emit('error', 'Ocorreu um erro ao tentar entrar na sala. Tente novamente.');
        return false;
    }
}

/**
 * Remove um jogador da sala na base de dados
 * Atualiza o admin da sala se necessário
 * Se a sala ficar vazia, inicia o temporizador de inatividade
 * 
 * @param {Object} socket Instância do socket do jogador
 * @param {String} roomID ID da sala
 * @param {String} username Username do jogador
 * @param {Object} io Instância do servidor Socket.IO
 * @returns {Boolean} True se o jogador foi removido com sucesso, false caso contrário
 */
async function leaveRoom(socket, roomID, username, io) {
    try {
        const room = await Room.findById(roomID);

        if (room) {
            // procura o indice do jogador na sala
            const playerIndex = room.players.findIndex(
                (player) => player.socket_id === socket.id
            );

            // se for diferente de -1, o jogador ta na sala (o javascript mete -1 se não encontrar o elemento)
            if (playerIndex !== -1) {
                room.players.splice(playerIndex, 1); // remove o jogador (remove 1 elemento a partir do index do jogador)

                // se alguem sair e for o admin e ainda ficar gente dentro
                if (room.admin_username === username && room.players.length > 0) {
                    room.admin_username = room.players[0].username; // o novo admin será o primeiro jogador que entrou
                }
                // se ficar nao ficar ninguem na sala, o admin fica a vazio
                else if (room.players.length === 0) {
                    startInactivityTimer(room._id.toString(), io, deleteRoom, getRooms); // inicia timer de inatividade quando a sala fica vazia
                    room.admin_username = "";
                }

                await room.save();
                console.log(`O jogador ${socket.id} com o username ${username} saiu da sala ${roomID}.`);
                return true;
            }
        }
        return false;
    } catch (err) {
        console.error(`Tentativa falhada de remover o jogador ${socket.id} com o username ${username} da sala ${roomID}.`, err);
    }
}

/**
 * Recupera todas as salas da base de dados com as informações necessárias para utilizar no pre-game
 * 
 * @returns {Array} Lista de objetos com o id, tema, tempo, maxPlayers, playersCount, creatorUsername de cada sala
 */
async function getRooms() {
    const rooms = await Room.find();
    return rooms.map((room) => ({
        id: room._id.toString(),
        tema: room.tema,
        tempo: room.tempo,
        maxPlayers: room.maxPlayers,
        playersCount: room.players.length,
        creatorUsername: room.creator_username,
    }));
}

/**
 * Recupera os dados de uma sala específica da base de dados com as informações necessárias para utilizar no game
 * 
 * @param {String} roomID ID da sala
 * @returns {Object} Objeto com o id, tema, tempo, maxPlayers, playersCount, creatorUsername, adminUsername e players da sala
 */
async function getRoomById(roomID) {
    const room = await Room.findById(roomID);
    return {
        id: room._id.toString(),  
        tema: room.tema,
        tempo: room.tempo,
        maxPlayers: room.maxPlayers,
        playersCount: room.players.length,
        creatorUsername: room.creator_username,
        allowed_reentries: room.allowed_reentries || [],
        adminUsername: room.admin_username,
        players: room.players.map(player => ({ username: player.username, socket_id: player.socket_id })),
    };
}

async function checkTextCompletion(roomID) {
    const played = await Played.findOne({ gameID: roomID });
    

    return played.players.every(player => typeof player.text === 'string' && player.text.trim().length > 0);
    

}




module.exports = {
    createRoom,
    joinRoom,
    leaveRoom,
    deleteRoom,
    getRooms,
    getRoomById,
    checkTextCompletion
};































// const ROOM_INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutos limite inatividade sala
// const roomTimers = {}; // timers de cada sala

/*
// serve para atualizar o estado do jogo e depois permitir reentradas a partir do menu das salas (dos jogadores que ja tinham iniciado a partida) para o estado certo do jogo
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
        console.error(`Erro ao atualizar o estado do jogo da sala ${roomID} na base de dados:`, err);
        return false;
    }
}*/
/*
// para sanitizar inputs e evitar ataques XSS
function sanitizeInput(input) {
    return input.replace(/[<>/&'"]/g, '');
}
*/

/*
// inicia o timer de inatividade
function startInactivityTimer(roomID, io) {
    if (roomTimers[roomID]) {
        clearTimeout(roomTimers[roomID]); // para nao haver problemas por causa de timers anteriores 
    }

    // manda apagar a sala se chegar ao fim do timer
    roomTimers[roomID] = setTimeout(async() => {
        const room = await Room.findById(roomID);
        if (room && room.players.length === 0) {
            await deleteRoom(roomID);
            io.emit("updateRooms", await getRooms());
        }
        delete roomTimers[roomID]; // Remove o timer do objeto
    }, ROOM_INACTIVITY_TIMEOUT);
}*/

/*
// limpa timer de inatividade
function clearInactivityTimer(roomID) {
    if (roomTimers[roomID]) {
        clearTimeout(roomTimers[roomID]);
        delete roomTimers[roomID];
    }
}*/













/*
// obtem todas as mensagens na bd de uma sala com base no roomID
async function getRoomMessages(roomID) {
    const room = await Room.findById(roomID);
    if (room && room.messages) {
        return room.messages;
    }
    return [];
}*/


/*
// adiciona uma mensagem a uma sala na bd
async function addMessageToRoom(roomID, messageData) {
    //messageData = sanitizeInput(messageData.username, messageData.message, messageData.timestamp);
    try {
        const room = await Room.findById(roomID);
        if (room) {
            room.messages.push(messageData);
            await room.save();
            return true;
        }
        return false;
    } catch (err) {
        console.error(`Erro ao adicionar mensagem à sala ${roomID}.`, err);
        return false;
    }
}*/


/*
// define que jogo ja comecou e nesse momento guarda jogadores que iniciaram a partida para depois so eles poderem entrar
async function markGameStartedAndAllowedPlayers(roomID) {
    try {
        const room = await Room.findById(roomID);
        if (room) {
            room.allowed_reentries = room.players.map(p => p.username); // guarda os usernames permitidos para depois reentrar mais tarde se cairem
            room.game_started = true; // define que o jogo comecou
            await room.save(); // guarda na bd
            return true;
        }
        return false;
    } catch (err) {
        console.error(`Erro ao definir estado de início de jogo ou guardar jogadores permitidos na sala ${roomID}.`, err);
        return false;
    }
}*/


/*
module.exports = {
    createRoom,
    joinRoom,
    leaveRoom,
    getRooms,
    getRoomById,
    addMessageToRoom,
    getRoomMessages,
    markGameStartedAndAllowedPlayers,
    setRoomGameState,
};*/