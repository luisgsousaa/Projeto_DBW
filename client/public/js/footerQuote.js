/**
 * Funçao  busca uma quote aleatória da API Ninja e exibe o texto e o autor nos elementos HTML da página.
 */


async function getQuote() {
    try {
      const answer = await fetch("/footer-quote");
  
      const data = await answer.json();

     
      const element = document.getElementById("frase-dinamica");
      if (element) {
        element.innerHTML = `"${data.text}"`;
      }
  
      document.getElementById("autor_dinamico").innerHTML=`"${data.author}"`
      
    } catch (error) {
      console.error("Erro ao buscar a citação:", error);
    }
  }
  
 
 
document.addEventListener('DOMContentLoaded', function () {
  getQuote();
});
  