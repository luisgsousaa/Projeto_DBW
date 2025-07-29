







async function fetchResults() {
    try {
      const res = await fetch(`/game/get-results/${roomID}`);
      const data = await res.json();
      return data.game;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  
async function renderResults() {
    const response = await fetchResults();

    if (!response || !response.players || response.players.length === 0) {
    console.error("Erro ao buscar resultados");
    return;
  }
  
    const container = document.getElementById("results-container");
    container.innerHTML = "";
    
    const isSolo = response.allowedReentriesCount <= 1;
    
    response.players
    .sort((a, b) => a.position - b.position)
    .forEach((player, index) => {
      const crown = player.position === 1 ? "&#129351;" :
              player.position === 2 ? "&#129352;" :
              player.position === 3 ? "&#129353;" : 
              "";

      const positionText = isSolo ? `1º ${player.username}` : `${player.position}º ${player.username}`;
      const pointsHTML = isSolo
  ? ""
  : `<span class="text-overflow">${player.points} ${player.points === 1 ? "Ponto" : "Pontos"}</span>`;


      const playerHTML = `
              <div class="col-md-12 mb-5">
                <div class="light-blue-box-background align-items-center hidden" id="box">
                  <div class="blue-box white-title justify-content-between">
                    <a href="/profile/${player.username}" target="_blank" class="text-decoration-none text-white">
                      <div class="text-overflow me-2" title="Visitar o perfil de ${player.username}">
                        ${positionText} ${crown}
                      </div>
                    </a>

                    <span class="d-flex align-items-center">
                      ${pointsHTML}
                      <span class="ms-md-4 ms-3 triangle" onclick="toggleBox(this)"></span>
                    </span>
                  </div>

                  <div class="box-content final-text box-info">
                    ${player.text}
                  </div>
                </div>
              </div>
            `;
    container.innerHTML += playerHTML;
  });
  }
/** 
  function toggleText(element) {
    const box = element.closest(".light-blue-box-background");
    const content = box.querySelector(".box-info");
  
    if (content.style.display === "none" || content.style.display === "") {
      box.classList.remove("hidden");
      content.style.display = "block";
      element.classList.add("open");
      element.classList.remove("closed");
      element.classList.remove("rotated");
    } else {
      box.classList.add("hidden");
      content.style.display = "none";
      element.classList.remove("open");
      element.classList.add("closed");
      element.classList.remove("rotated");
    }
  }*/