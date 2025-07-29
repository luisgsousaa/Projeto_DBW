const getLogin = function (req, res) {
  const warning = req.query.warning;
  res.render("login", {warning, user: req.user});
};

const { UserInfo, Profile } = require("../models/users.js");
const { PlayerStats } = require("../models/stats.js");

const formPostRegister = async (req, res) => {
  try {
    const { username, password } = req.body; // recebe os dados enviados no formulário
    const email = req.body.email.toLowerCase();  // põe o email em letra Minuscula

    const existingUser = await UserInfo.findOne({ email: { $regex: `^${email}$`, $options: 'i' } }); // para ter a certeza que não fica duplicado
    const existingProfile = await Profile.findOne({ username: { $regex: `^${username}$`, $options: 'i' }});  //para não haver usernames duplicados onde só muda letras maiúsculas: Joao, joao

    if (existingUser) {
      console.log("Jogador já existe:", existingUser);
      return res.redirect("/login?error=O email ja existe");
    }
    if (existingProfile) {
      console.log("Jogador já existe:", existingProfile);
      return res.redirect("/login?error=O username ja existe");
    }
    
    const newUserInfo = new UserInfo({ email, username}); // cria o utilizador com o email e username dado
    await UserInfo.register(newUserInfo,password)         // regista o utilizador com o documento criado na linha anterior e a password recebida


    // Criação das stats do jogador associado ao documento criado anteriormente
    const newPlayerStats = new PlayerStats({user: newUserInfo._id});
    await newPlayerStats.save();

    //criação do perfil do jogador ssociado ao documento criado anteriormente
    const newProfile = new Profile({
        user: newUserInfo._id,
        username,
        bio: "",
        profile_picture: "",
        profile_wallpaper: "",
        city: "",
        region: "",
        country: "",
        level: 1,
        last_seen: new Date(),
    });

    //cria primeiro comentário no perfil do jogador
    const firstComment = {
          user_profile: newProfile,
          text: "Bem vindo ao meu perfil!",
          createdAt: new Date()
        };
          
    newProfile.comments.push(firstComment);
    

    
    await newProfile.save();
    
    

    //Faz o login automaticamente depois de criar a conta e redireciona para a homepage 
    
      req.login(newUserInfo, function () {
      return res.redirect("/?success=registo_sucesso");
    });


  } catch (error) {
    res.status(500).send("Erro ao criar a conta, tente novamente mais tarde.",error);
  }
};



module.exports = { getLogin, formPostRegister };
