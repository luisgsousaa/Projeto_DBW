// game.js

// este ficheiro usa funcoes dos partials de game.ejs
// ou seja, vai ir buscar funcoes a por exemplo, waiting-room.js, brainstorming.js, voting.js, results.js para organizar melhor o codigo

const socket = io({ reconnection: true });

const eventBuffer = []; // buffer para guarda eventos para serem executados mais tarde
let partialLoaded = false; // serve para garantir que o partial é carregado antes de receber os dados para atualizar o mesmo
/**
 * Username do utilizador autenticado
 */
let myUsername = null; // para guardar username do utilizador autenticado e ser acessível às várias funcoes
let userProfilePictures = {}; // "cache" para imagens dos jogadores (pa nao tar sempre a ir buscar as imagens para cada mensagem)
let followingList = []; // lista de jogadores que o jogador esta a seguir


/**
 * Cliente estabelece uma conexão com o WebSocket (socket.io)
 * Obtém o roomID a partir da URL da página
 * Solicita ao servidor o username do utilizador autenticado e guarda em myUsername
 * Emite o evento joinRoom para o servidor, enviando o roomID e o username
 */
socket.on("connect", async() => {
    const roomID = new URLSearchParams(window.location.search).get("roomID"); // obtem roomID a partir da url

    if (roomID) {
        try {
            const username = await fetchUsername();
            myUsername = username; // guarda username do utilizador autenticado
            socket.emit("joinRoom", { // emite evento de entrada na sala, enviando roomID e username do utilizador autenticado para o servidor
                roomID,
                username,
            });
        } catch (err) {
            console.error(err);
            alert("Ocorreu um erro ao tentar aceder à sala. Tente novamente mais tarde.");
            window.location.href = '/pre-game';
        }
    } else {
        alert("Ocorreu um erro ao tentar aceder à sala. Tente novamente mais tarde.");
        window.location.href = '/pre-game';
    }
});

/**
 * Obtém o username do utilizador autenticado a partir do servidor
 * @returns {String|null} Username do utilizador autenticado ou null em caso de erro
 */
async function fetchUsername() {
    try {
        const res = await fetch("/game/getUsername");
        const data = await res.json();
        return data.username;
    } catch (err) {
        console.error(err);
        alert("Ocorreu um erro ao tentar obter o seu username. Tente novamente mais tarde.");
        window.location.href = '/pre-game';
        return null;
    }
}


/**
 * Depois da conexão ao socket na pagina game e emissão do evento "joinRoom" para o back-end, o servidor trata da entrada na base de dados e no socket e emite de volta o evento "roomJoined" para o cliente
 * Obtém o estado atual do jogo (waiting-room, brainstorming, voting ou results) a partir do servidor e manda carregar o partial com esse estado 
 */
socket.on("roomJoined", async(roomID) => {

    //history.pushState({}, "", `/game?roomID=${roomID}`);

    const res = await fetch(`/game/getGameState?roomID=${roomID}`); // vai buscar o estado do jogo para esta sala
    if (!res.ok) {
        const err = await res.text();
        console.error('err');
        alert("Ocorreu um erro ao tentar obter o estado do jogo.");
    }
    const data = await res.json();
    const gameState = data.state;
    await loadPartial(gameState); // carrega o partial do estado do jogo
    partialLoaded = true; // indicador se o partial ja foi completamente carregado (linha anterior)

    // geral
    initializeGrabbingScroll(); // inicializa a função para que o scroll funcione

    // se o estado do jogo for waiting-room
    if (gameState === "waiting-room"){ 
        await fetchFollowingList(); // obtem lista de jogadores a seguir - serve para saber que usernames devo colocar imagem de adicionar seguidor 
        resetAssignedColors(); // para ficar novas cores nos usernames do chat quando se recarrega a pagina
        initializeChat(roomID); // inicializa o chat (listeners)
        await loadOldMessages(roomID); // carrega mensagens antigas do chat
    }
    
    // vai chamar eventos que ainda estejam para serem carregados (usado para ir buscar updateWaitingRoomData caso a pagina ainda nao tenha sido carregada)
    while (eventBuffer.length > 0) {
        const event = eventBuffer.shift(); // primeiro elemento do array
        event(); // executa-o
    }
});


