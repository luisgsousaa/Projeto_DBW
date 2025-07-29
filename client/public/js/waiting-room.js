// waiting-room.js

// waiting room é um partial de game.ejs e vai fornecer funcoes para game.js (podia ter ficado tudo em game.js, mas ficava confuso - assim, tudo o que é relativo a cada partial fica num ficheiro .js com o seu nome e depois o game.js usa)
// por isso será normal existirem variaveis com origem nao evidente, como myUsername, que vem de de game.js, é o username do utilizador autenticado

// ====== CORES USERNAME CHAT ======

/**
 * Lista de cores disponíveis para atribuir ao username dos jogadores no chat
 */
const availableColors = [
    "#0586f0", // azul
    "#FF0000", // vermelho encarnado
    "#008000", // verde escuro
    "#8B4513", // castanho
    "#ca02f7", // rosa
    "#98b505", // lima
    "#6305f0" // roxo
];

/**
 * Objeto que armazena as cores já atribuídas aos jogadores
 */
let assignedColors = {};

/**
 * Atribui uma cor única para cada jogador do chat
 * Se o jogador já tiver uma cor atribuída, retorna essa cor
 * Caso contrário, escolhe uma das cores disponíveis que ainda não foi usada
 *
 * @param {String} username Nome do jogador a quem será atribuída a cor
 * @returns {String} Código da cor atribuída
 */
function assignUniqueColor(username) {
    if (assignedColors[username]) {
        return assignedColors[username];
    }

    const unusedColors = availableColors.filter(color => !Object.values(assignedColors).includes(color)); // filtra cores nao usadas

    if (unusedColors.length > 0) {
        const randomIndex = Math.floor(Math.random() * unusedColors.length);
        const assignedColor = unusedColors[randomIndex];
        assignedColors[username] = assignedColor;
        return assignedColor;
    } else {
        return "#000000"; // cor default
    }
}

/**
 * Dá reset nas cores atribuídas aos usernames no chat. Chamado ao carregar a página
 */
function resetAssignedColors() {
    assignedColors = {};
}




// ====== MENSAGENS CHAT ======

/**
 * Adiciona uma nova mensagem ao chat, formatando-a com base no remetente e no horário
 *
 * @param {String} username Nome do utilizador que enviou a mensagem
 * @param {String} message Conteúdo da mensagem
 * @param {String} timestamp Timestamp da mensagem
 * @param {Boolean} isMe Indica se a mensagem foi enviada pelo próprio utilizador
 */
async function addMessageToChat(username, message, timestamp, isMe) {
    const chatMessagesContainer = document.querySelector('.grabbing-scroll-container');
    const chatMessagesList = document.getElementById('chat-messages');
    if (chatMessagesContainer && chatMessagesList) {
        const newMessage = document.createElement('li');
        newMessage.classList.add('lista-item', 'mb-3', 'd-flex', isMe ? 'justify-content-end' : 'justify-content-start');

        const dateOptions = {
            hour: 'numeric',
            minute: 'numeric'
        };
        const formattedTimestamp = new Date(timestamp).toLocaleTimeString('pt-PT', dateOptions); // formato hora, horario Portugal
        const profilePicture = await getUserProfilePicture(username); // chama a funcao que procura a imagem do jogador

        newMessage.innerHTML = `
          <div class="d-flex ${isMe ? '' : 'align-items-start'}">
              ${isMe ? `
                  <div class="caixa-texto caixa-texto-right">
                      <div class="d-flex align-items-center">
                          <a href="profile/${username}" target="_blank" title="Visitar o perfil de ${username}" class="text-decoration-none"><b style="color: ${assignUniqueColor(username)}">${username}</b></a>
                          <p class="text-secondary ms-2">${formattedTimestamp}</p>
                      </div>
                      <p>${message}</p>
                  </div>
                  <img src="${profilePicture}" class="icone-perfil ms-2 mt-1" />
              ` : `
                  <img src="${profilePicture}" class="icone-perfil me-2 mt-1" />
                  <div class="caixa-texto caixa-texto-left justify-content-center">
                      <div class="d-flex align-items-center">
                          <a href="profile/${username}" target="_blank" title="Visitar o perfil de ${username}" class="text-decoration-none"><b style="color: ${assignUniqueColor(username)}">${username}</b></a>
                          <p class="text-secondary ms-2">${formattedTimestamp}</p>
                      </div>
                      <p>${message}</p>
                  </div>
              `}
          </div>
      `;
      chatMessagesList.appendChild(newMessage);
      chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight; // rola para o fim sempre que uma mensagem for adicionada
}}


