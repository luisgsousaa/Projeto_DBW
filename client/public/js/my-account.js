const profilePicInput = document.getElementById("profilePicInput"); 
const profilePicPreview = document.getElementById("profilePicPreview");
const profilePicWall = document.getElementById("profileWallInput");
const profilePicWallPreview = document.getElementById("profileWallPreview");


async function fetchUsername() {
  try {
    const res = await fetch("/my-account/JSON");
    const data = await res.json();
    return data;
  } catch (error) {
    console.error(err);
    alert("Ocorreu um erro ao tentar obter os seus dados. Tente novamente mais tarde.");
    window.location.href = '/my-account';
    return null;
  }
}




//lida com o upload das imagens e mostra o preview depois do upload
function handleImageUpload(inputElement, previewElement) {
  inputElement.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        previewElement.src = e.target.result;
        previewElement.style.objectFit = "cover";
      };
      reader.readAsDataURL(file);
    } else {
      alert("Por favor, selecione um arquivo de imagem válido.");
      inputElement.value = "";
    }
  });
}

profilePicPreview.addEventListener("click", () => profilePicInput.click());
profilePicWallPreview.addEventListener("click", () => profilePicWall.click());

//chama a função para a foto de perfil e o wallpaper
handleImageUpload(profilePicInput, profilePicPreview);
handleImageUpload(profilePicWall, profilePicWallPreview);


document.getElementById('profilePicInput').addEventListener('change', async function(event) {

  const file = event.target.files[0];
  if (!file) return;

  const data = await fetchUsername();

  const playerID = data.user_id;
  const profileID = data.profile_id;

  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = function(event) {
      const img = new Image();
      img.src = event.target.result;
      img.onload = function() {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          const maxWidth = 800;
          const maxHeight = 800;
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth || height > maxHeight) {
              const ratio = Math.min(maxWidth / width, maxHeight / height); //diminui o tamanho da imagem caso seha maior que o definido
              width *= ratio;
              height *= ratio;
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          let dbPrefix = "playerProfilePicture_";     
          let pictureName = dbPrefix + playerID + ".jpg"; //nome que a imagem vai ter para ser usada pelo utilizador

          canvas.toBlob(blob => {
              const formData = new FormData();
              formData.append('image', blob, pictureName); //dar o nome à foto

              fetch('/upload', { // guardar a foto
                  method: 'POST',
                  body: formData
              })
              .then(response => response.json())
              .catch(error => console.error('Error:', error));
          }, 'image/jpeg', 0.7); //comrpessão, quanto menor, mais compressao
      };
  };


  //formulario para guardar o caminho da foto na base de dados
  const redirectUrl = `/my-account/fotos/${profileID}?_method=PATCH&action=update_profile_pic`;
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = redirectUrl;

  const methodInput = document.createElement('input');
  methodInput.type = 'hidden';
  methodInput.name = '_method';
  methodInput.value = 'PATCH';
  form.appendChild(methodInput);

  document.body.appendChild(form);
  form.submit();
});


document.getElementById('profileWallInput').addEventListener('change', async function(event) {
  const file = event.target.files[0];
  if (!file) return;

  const data = await fetchUsername();

  const playerID = data.user_id;
  const profileID = data.profile_id;


  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = function(event) {
      const img = new Image();
      img.src = event.target.result;
      img.onload = function() {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          const maxWidth = 800;
          const maxHeight = 800;
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth || height > maxHeight) {
              const ratio = Math.min(maxWidth / width, maxHeight / height); //diminui o tamanho da imagem caso seha maior que o definido
              width *= ratio;
              height *= ratio;
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          let dbPrefix = "playerWallpaperPicture_";
          let pictureName = dbPrefix + playerID + ".jpg"; //nome que a imagem vai ter para ser usada pelo utilizador

          canvas.toBlob(blob => {
              const formData = new FormData();
              formData.append('image', blob, pictureName);//dar o nome à foto

              fetch('/upload', { // guardar a foto
                  method: 'POST',
                  body: formData
              })
              .then(response => response.json())
              .then(data => console.log('Success:', data))
              .catch(error => console.error('Error:', error));
          }, 'image/jpeg', 0.8); //quanto menor, mais compressao
      };
  };

  //formulario para guardar o caminho da foto na base de dados
  const redirectUrl = `/my-account/fotos/${profileID}?_method=PATCH&action=update_wallpaper_pic`;
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = redirectUrl;

  const methodInput = document.createElement('input');
  methodInput.type = 'hidden';
  methodInput.name = '_method';
  methodInput.value = 'PATCH';
  form.appendChild(methodInput);

  document.body.appendChild(form);
  form.submit();

});



