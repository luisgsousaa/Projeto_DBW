
const names = ["Alpha" , "Beta" , "Gama", "Sigma"];
const urlParams = new URLSearchParams(window.location.search);

const roomID = urlParams.get("roomID");
const selectedAnswers = {};

async function fetchTexts() {
    try {

      const res = await fetch(`/game/get-texts/${roomID}`);
      const data = await res.json();
      return data;
    } catch (error) {
      console.error(err);
      return null;
    }
  };
  
function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
}
  
async function renderTexts() {
    const response = await fetchTexts();

    shuffle(response.texts); //baralha os textos para não saber de quem é

    if (!response || !response.texts) {
      console.error("Erro ao buscar textos");
      return;
    }
  
    const container = document.getElementById("text-container");
    container.innerHTML = "";
    
    

    
    
    
    response.texts.forEach((player, index) => { //escreve todos os textos
      const playerHTML = `
      <div class="col-md-12 mb-5">
      <div class="light-blue-box-background">
      <div class="justify-content-between blue-box white-title">
      <div class="pe-5 text-overflow">
      ${names[index]}
      </div>
      <div class="option">
      <select
      class="form-select text-overflow"
      id="select${index}"
      title="Cada opção apenas pode ser aplicada a um texto"
      >
      <option selected value="">Classificação</option>
      <option value="4">4 pontos </option>
      <option value="3">3 pontos </option>
      <option value="2">2 pontos </option>
      <option value="1">1 ponto </option>
      </select>
      </div>
      </div>
      <div class="box-content final-text">
      ${player.text}
      </div>
      </div>
      </div>
      `;
      container.innerHTML += playerHTML;
      
    });
    
    //desativa as opções já escolhidas
    document.querySelectorAll('select').forEach(select => { 
      select.addEventListener('change', function () {
        let selectedValues = Array.from(document.querySelectorAll('select'))
        .map(s => s.value)
        .filter(v => v !== '');
        
        document.querySelectorAll('select option').forEach(option => {
          if (selectedValues.includes(option.value) && option.value !== '') {
            option.disabled = true;
          } else {
            option.disabled = false;
          }
        });
      });
    });
    
    
    //guarda as opções escolhidas
    response.texts.forEach((player, index) => {
      const selectElement = document.getElementById(`select${index}`);
      selectedAnswers[player.username] = 0; //inicializar a 0
      selectElement.addEventListener('change', function () {
        selectedAnswers[player.username] = selectElement.value;
      });
    });
    
    
  }
  
  


  async function submitVotes(){

    try {
      const response = await fetch('/game/submit-votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ selectedAnswers, roomID })
      });
      if (!response.ok) {
        throw new Error();
      }

    } catch (error) {
      console.error(error);
    }

  }

  











  