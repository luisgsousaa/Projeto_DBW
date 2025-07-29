const express = require("express");
const router = express.Router();
const loginController = require("../controllers/loginController");
const passport = require("passport");

router.get("/login", loginController.getLogin);
router.post("/registar", loginController.formPostRegister);


router.post(
    "/login",
    passport.authenticate("local", { failureRedirect: "/login?error=erro_login"}), //autenticação do jogador no login e fazer redirect para a homepage com uma mensagem de sucesso
    function (req,res) {
        res.redirect("/?success=login_sucesso");
    }
);
router.get("/logout", (req, res) => { // fazer logout e dar redirect para a homepage
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});



//////////// Contas dev a usar no desenvolvimento para evitar estar sempre a iniciar sessão
const { UserInfo } = require("../models/users.js");

router.get('/dev1', async (req, res) => {


  const user = await UserInfo.findById('67f2dd740005530ff063d780');
  req.login(user, err => {
    if (err) throw err;
    res.redirect('/'); 
  });
});




router.get('/dev2', async (req, res) => {


  const user = await UserInfo.findById('67f2dd870005530ff063d78d');
  req.login(user, err => {
    if (err) throw err;
    res.redirect('/'); 
  });
});


router.get('/dev3', async (req, res) => {


  const user = await UserInfo.findById('67f2dda10005530ff063d79a');
  req.login(user, err => {
    if (err) throw err;
    res.redirect('/'); 
  });
});



////////////////////////////////////////////////////////////////////////




module.exports = router;