document.getElementById("bio").addEventListener("input", function (event) {
  let maxLength = 300;
  let text = this.innerText;

  if (text.length > maxLength) {
    this.innerText = text.substring(0, maxLength);

    // Move o cursor para o final
    let range = document.createRange();
    let sel = window.getSelection();
    range.setStart(this.childNodes[0], this.innerText.length);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  // Atualiza contador de caracteres
  let remaining = maxLength - this.innerText.length;
  document.getElementById("charCount").textContent =
    remaining + " caracteres restantes";
});






//ja ta corrigido ja conta
document.getElementById("nome").addEventListener("input", function (event) {
  let maxLength = 15;
  let text = this.value;

  
  if (text.length > maxLength) {
    this.value = text.substring(0, maxLength);
  }

  
  let remaining = maxLength - this.value.length;
  document.getElementById("charCountNome").textContent =
    remaining + " caracteres restantes";


  const saveButton = document.getElementById("guardar-username");
  if (text.length > 2) {
    saveButton.style.display = "block";
  } else {
    saveButton.style.display = "none";
  }
});







//ja ta corrigido ja conta a o caracteres da bio

document.getElementById("bio").addEventListener("input", function (event) {
  let maxLength = 300;
  let text = this.value;

  
  if (text.length > maxLength) {
    this.value = text.substring(0, maxLength);
  }

 
  let remaining = maxLength - this.value.length;
  document.getElementById("charCount").textContent =
    remaining + " caracteres restantes";


    const saveButton = document.getElementById("guardar-bio");
    if (text.length >= 0) {
      saveButton.style.display = "block";
    } else {
      saveButton.style.display = "none";
    }
});







// Evita que o usuário cole mais de 15 caracteres                      precisa isto?
document.getElementById("nome").addEventListener("paste", function (event) {
  event.preventDefault(); // Impede a ação padrão de colar
  let maxLength = 15;
  let text = event.clipboardData
    .getData("text")
    .substring(0, maxLength - this.innerText.length);

  document.execCommand("insertText", false, text);
});

function autoResize(element) {
  element.style.height = "auto";
  element.style.height = element.scrollHeight + "px";
}












// verificação username
document.addEventListener('DOMContentLoaded', function () {
  const usernameForm = document.querySelector('.username-section form')

  usernameForm.addEventListener('submit', function (e) {
    const username = document.getElementById('nome');
    const errorEl = document.getElementById('error_username');

    let errors = [];

    if (username.value.length < 3 || username.value.length > 15) { //restringe o tamanho do username para entre 3 e 15 letras
      errors.push("O nome de utilizador deve ter entre 3 e 15 caracteres.");
    }

    const usernameRegex = /^[a-zA-Z0-9]+$/; //restringe o tipo de caracteres que podem ser usados no username para numeros e letras normais
    if (!usernameRegex.test(username.value)) {
      errors.push("O nome de utilizador não pode conter caracteres especiais.");
    }

    if (errors.length > 0) { //caso tenha ocorriddo algum erro
      e.preventDefault(); // Impede o envio
      errorEl.innerHTML = errors.join("<br>");// apresenta os erros na página
      errorEl.style.color = 'red';
    } else {
      errorEl.innerHTML = '';
    }
  });
});


//aparecer botão guardar quando tem algo escrito no email ou quando é feita uma mudança
document.getElementById("email").addEventListener("input", function (event) {

  let text = this.value;

    const saveButton = document.getElementById("guardar-email");
    if (text.length >= 0) {
      saveButton.style.display = "block";
    } else {
      saveButton.style.display = "none";
    }
});




//aparecer botão da localização quando é feita uma mudança
document.querySelectorAll(".location input").forEach(input => {
  const saveButton = document.getElementById("guardar-location");
  input.addEventListener("input", function() {
    saveButton.style.display = [...document.querySelectorAll("input[type='text']")].some(input => input.value.trim() !== "") ? "block" : "none";
  });
});




// mostrar ambas as passes
document.addEventListener("DOMContentLoaded", function () {
  const showPassCheckbox = document.getElementById("show_pass_change");
  const currentPasswordInput = document.getElementById("current-password");
  const newPasswordInput = document.getElementById("new-password");

  showPassCheckbox.addEventListener("change", function () {
    currentPasswordInput.type = this.checked ? "text" : "password";
    newPasswordInput.type = this.checked ? "text" : "password";
  });
});


document.addEventListener('DOMContentLoaded', function () {
  const passwordForm = document.getElementById('password-form')

  passwordForm.addEventListener('submit', function (e) {
    const password = document.getElementById('new-password');

    const errorEl = document.getElementById('error_password');

    let errors = [];


    if (password.value.length < 6) {
      errors.push("A nova palavra-passe deve ter pelo menos 6 caracteres."); //verifica o tamanho da password
    }

    if (errors.length > 0) { //caso haja algum erro
      e.preventDefault(); // Impede o envio
      errorEl.innerHTML = errors.join("<br>"); //apresenta qual foi o erro
      errorEl.style.color = 'red';
    } else {
      errorEl.innerHTML = '';
    }
  });
});




//aparecer botão da palavra-passe quando é escrita a palavra-passe atual e a nova tem pelo menos 6 caracteres
document.addEventListener('DOMContentLoaded', () => {
  const currentPasswordInput = document.getElementById('current-password');
  const newPasswordInput = document.getElementById('new-password');
  const guardarButton = document.getElementById('guardar-password');

  

  function validatePasswords() {
    const currentPassword = currentPasswordInput.value.trim();
    const newPassword = newPasswordInput.value.trim();

    if (currentPassword !== '' && newPassword.length >= 6) {
      guardarButton.style.display = 'block';
    } else {
      guardarButton.style.display = 'none';
    }
  }

  currentPasswordInput.addEventListener('input', validatePasswords);
  newPasswordInput.addEventListener('input', validatePasswords);
});


