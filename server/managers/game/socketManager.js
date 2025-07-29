// socketManager.js

const { addMessageToRoom, getRoomMessages } = require("./chatManager.js");
const { markGameStartedAndAllowedPlayers, setRoomGameState } = require("./gameManager.js");
const {
    createRoom,
    joinRoom,
    leaveRoom,
    getRooms,
    getRoomById,
    checkTextCompletion,
    deleteRoom
} = require("./roomManager.js");

const hasCountdownStartedMap = {}; // array que armazena booleanos para cada sala, indicado se neste momento tem um countdown em execucao
const activeCountdowns = {}; // array que armazena o countdown em si para cada sala

function setupSocket(io) {

    io.on("connection", async(socket) => {
        console.log(`Socket conectado: ${socket.id}`);

        // fica a ouvir o evento "createRoom" que é emitido quando o jogador clica no botão "Criar sala" no pre-game.ejs
        socket.on("createRoom", async(roomData) => {
            if (await createRoom(roomData, socket, io)) { // manda criar a sala na base de dados (todas as funções que lidam com a base de dados estão em roomManager.js)
                io.emit("updateRooms", await getRooms()); // como foi criada uma nova sala, a lista de salas é atualizada para todos os clientes (pre-game.ejs)
            }
        });

        // quando o jogador clica para entrar em alguma sala no pre-game.ejs é redirecionado para a waiting room, que é um dos partials do fluxo de jogo (game.ejs)
        // já na pagina game.ejs, em game.js, é emitido o evento "joinRoom"
        socket.on("joinRoom", async({ roomID, username }) => {
            if (await joinRoom(socket, roomID, username)) { // manda adicionar o jogador na sala da base de dados (todas as funções que lidam com a base de dados estão em roomManager.js)
                socket.roomID = roomID; // guarda o ID da sala no socket
                socket.username = username; // guarda o username do jogador no socket
                socket.join(roomID); // entra no socket
                socket.emit("roomJoined", roomID); // emite o evento para carregar o partial do jogo no game.ejs
                io.to(roomID).emit("roomData", await getRoomById(roomID)); // como alguém entrou na sala, os dados da sala são atualizados para todos os membros da mesma (game.ejs)
                io.emit("updateRooms", await getRooms()); // como alguém entrou numa sala, a lista das salas é atualizada para todos os clientes (pre-game.ejs)
                //const messages = await getRoomMessages(roomID); // recupera as mensagens da sala que estao na base de dados (serve o jogador ver as mensagens que foram enviadas na sala antes de entrar)
                //socket.emit("loadOldMessages", messages); // carrega as mensagens antigas no chat da sala

                // depois de entrar a pessoa, ve se a sala ja ta cheia e nesse caso manda iniciar a contagem decrescente 
                const room = await getRoomById(roomID);
                // se com a entrada, a sala ficou cheia, manda iniciar a contagem decrescente
                // quando tem 1 jogador, onde essa pessoa é unica admin possivel, tem de ser ela a clicar no botao para o jogo arrancar
                // se ja tiver a decorrer um countdown, pedido por um admin, com a sala por preencher, por exemplo 2/3, e o jogador entra, e fica 3/3, nesse caso nao é iniciado countdown
                if (room && room.playersCount === room.maxPlayers && room.maxPlayers !== 1 && !hasCountdownStartedMap[roomID]) {
                    startGameCountdown(roomID);
                }
            }
        });

        socket.on("getOldMessages", async (roomID, callback) => {
            const messages = await getRoomMessages(roomID);
            callback(messages); // devolve as mensagens via callback
        });


        // admin carrega no botao para começar o jogo
        socket.on('forceStartGame', async(roomID) => {
            if (hasCountdownStartedMap[roomID]) return;
            const room = await getRoomById(roomID); // obtém dados da sala da base de dados
            if (!room) return socket.emit('error', 'Ocorreu um erro ao tentar obter os dados da sala na base de dados. Tente novamente mais tarde.');

            if (socket.username !== room.adminUsername) { // verifica se o admin da sala é o mesmo que fez o pedido 
                return socket.emit('error', 'Não tens permissões para começar o jogo.');
            }
            startGameCountdown(roomID, true); // o true indica que o jogo foi forçado a começar (serve para permitir que arranque mesmo sem tar cheia a sala)
        });

        // remover o jogador manualmente (no caso admin expulsar da sala)
        socket.on("kickPlayer", async({ roomID, username }) => { // username do jogador a ser expulso
            const roomData = await getRoomById(roomID); // saca os dados da sala da base de dados
            if (roomData && roomData.adminUsername === socket.username && roomData.adminUsername !== username) { // só passa se o pedido for feito se o admin da sala é o mesmo que faz o pedido atraves do socket e se nao estiver tentar remover-se a si proprio 
                const playerToKick = roomData.players.find(p => p.username === username);
                if (playerToKick) {
                    // nota: io.sockets.socketscontem todos os sockets conectados
                    const socketToKick = io.sockets.sockets.get(playerToKick.socket_id); // vai buscar o socket do jogador a ser expulso (pq vai ser necessario saber qual socket pa desconectar manualmente)
                    if (socketToKick) {
                        socketToKick.leave(roomID); // neste caso como nao saiu do socket automaticamente com a desconexao, é preciso tirar do socket
                        await leaveRoom(socketToKick, roomID, username, io); // tira da bd
                        io.to(roomID).emit("roomData", await getRoomById(roomID)); // como alguém saiu na sala, os dados da sala são atualizados para todos os membros da mesma (importante para atualizar a lista de jogadores exibidos na waiting-room.ejs, que é um partial do game.ejs)
                        io.emit("updateRooms", await getRooms()); // como alguém saiu de uma sala, a lista de salas é atualizada para todos os clientes (lista de salas pre-game.ejs)
                        socketToKick.emit('kickedbyCreator'); // envia para o front end este evento para dar alerta ao jogador expulso e redirect para o pre-game.ejs
                        console.log(`O jogador ${username} foi expulso da sala ${roomID} por ${socket.username}.`);
                    }
                }
            } else if (!roomData) {
                console.log(`A sala ${roomID} não foi encontrada na base de dados ao tentar expulsar o jogador ${username}.`);
                socket.emit('error', 'Ocorreu um erro ao tentar remover um jogador. Tente novamente mais tarde');
            } else if (roomData.adminUsername !== socket.username) {
                console.log(`O jogador ${socket.username} tentou expulsar ${username} da sala ${roomID}, mas não é administrador.`);
                socket.emit('error', 'Não tens permissões para expulsar jogadores.');
            } else if (roomData.adminUsername === username) {
                console.log(`O administrador ${socket.username} tentou expulsar-se da sala ${roomID}.`);
                socket.emit('error', 'Não te podes expulsar a ti próprio.');
            }
        });

        // quando o jogador sair do game.ejs, onde sao carregados os partials do fluxo do jogo, desconecta-se do socket e o evento "disconnect" é emitido automaticamente pelo socket
        socket.on("disconnect", async() => {
            console.log(`Socket desconectado: ${socket.id}`);
            const roomID = socket.roomID; // recupera o ID da sala do socket
            const username = socket.username; // recupera o username do jogador do socket
            if (roomID && await leaveRoom(socket, roomID, username, io)) { // manda remover o jogador da sala da base de dados (todas as funções que lidam com a base de dados estão em roomManager.js)
                io.to(roomID).emit("roomData", await getRoomById(roomID)); // como alguém saiu na sala, os dados da sala são atualizados para todos os membros da mesma (importante para atualizar a lista de jogadores exibidos na waiting-room.ejs, que é um partial do game.ejs)
                io.emit("updateRooms", await getRooms()); // como alguém saiu de uma sala, a lista de salas é atualizada para todos os clientes (lista de salas em pre-game.ejs)
            }
        });

        // quando o jogador envia uma mensagem no chat da sala é emitido o evento "sendMessage"
        socket.on("sendMessage", async({ roomID, message }) => {
            try {
                const newMessage = { username: socket.username, message };
                await addMessageToRoom(roomID, newMessage); // manda guardar a mensagem do chat da sala da base de dados
                // faz broadcast da mensagem para todos os membros da sala
                io.to(roomID).emit("newMessage", {
                    username: newMessage.username,
                    message: newMessage.message,
                    timestamp: new Date().toISOString(),
                });

            } catch (err) {
                console.err(`Erro ao tentar enviar a mensagem ${message} do jogador ${username} na sala ${roomID}:`, err);
                // o jogador que queria enviar uma mensagem que deu erro por algum motivo emite uma mensagem de erro para a sala a dizer que a msg que tentou enviar nao deu (isto é fixe pq depois da para detetar nas testagens com outra pessoa a distancia)
                io.to(roomID).emit("newMessage", {
                    username: socket.username,
                    message: "*Ocorreu um erro ao enviar esta mensagem.*",
                    timestamp: new Date().toISOString(),
                });
            }
        });

        
        /**
         * Inicia o countdown de 10 segundos para o início do jogo na waiting room
         * Este countdown pode ser iniciado automaticamente quando a sala atinge o número máximo de jogadores ou manualmente pelo admin
         * - A cada segundo, verifica se a sala ainda existe e se continua cheia e emite evento com o valor atual dos segundos para os jogadores da sala
         * - Se o countdown foi iniciado automaticamente (force = false) e alguém sai da sala antes de terminar, o countdown é interrompido para todos.
         * - Se o countdown foi iniciado por um admin (force = true), ele continua mesmo que alguém saia.
         * - Quando o countdown chega a 0:
         *   - Define a sala como tendo o jogo iniciado
         *   - Define o estado da sala como "brainstorming".
         *   - Envia o evento `loadBrainstormingPartial` para todos os jogadores da sala para carregar esse partial
         * 
         * @param {String} roomID ID da sala
         * @param {Boolean} [force=false] True força o countdown mesmo que a sala deixe de estar cheia (usado por admin)
         */
        function startGameCountdown(roomID, force = false) { // false em default, serve para interromper o countdown caso alguem saia a sala, pq se for um admin, ou seja, com true, o countdown não é interrompido
            hasCountdownStartedMap[roomID] = true;
            let countdown = 10; // countdown de 10s se a sala tiver cheia ou o admin arrancar com partida
            activeCountdowns[roomID] = setInterval(async() => {
                const room = await getRoomById(roomID);
        
                // caso a saia alguem da sala no meio do contedown, interrompe o countdown para todos na sala (excecao se for iniciada por um admin)
                if (!room || !force && room.players.length < room.maxPlayers) {
                    clearInterval(activeCountdowns[roomID]);
                    delete activeCountdowns[roomID];
                    hasCountdownStartedMap[roomID] = false;
                    io.to(roomID).emit('clearRoomCountdown');
                    io.to(roomID).emit("roomData", await getRoomById(roomID));
                    return;
                }
        
                // quando chega a 0, manda todos os sockets carregar o partial jogo.ejs
                if (countdown <= 0) {
                    await markGameStartedAndAllowedPlayers(roomID); // marca a sala como iniciada e guarda os jogadores que estao na sala para depois so esses poderem reconectar
                    await setRoomGameState(roomID, "brainstorming"); // muda o estado do jogo na base de dados para brainstorming - assim se o jogador que saiu voltar, vai poder vir para o sitio certo do jogo por causa disto
                    clearInterval(activeCountdowns[roomID]);
                    delete activeCountdowns[roomID];
                    hasCountdownStartedMap[roomID] = false;
                    io.to(roomID).emit('loadBrainstormingPartial', {
                        theme: room.tema,
                        timeLeft: room.tempo
                    });
                } else {
                    io.to(roomID).emit('countdownUpdate', countdown);
                    countdown--;
                }
            }, 1000);
        }


        /**
         * Countdown genérico para reutilizar-se no resto do fluxo do jogo
         * @param {String} roomID ID da sala
         * @param {Number} countdown Número que iniciará a contagem decrescente
         * @param {String} loadXPartial Evento emitido para carregar partial (ex. loadVotingPartial)
         * @param {String} futureGameState Nova fase do jogo (ex. voting)
         */
        function genericCountdown(roomID, countdown, loadXPartial, futureGameState){
            if (activeCountdowns[roomID]) return; // só irá aplicar para um dos jogadores e depois arrasta os restantes
            activeCountdowns[roomID] = setInterval(async() => {
                if (countdown <= 0) {
                    clearInterval(activeCountdowns[roomID]);
                    delete activeCountdowns[roomID];
                    await setRoomGameState(roomID, futureGameState); // altera estado do jogo na bd (é o partial que sera carregado)
                    io.to(roomID).emit(loadXPartial);
                } else {
                    io.to(roomID).emit('genericCountdownUpdate', countdown);
                    countdown--;
                }
            }, 1000);
        }

        // fica a ouvir sinal do cliente para começar o countdown do brainstorming
        socket.on('startBrainstormingCountdown', async() => {
            const roomID = socket.roomID;
            const room = await getRoomById(roomID);
            genericCountdown(roomID, room.tempo, "loadLoadingPartial", "loading");
        });

        // 
        socket.on('startloadingCountdown', async() => {
            const roomID = socket.roomID;
            const room = await getRoomById(roomID);

            const maxAttempts = 60; // 60 segundos
            let i = 0;
            while(!await checkTextCompletion(roomID)){ //enquanto não tiverem todos os textos prontos não avança 
                if(i == maxAttempts){ // caso chegue ao máximo para
                    break;
                }

                await new Promise(resolve => setTimeout(resolve, 1000)); //espera um segundo para voltar a tentar
                i++;
            }

            await new Promise(resolve => setTimeout(resolve, 7000)); //timer de 7 segundos porque esta pagina é fixe

            const startedPlayers = room.allowed_reentries.length;

            // se for so um jogador nao ha necessidade de votar e vai diretamente para os resultados
            if (startedPlayers <= 1) {
                await setRoomGameState(roomID, "results");
                io.to(roomID).emit("loadResultsPartial");
            } else {
                await setRoomGameState(roomID, "voting");
                io.to(roomID).emit("loadVotingPartial");
            }
        });

        // fica a ouvir sinal do cliente para começar o countdown da votacao (fixo, 150s)
        socket.on('startVotingCountdown', async() => {
            const roomID = socket.roomID;
            //const room = await getRoomById(roomID);
            genericCountdown(roomID, 60, "loadResultsPartial", "results");
        });

        socket.on('canDeleteRoom', async() => {
            const roomID = socket.roomID;
            try {
                const room = await getRoomById(roomID);

            if (room) {await deleteRoom(roomID);} else {}
            } catch (err) {}
            });

        io.emit("updateRooms", await getRooms());
    });
}

module.exports = setupSocket;