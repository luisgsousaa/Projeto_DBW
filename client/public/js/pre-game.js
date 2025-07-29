// pre-game.js

// altera texto das classes para permitir seleção do nr de jogadores (1-4)
function selectPlayers(element) {
    // remove a classe "selected" de todos os elementos com a classe "player-option"
    document
        .querySelectorAll(".player-option")
        .forEach((el) => el.classList.remove("selected"));
    // adiciona a classe "selected" apenas ao elemento clicado
    element.classList.add("selected");
}


// ----------- SOCKET --------------
const socket = io({ reconnection: true });

let creatorUsername = ""; // variavel global para guardar o username do criador da sala e poder usar mais abaixo

fetch('/pre-game/getUsername') // pede ao servidor o username do utilizador autenticado
    .then(response => {
        if (!response.ok) {
            throw new Error(`${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        creatorUsername = data.username;
    })
    .catch(err => {
        console.error(err);
        alert("Ocorreu um erro ao tentar obter o seu username. Tente novamente.");
    });


// fica a ouvir o evento "updateRooms" e em caso positivo chama a função que atualiza a lista das salas disponíveis exibidas ao cliente
// rooms é um array com todas as informações das salas (id, tema, tempo, maxPlayers e playersCount)
socket.on("updateRooms", (rooms) => {
    updateRoomList(rooms);
    initializeGrabbingScroll();
});

// warning de limite de salas criada ou salas duplicadas
socket.on("roomCreationError", (message) => {
    alert(message);
});

function updateRoomList(rooms) {
    const roomsList = document.querySelector(".rooms-scroll");
    roomsList.innerHTML = "";

    rooms.sort((a, b) => b.playersCount - a.playersCount); // ordena as salas por número de jogadores

    rooms.forEach((room) => {
        const roomElement = document.createElement("li");

        roomElement.classList.add(
            "row",
            "white-box",
            "align-items-center",
            "justify-content-center",
            "text-center",
            "mb-3"
        );

        roomElement.innerHTML = `
        <div class="col-4">
          <h5 class="mb-0 text-overflow">${room.tema}</h5>
        </div>
        <div class="col-4">
          <h5 class="mb-0">${room.tempo}s</h5>
        </div>
        <div class="col-4">
          <h5 class="mb-0">${room.playersCount}/${room.maxPlayers}</h5>
        </div>
      `;
        // se a sala estiver cheia não deixa clicar e mostra cursor bloqueado
        if (room.playersCount >= room.maxPlayers && room.creatorUsername != creatorUsername) { // creatorUsername pedi ao servidor para ir buscar a base de dados mais abaixo
            roomElement.style.cursor = "not-allowed";
        }

        // se a sala não estiver cheia mostra o cursor com pointer
        // adiciona o evento de clique que redireciona para essa sala de jogo
        else {
            roomElement.style.cursor = "pointer";
            roomElement.title = "Clique para entrar na sala";
            roomElement.onclick = async function() {
                window.location.href = `/game?roomID=${room.id}`;
            };
        }

        roomsList.appendChild(roomElement);
    });
}

// guarda as definicoes da sala que o utilizador escolheu no pregame.ejs e emite o evento "createRoom" com esses dados 
function createRoom() {
    // .value - para obter o valor de um input
    // .textContent - para obter o texto exibido num elemento

    const tema = document.querySelector(
        "input[placeholder='Escreva o tema da sessão de Brainstorming']"
    ).value;
    const tempo = document.querySelector(
        "input[placeholder='Escreva o tempo em segundos']"
    ).value;
    const maxPlayers = parseInt(
        document.querySelector(".player-option.selected").textContent
    );

    // validao do lado do cliente 
    if (tema.length > 20) {
       alert("O nome da sala não pode ter mais de 20 caracteres.");
      return;
   }
    if (isNaN(tempo) || tempo < 10 || tempo > 120) {
        alert("Por favor, insira um tempo válido entre 10 e 120 segundos.");
        return;
    }

    socket.emit("createRoom", { tema, tempo, maxPlayers, creatorUsername });
}