/**
 * Carrega dinamicamente um partial correspondente ao estado atual do jogo e insere o seu conteúdo dentro do elemento com id="game-container" na página game.ejs
 * Funcao utilizada para atualizar a interface do jogo conforme o estado do jogo sem recarregar a página e manter conexão ao socket
 * @param {String} partial Nome do partial a carregar (ex: "waiting-room", "voting", etc.).
 */
async function loadPartial(partial) {
    try {
        const res = await fetch(`/partials/game/${partial}`);
        const html = await res.text();
        document.getElementById("game-container").innerHTML = html;
    } catch (err) {
        console.error(err);
        alert("Ocorreu um erro ao tentar carregar a página do jogo. Tente novamente mais tarde.");
        window.location.href = '/pre-game';
    }
}


/**
 * Evento recebido do servidor com os dados da sala emitido para todos os clientes que estejam dentro da sala
 * Chama funcao que atualiza os dados displayed na sala (importante para alterar nr de jogadores na sala, lista de jogares na sala, etc)
 * Este evento é emitido sempre que um jogador entra na sala (emitido a partir de joinRoom)
 * @param {Object} room Objeto com os dados da sala
 */
socket.on("roomData", (room) => {
    if (partialLoaded) { // se o partial ja tiver sido completamente carregado
        updateWaitingRoomData(room);
    } else {
        eventBuffer.push(() => updateWaitingRoomData(room)); // Se o partial ainda não foi carregada, armazena a ação em um buffer para executá-la depois que o partial for inserido no DOM
    }
});


/**
 * Obtém a imagem de perfil de um utilizador 
 * @param {String} username Nome de utilizador
 * @returns {String} Imagem de perfil (do utilizador ou padrão em caso de erro)
 */
async function getUserProfilePicture(username) {
    if (userProfilePictures[username]) {
        return userProfilePictures[username];
    }

    try {
        const response = await fetch(`/game/getUserImage?username=${encodeURIComponent(username)}`);
        if (!response.ok) {
            console.error("Erro ao obter a imagem de perfil:", response.status);
            return "/images/default_user_pic.jpg";
        }
        const data = await response.json();
        const profilePicture = data.profile_picture || "/images/default_user_pic.jpg";
        userProfilePictures[username] = profilePicture;
        return profilePicture;
    } catch (error) {
        console.error(err);
        return "/images/default_user_pic.jpg";
    }
}


let roomTheme;
// === PARA CARREGAR PARTIALS  ===

socket.on('loadBrainstormingPartial', async({ theme, timeLeft }) => {
    await loadPartial('brainstorming');
    roomTheme = theme;
    document.querySelector('.page-title').textContent = `Tema: ${theme}`;
    document.getElementById('countdown').textContent = `${timeLeft}s`;
    socket.emit('startBrainstormingCountdown');
});

socket.on('loadLoadingPartial', async() => {
  await loadPartial('loading');
  loadBounce();
  await processWords(); // upload de palavras e criar texto


    socket.emit('startloadingCountdown');
});

socket.on('loadVotingPartial', async() => {
    await loadPartial('voting');    
    
    document.getElementById('countdown').textContent = `60s`;
    socket.emit('startVotingCountdown');
    await renderTexts();
});

socket.on('loadResultsPartial', async() => {
    await submitVotes();
    await startCalculateStats();
    await loadPartial('results');
    renderResults();
    setTimeout(() => {
  socket.emit('canDeleteRoom');
}, 3000);
});






// === AVISOS AO CLIENTE ===

// evento para quando há erros provinientes do servidor
socket.on('error', (message) => {
    alert(message);
    window.location.href = '/pre-game';
});


// evento para quando o jogador é expulso
socket.on('kickedbyCreator', () => {
    alert('Foste expulso da sala pelo administrador.');
    window.location.href = '/pre-game';
});