/**
 * Inicializa o chat, com event listeners para envio e recepção de mensagens
 * @param {String} roomID ID da sala
 */
function initializeChat(roomID) {
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');

    if (sendButton) {
        sendButton.addEventListener('click', () => { // clicando no botao
            const message = messageInput.value.trim();
            if (message && roomID) {
                socket.emit('sendMessage', { roomID, message }); // emite o evento com os dados da mensagem para o servidor
                messageInput.value = '';
            }
        });
    }

    if (messageInput) {
        messageInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') { // com enter
                if (sendButton) {
                    sendButton.click();
                }
            }
        });
    }

    socket.on('newMessage', ({ username, message, timestamp }) => { // fica a ouvir eventos de novas mensagens do servidor
        const isMe = username === myUsername; // boleano para saber se fui eu que enviei a mensagem para aplicar a devida estetica na funcao addMessageToChat
        addMessageToChat(username, message, timestamp, isMe);
    });
}


/**
 * Pede ao servidor as mensagens antigas da sala e manda adicionar ao chat
 *
 * @param {String} roomID ID da sala
 */
function loadOldMessages(roomID) {
    socket.emit("getOldMessages", roomID, (messages) => {
        const chatMessagesContainer = document.querySelector('.grabbing-scroll-container');
        const chatMessagesList = document.getElementById('chat-messages');
        if (chatMessagesContainer && chatMessagesList) {
            messages.forEach(msg => {
                const isMe = msg.username === myUsername;
                addMessageToChat(msg.username, msg.message, msg.timestamp, isMe);
            });
        }
    });
}




// ====== ATUALIZAR DADOS 'DISPLAYED' NA SALA ======


/**
 * Atualiza os dados exibidos na waiting room com base no estado atual da sala
 * Verifica permissões, exibe os jogadores (com admin no topo), e atualiza a UI
 *
 * @param {Object} room Objeto com os dados da sala
 * @param {String} room.tema Tema da sala
 * @param {Number} room.playersCount Número atual de jogadores
 * @param {Number} room.maxPlayers Número máximo de jogadores permitidos
 * @param {Array} room.players Lista de jogadores na sala
 * @param {String} room.adminUsername Nome do administrador da sala
 * @param {String} room.id ID da sala
 */
