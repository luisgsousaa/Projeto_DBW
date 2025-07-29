function toggleForm(type) {
  let usernameField = document.getElementById("username-field");
  let rememberMeSection = document.querySelector(".remember-forgot-password");

  if (type === "registar") {
    usernameField.style.display = "block";
    rememberMeSection.style.display = "none";
  } else {
    usernameField.style.display = "none";
    rememberMeSection.style.display = "flex";
  }
}

document.addEventListener("DOMContentLoaded", function() {
  const urlParams = new URLSearchParams(window.location.search);
  const error = urlParams.get("error");


  if (error !== null) {
    if(error !== "erro_login"){
      const loginSection = document.querySelector(".loginsection"); 
      const registerSection = document.querySelector(".registersection");  
  
      registerSection.style.display = "block"; 
      loginSection.style.display = "none";  
  
  
      const buttons = document.querySelectorAll(".alternar-botoes button");
      buttons.forEach(button => {
        if (button.textContent.trim() === "Registar") {
          button.classList.add("active");  
        } else {
          button.classList.remove("active");  
        }
      });
  
    
      const errorMessage = document.getElementById("error_register");
      errorMessage.textContent = error;  
      errorMessage.style.color = "red"; 
      errorMessage.style.marginTop = "10px";  
    }
    else{
      const errorMessage = document.getElementById("error_login");
      errorMessage.textContent = "Os dados que inseriu estão errados, por favor verifique-os.";  
      errorMessage.style.color = "red"; 
      errorMessage.style.marginTop = "10px";  
    }
  }
});




//verificações do registo
document.addEventListener('DOMContentLoaded', function () {
  const registerForm = document.querySelector('.registersection form');

  registerForm.addEventListener('submit', function (e) {
    const username = document.getElementById('username');
    const email = registerForm.querySelector('input[type="email"]');
    const password = registerForm.querySelector('input[type="password"]');
    const errorEl = document.getElementById('error_register');

    let errors = [];

    if (username.value.length < 3 || username.value.length > 15) { //restringe o tamanho do username para entre 3 e 15 letras
      errors.push("O nome de utilizador deve ter entre 3 e 15 caracteres.");
    }

    const usernameRegex = /^[a-zA-Z0-9]+$/;  //restringe o tipo de caracteres que podem ser usados no username para numeros e letras normais
    if (!usernameRegex.test(username.value)) {
      errors.push("O nome de utilizador não pode conter caracteres especiais.");
    }


    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // restringe o tipo de caracteres que podem ser usados no email
    if (!emailRegex.test(email.value)) {
      errors.push("Por favor, introduza um email válido.");
    }

    if (password.value.length < 6 || password.value.length > 128) { //restringe o tamanho da password para entre 6 e 128 letras
      errors.push("A palavra-passe deve ter entre 6 e 128 caracteres.");
    }

    if (errors.length > 0) { //caso tenha ocorriddo algum erro
      e.preventDefault(); // Impede o envio
      errorEl.innerHTML = errors.join("<br>"); // apresenta os erros na página
      errorEl.style.color = 'red';
    } else {
      errorEl.innerHTML = '';
    }
  });
});


//mostra a passe no login
document.addEventListener("DOMContentLoaded", function () {
  const showPassCheckbox = document.getElementById("show_pass_log");
  const passwordInput = document.getElementById("password_log");

  showPassCheckbox.addEventListener("change", function () {
    passwordInput.type = this.checked ? "text" : "password";  //altera o tipo de input para text em vez de password
  });
});


//mostra a passe no registo
document.addEventListener("DOMContentLoaded", function () {
  const showPassCheckbox = document.getElementById("show_pass_reg");
  const passwordInput = document.getElementById("password_reg");

  showPassCheckbox.addEventListener("change", function () {
    passwordInput.type = this.checked ? "text" : "password"; //altera o tipo de input para text em vez de password
  });
});







