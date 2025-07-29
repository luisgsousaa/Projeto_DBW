const getError = function (req, res) {
    if (!req.isAuthenticated()) {
        return res.redirect("/login?warning=nao_autenticado");
      }
      const error= req.query.error; // parametros que estão no link que irão determinar que tipo de erro ocorreu

      res.render("error", { user: req.user, error });
  };
  
  module.exports = { getError };