function updateWaitingRoomData(room) {

    if (!room || !room.tema || typeof room.playersCount !== 'number' || typeof room.maxPlayers !== 'number' || !Array.isArray(room.players)) {
        alert("Ocorreu um erro ao tentar obter os dados da sala. Tente novamente mais tarde.");
        window.location.href = '/pre-game';
        return;
    }

    const themeElement = document.querySelector(".theme");
    const startGameButtonElement = document.getElementById("start-game-button");
    const startGameCountdownElement = document.getElementById("start-game-countdown");
    const playersElement = document.querySelector(".players-in-max");
    const playersList = document.getElementById("players-list");

    if (!playersList) { return;}
    if (themeElement) themeElement.textContent = `Tema: ${room.tema}`; // display tema da sala
    if (playersElement) playersElement.textContent = `Jogadores ${room.playersCount}/${room.maxPlayers}`; // display jogadores na sala e o maximo que pode entrar

    // mostra botão de iniciar jogo apenas para o admin, que é o unico que pode começar o jogo antecipadamente
    if (!isCountdownRunning && startGameButtonElement) {
        if (room.adminUsername === myUsername) { // validacao front-end
            startGameButtonElement.style.display = 'block';
            startGameButtonElement.onclick = () => {
                socket.emit('forceStartGame', room.id);
            };
        // para os normais
        } else {
            startGameButtonElement.style.display = 'none';
            startGameButtonElement.onclick = null;
        }
    }

    // esconde contador de início de jogo se não estiver ativo
    if (!isCountdownRunning && startGameCountdownElement) startGameCountdownElement.style.display = 'none';

    // verifica o jogador que está a admin
    const playersWithAdminFixed = room.players.map(player => ({
        username: player.username,
        isAdmin: room.adminUsername === player.username
    }));

    // coloca esse admin no topo da lista
    // o sort percorre array e vai comparando de 2 em 2 e vai puxando o admin para cima
    playersWithAdminFixed.sort((a, b) => {
        if (a.isAdmin && !b.isAdmin) { // a é admin e b nao é admin, puxa a para cima
            return -1;
        }
        if (!a.isAdmin && b.isAdmin) { // a nao é admin e b é admin, puxa b para cima
            return 1; 
        }
        return 0; // ambos n sao admins, mantem ordem
    });

    // atualiza a lista de usernames dos jogadores
    playersList.innerHTML = playersWithAdminFixed.map(player => `<li class="gray-box justify-content-between align-items-center">
                                                              <span class="text-overflow me-4">
                                                                <a href="profile/${player.username}" target="_blank" title="Visitar o perfil de ${player.username}" class="text-decoration-none text-dark">
                                                                    <h5 class="fw-semibold text-overflow">${player.username}</h5>
                                                                </a>
                                                              </span>
                                                              <div class="gap-2 d-flex align-items-center">
                                                                  ${room.adminUsername === player.username ? '<img src="/images/admin.png" class="small-icon-30" />' : ''}
                                                                  ${player.username !== myUsername && !followingList.includes(player.username) ? `<img src="/images/adicionar.png" class="small-icon-30 follow-button" data-username="${player.username}" title="Seguir jogador" style="cursor: pointer;" />` : ''}
                                                                  ${room.adminUsername === myUsername && room.adminUsername !== player.username ? `<img src="/images/kick.png" class="small-icon-30 kick-button" data-username="${player.username}" title="Expulsar jogador da sala" style="cursor: pointer;" />` : ''}
                                                              </div>
                                                            </li>`).join("");
    
    // listeners para os botoes de seguir
    const followButtons = document.querySelectorAll('.follow-button');
         followButtons.forEach(button => {
            button.addEventListener('click', handleFollowButtonClick);
         });                                                        
    
    // se o utilizador for admin, adiciona o listener ao botao kick 
    if (room.adminUsername === myUsername) {
        const kickButtons = document.querySelectorAll('.kick-button');
        kickButtons.forEach(button => {
            button.addEventListener('click', function() {
                const usernameToKick = this.dataset.username;
                if (usernameToKick) {
                    kickPlayer(room.id, usernameToKick);
                }
            });
        });
    }

     /**
     * Emite um evento para expulsar um jogador da sala
     *
     * @param {String} roomID ID da sala
     * @param {String} usernameToKick Nome do jogador a expulsar
     */
    function kickPlayer(roomID, usernameToKick) {
        socket.emit('kickPlayer', { roomID: roomID, username: usernameToKick });
    }
}


/**
 * Função chamada quando o botão "seguir" é clicado
 * Envia uma requisição ao servidor para seguir o jogador
 */
async function handleFollowButtonClick() {
    const usernameToFollow = this.dataset.username; // nome da pessoa que se quer seguir
    const followButtonElement = this; // guarda o elemento que foi clicado

    try {
        const res = await fetch('/game/follow', {
            method: 'POST',
            headers: {'Content-Type': 'application/json',}, // define conteudo do tipo json
            body: JSON.stringify({ usernameToFollow: usernameToFollow }) // converte para json
        });

        if (res.ok) {
            followingList.push(usernameToFollow); // em caso de sucesso do backend, adiciona o nome ao array de jogadores seguidos do front end (quando pagina foi carregada ja foi sacado os nomes que seguia para saber a quem meter o botao de seguir)
            followButtonElement.remove(); // remove o elemento que tinha sido clicado 
        } 
    } catch (err) {
        console.error(err);
        alert("Ocorreu um erro ao tentar seguir esse jogador.");
    }
}


/**
 * Vai buscar ao servidor a lista de jogadores que o utilizador está a seguir
 */
async function fetchFollowingList() {
    try {
        const res = await fetch('/game/getFollowing');
        if (!res.ok) {
            followingList = [];
            return;
        }
        const data = await res.json();
        followingList = data.following;
    } catch (err) {
        console.error("Erro ao obter a lista de jogadores a seguir.", err);
        followingList = [];
    }
}