// evento para quando o jogador é expulso para o lugar do criador
socket.on('kickedForCreatorJoin', () => {
    alert('Foste expulso da sala para dar lugar ao criador.'); // o criador pode entrar sempre, independemente da sala estar cheia, e nesse caso expulso automaticamente o ultimo a entrar (o criador tem outro privilegio, como ser sempre admin quando tiver dentro da sala, quando sair é o primeiro a entrar que fica)
    window.location.href = '/pre-game';
});



// === DISPLAYED COUNTDOWN NA WAITING ROOM E GENÉRICO ===

// se um jogador sair a meio da contagem chama a funcao a funcao para limpar esse countdown 
socket.on('clearRoomCountdown', () => {
    isCountdownRunning = false;
    clearCountdownElement();
});

/**
 * Limpa o conteúdo do elemento de contagem decrescente, caso exista
 * Usado, por exemplo, quando um jogador sai a meio do processo de contagem
 */
function clearCountdownElement() {
    const countdownDisplay = document.getElementById('countdown');
    if (countdownDisplay) {
        countdownDisplay.textContent = '';
    }
}

let isCountdownRunning = false; // para melhorar fluidez no caso de motivar atualizacao dos dados da sala e nao desaparecer por instantes a contagem

// atualiza o ecrã no partial waiting room com o countdown update enviado pelo servidor
socket.on('countdownUpdate', (secondsLeft) => {
    const countdownDisplay = document.getElementById('countdown');
    const startGameCountdownElement = document.getElementById("start-game-countdown");
    const startGameButtonElement = document.getElementById("start-game-button");

    isCountdownRunning = true;

    startGameCountdownElement.style.display = 'flex';
    startGameButtonElement.style.display = 'none';
    countdownDisplay.textContent = secondsLeft + 's';
});

// atualiza um countdown generico do jogo com o countdown update enviado pelo servidor
socket.on('genericCountdownUpdate', (secondsLeft) => {
    const countdownDisplay = document.getElementById('countdown');
    const genericCountdownElement = document.getElementById("generic-countdown");
    
    isCountdownRunning = true;

    genericCountdownElement.style.display = 'flex';
    countdownDisplay.textContent = secondsLeft + 's';
});






//chama as duas funções de uma vez para processar as palavras do jogador
async function processWords() {
    await sendWords();
    await createText();
  }



async function sendWords() { //envia as palavas que o jogador escreveu para a bd
    try {
        const gameID = new URLSearchParams(window.location.search).get("roomID");
      const response = await fetch('/game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({username:myUsername, palavras: storedWords, gameID: gameID, roomTheme: roomTheme})
      });

      if (!response.ok) {
        throw new Error(response.status);
      }

      const data = await response.json();
    } catch (erro) {
      console.error('Erro ao enviar palavras:', erro);
    }
  }




  async function createText(retryCount = 0) { 
    try {
        const maxRetries = 6;
        const retryDelay = 2000;

        const gameID = new URLSearchParams(window.location.search).get("roomID");
        const answer = await fetch('/game/create-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({gameID: gameID})
      });
        console.log(answer);

      if (!answer.ok) {
        console.warn(`Falha na criação do texto. Tentando novamente`);
    
        if (retryCount < maxRetries) { //caso dê erro vai voltar a tentar esperando 2 segundos e até 6 vezes
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return createText(retryCount + 1);
        } else {
          console.error('Número máximo de tentativas atingido.');
          return;
        }
      }
      
      const data = await answer.json();
    } catch (erro) {
      console.error('Erro ao criar texto:', erro);
    }
  }



  async function startCalculateStats() {
    try {
        const roomID = new URLSearchParams(window.location.search).get("roomID");
      const answer = await fetch('/game/calculate-stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({roomID})
      });

      if (!answer.ok) {
        throw new Error(answer.status);
      }

      const data = await answer.json();
    } catch (erro) {
      console.error('Erro ao comunicar com o controller:', erro);
    }
  }