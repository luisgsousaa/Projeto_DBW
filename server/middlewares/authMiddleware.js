// verifica se o utilizador está autenticado
function ensureAuthenticated(req, res, next) {
  // se não estiver autenticado, redireciona para a página de login
  if (!req.isAuthenticated()) {
    return res.redirect("/login?warning=nao_autenticado");
  }
  return next(); // se estiver autenticado, continua para o próximo middleware
}


module.exports = ensureAuthenticated;
