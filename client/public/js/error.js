/**
 * Faz redirect ao ser carregado
 */
document.addEventListener('DOMContentLoaded', function () {
    redirect();
});

/**
 * redirecionar para home page
 */
function redirect() {  
    setTimeout(() => { 
        window.location.href = '/'; 
    }, 7000);
}   