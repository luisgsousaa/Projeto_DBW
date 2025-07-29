
// gráfico do jogo
async function getGlobalData() {
  try {
    const res = await fetch("/rankings/globalJSON");
    const data = await res.json();
    return data.stats;
  } catch (error) {
    console.error(err);
    alert("Ocorreu um erro ao tentar obter os dados do gráfico. Tente novamente mais tarde.");
    window.location.href = '/rankings';
    return null;
  }
}

async function getPlayerData() {
  try {
    const pathParts = window.location.pathname.split("/");
  
    const playerName = pathParts[2];
  
    const res = await fetch(`/estatisticas/${playerName}/JSON`);
    const data = await res.json();
  
    return data.stats;
  } catch (error) {
    console.error(err);
    alert("Ocorreu um erro ao tentar obter os dados do gráfico. Tente novamente mais tarde.");
    window.location.href = '/rankings';
    return null;
  }
}


document.addEventListener('DOMContentLoaded', async () => {
  let globalData;
  if (window.location.pathname.includes("/rankings")) { // se estiver na pagina dos rankings busca os dados globais do jogo
    globalData = await getGlobalData();
  } else {                                              // caso contrario busca os dados do jogadodr pois está nas estatisticas
    globalData = await getPlayerData();
  }


  const statistics = document.getElementById('statsChart').getContext('2d');
  

  const statsChart = new Chart(statistics, {
    type: 'bar',
    data: {
      labels: Object.keys(globalData),
      datasets: [{
        data: Object.values(globalData),
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(54, 162, 235, 0.6)'
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(54, 162, 235, 1)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
});



// gráfico dinamicos dos jogadores 

async function getRankingsData() {
  try {
    const res = await fetch("/rankings/rankingsJSON");
    const data = await res.json();
    return data.rankings;
  } catch (error) {
    console.error(err);
    alert("Ocorreu um erro ao tentar obter os dados dos gráficos. Tente novamente mais tarde.");
    window.location.href = '/rankings';
    return null;
  }
}


document.addEventListener('DOMContentLoaded', async () => {
    let chartIndex = 2;
    const rankingsData = await getRankingsData();


    for (const [label, players] of Object.entries(rankingsData)) { //percorre o array e cria um gráfico para cada tabela com os valores respetivos
      const usernames = players.map(p => p.username);
      const values = players.map(p => p.value);

      const ctx = document.getElementById(`chart-${chartIndex}`);
      if (!ctx) continue;

      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: usernames,
          datasets: [{
            label: label,
            data: values,
            backgroundColor: [
                'rgba(75, 192, 192, 0.6)',
                'rgba(255, 99, 132, 0.6)',
                'rgba(255, 206, 86, 0.6)',
                'rgba(54, 162, 235, 0.6)'
              ],
              borderColor: [
                'rgba(75, 192, 192, 1)',
                'rgba(255, 99, 132, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(54, 162, 235, 1)'
              ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: { beginAtZero: true }
          }
        }
      });

      chartIndex++;
    }
  });