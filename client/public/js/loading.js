function loadBounce(){

    let dirX = 1;
    let dirY = 1;
    const speed = 4;

    const img = document.getElementById("img");
    const container = document.getElementById("container");

    // Dimensoes do container
const containerWidth = container.clientWidth;
const containerHeight = container.clientHeight;

// Coordenadas do meio do container
let x = (containerWidth - img.offsetWidth) / 2;
let y = (containerHeight - img.offsetHeight) / 2;

function animate() {
  const screenWidth = container.clientWidth;
  const screenHeight = container.clientHeight;
  
  const imgWidth = img.offsetWidth;
  const imgHeight = img.offsetHeight;
  
  //Quando chega a borda muda a direcao
  if (y + imgHeight >= screenHeight || y < 0) {
    dirY *= -1;
}
if (x + imgWidth >= screenWidth || x < 0) {
    dirX *= -1;
}

//Calcular nova posicao
x += dirX * speed;
y += dirY * speed;

  //mover a imagem
  img.style.left = x + "px";
  img.style.top = y + "px";
  
  // Chama recursivamente para continuar a animacao
  window.requestAnimationFrame(animate);
}


window.requestAnimationFrame(animate);

}