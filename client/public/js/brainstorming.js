
const storedWords = [];

/**
 * A função  deteta quando a tecla Enter é pressionada, adiciona a palavra no front end atraves do DOM, e permite removê-la ao clicar sobre ela.
 * @param {*} event Recebe um evento
 */

function checkEnter(event) {
if (event.key === "Enter") {

        event.preventDefault(); 
        const containerWords = document.querySelector(".palavras-inseridas");
        const textarea = document.getElementById("palavras");
        const Word = textarea.value.trim();

        if (Word) {
          storedWords.push(Word);


        const newWord = document.createElement("h5");
        newWord.className = "white-box responsive-white-box cursor";
        newWord.textContent = Word;


        newWord.addEventListener("click", function () {
            const index = storedWords.indexOf(Word);
        if (index !== -1) {
          storedWords.splice(index, 1);
            }

            newWord.remove();
        });

        containerWords.appendChild(newWord);
        }

    textarea.value = "";
} 
  
}






