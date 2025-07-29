/**
 * Funcao que escreve no chat as menssagens atraves do DOM
 * @param {*} content o conteudo que vai ser escrito no front end
 * @param {*} sender  o autor do texto
 * @param {*} username o nome que vai escrever no front end
 */


function displayMessage(content, sender, username) {
  const cleanedContent = content.replace(/<[^>]*>/g, '').trim();
  
  const messagesContainer = document.querySelector('.scroll-box');
  const message = document.createElement('div');
  message.classList.add('message', sender);


  const messageContentContainer = document.createElement('div');
  messageContentContainer.classList.add('message-content-container');
  

  const usernameDiv = document.createElement('div');
  usernameDiv.classList.add('username');
  usernameDiv.innerHTML = '<strong>' + username + ':</strong>';  

  const messageContent = document.createElement('div');
  messageContent.classList.add('message-text');
  messageContent.textContent = cleanedContent; 

  messageContentContainer.appendChild(usernameDiv);
  messageContentContainer.appendChild(messageContent);


  message.appendChild(messageContentContainer);


  messagesContainer.appendChild(message);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}


/**
 * Funcao que envia a mensagem do utilizador para uma API do LmStudio, mostra a resposta da IA no chat  e trata possíveis erros de comunicação.
 * @returns 
 */
async function sendMessage() {
  const userInputElement = document.getElementById('userInput');
  const userInput = userInputElement.value;
  if (userInput.trim() === "") return;

  userInputElement.value = ''; // Limpa o input IMEDIATAMENTE
  displayMessage(userInput, 'user', "EU");

  try {
    const response = await fetch('http://localhost:3000/ai-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: `${userInput}\nColoca a apenas a resposta final e a mais curta possível. Sem explicações ou raciocinio. Sem "#" ou formatação.`
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Erro:", errorData.message);
      displayMessage(errorData.message || "Erro ao processar a resposta do servidor.", 'bot', "BOT");
      return;
    }

    const data = await response.json();
    displayMessage(data.response.choices[0].message.content, 'bot', "BOT");
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    displayMessage('Erro ao se comunicar com o servidor.', 'bot', "BOT");
  }
}

/**
 * Funcao que limpa o chat
 */

function resetChat() {
  const messagesContainer = document.querySelector('.scroll-box');
  messagesContainer.innerHTML = '';
}

/**
 * Funcao que le o evento e se for igual ao enter envia a mensagem
 * @param {*} event recebe um evento que sera clicar na tecla enter
 */
function enter_chat(event)
{
    if (event.key === 'Enter') {
        event.preventDefault(); // Evita o envio do formulário
        sendMessage();
    }
}

  