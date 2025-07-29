/**
 * Função ativa a troca de boxes dentro de cada elemento com a classe .box, mostrando o conteúdo correspondente ao botão clicado.
 */

document.addEventListener("DOMContentLoaded", function () {
  const boxes = document.querySelectorAll(".box");

  boxes.forEach((box) => {
    const buttons = box.querySelectorAll(".alternar-botoes button");
    const sections = box.querySelectorAll(".box-content > div");

    buttons.forEach((button, index) => {
      button.addEventListener("click", () => {
        // Alternar os botões
        buttons.forEach((btn) => {
          btn.classList.remove("active");
          btn.querySelector("h5").classList.remove("fw-semibold");
        });

        button.classList.add("active");
        button.querySelector("h5").classList.add("fw-semibold");

        // Alternar a visibilidade das seções dentro desta box
        sections.forEach((section, sectionIndex) => {
          if (sectionIndex === index) {
            section.style.display = "block";
          } else {
            section.style.display = "none";
          }
        });
      });
    });
  });
});
