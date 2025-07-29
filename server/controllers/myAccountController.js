const { Profile, UserInfo } = require("../models/users.js");
const fs = require('fs');  //usado para apagar as fotos
const path = require('path');
const sanitizeHtml = require('sanitize-html');

const getMyAccount = async function (req, res) {
  try {
    if (!req.isAuthenticated()) {
      return res.redirect("/login?warning=nao_autenticado");
    }
  
    const user_profile = await Profile.findOne({ username: req.user.username }) // usado para buscar os dados do jogador que está logado
  
    // mensagens de erro ou sucesso que são recebidas após editar a conta
    const error = req.query.error; 
    const success = req.query.success;
    res.render("my-account", { user: req.user, user_profile: user_profile, error, success });
  } catch (error) {
    res.status(500).send("Erro ao encontrar perfil associado à sua conta, tente novamente mais tarde.",error);
  }
};

const getMyAccountJSON = async function (req,res) {
  try {
    if (!req.isAuthenticated()) {
      return res.redirect("/login?warning=nao_autenticado");
    }

    const user_profile = await Profile.findOne({ username: req.user.username })

    res.json({user_id: req.user.id , profile_id: user_profile.id });
  }
  catch (error) {
  res.status(500).send("Erro ao encontrar perfil associado à sua conta, tente novamente mais tarde.",error);
  }
}




const editPhotos = async function (req, res) {
  try {
    
    if (!req.isAuthenticated()) {
      return res.redirect("/login?warning=nao_autenticado");
    }
  
    const profile_id = req.params.id;  //id do perfil que está a ser editado
    const action = req.query;          // ação a ser feita
  
    const user_profile = await Profile.findById(profile_id).exec(); // encontrar documento do perfil a ser editado
  
    if(user_profile.user.toString() !== req.user.id){     // evitar que alterem o codigo html para mexer noutros perfis
      console.log(`Acesso não autorizado por parte de ${req.user.username}`)
      return res.redirect("/my-account");
    }
    
    const userID = user_profile.user;
    
    switch(action.action){
  
      //remover foto de perfil
      case "remove_profile_pic":{
        user_profile.profile_picture = ''; // remove o caminho guardado na bd
        await user_profile.save();
  
        //caminho da foto no diretório do site
        file = "playerProfilePicture_" + userID + ".jpg";
        let imageDir = path.join(__dirname, '..', '..', 'client', 'public', 'images', 'playerProfile', file);
        //elimina a foto
        fs.unlink(imageDir, (err) => {
          if (err) {
            console.error("Erro ao apagar a foto de perfil:", err);
          }
        });
        break;
      }
      //atualizar a foto de perfil
      case "update_profile_pic":{
        user_profile.profile_picture = `/images/playerProfile/playerProfilePicture_${userID}.jpg`; // guardar na bd o caminho da foto
        await user_profile.save();
        break;
      }
      //remover wallpaper
      case "remove_wallpaper_pic":{
        user_profile.profile_wallpaper = '';
        await user_profile.save();
  
        file = "playerWallpaperPicture_" + userID + ".jpg";
        let imageDir = path.join(__dirname, '..', '..', 'client', 'public', 'images', 'playerProfile', file);
  
        fs.unlink(imageDir, (err) => {
          if (err) {
            console.error("Erro ao apagar o wallpaper:", err);
          }
        });
  
        break;
      }
      //atualizar foto de perfil
      case "update_wallpaper_pic":{
        user_profile.profile_wallpaper = `/images/playerProfile/playerWallpaperPicture_${userID}.jpg`;
        await user_profile.save();
        break;
      }
      }
        return res.redirect("/my-account?scroll=wallpaper-form"); // scroll para onde estava após editar as fotos
  } catch (error) {
    res.status(500).send("Erro ao atualizar as imagens, tente novamente mais tarde.",error);
  }
}



const editUsername = async function (req, res) {
  try {
    
    if (!req.isAuthenticated()) {
      return res.redirect("/login?warning=nao_autenticado");
    }
  
    const profile_id = req.params.id;
  
    const user_profile = await Profile.findById(profile_id).exec(); // encontrar o perfil a ser alterado
  
    if(user_profile.user.toString() !== req.user.id){     // evitar que alterem o codigo html para mexer noutros perfis
      console.log(`Acesso não autorizado por parte de ${req.user.username}`)
      return res.redirect("/my-account");
    }
  
    const { username } = req.body;
  
    const existingProfile = await Profile.findOne({ username: { $regex: `^${username}$`, $options: 'i' }}); //verifica se o username já está ocupado
  
    if(existingProfile){
      console.log("Jogador já existe:", existingProfile);
      return res.redirect("/my-account?error=username-em-uso");   // apresenta um erro a informar que já está ocupado o username escolhido              
    }
  
  
    const user_info = await UserInfo.findById(user_profile.user).exec(); // procura o userInfo a ser alterado
    
    //altera o username
    user_info.username = username;
    await user_info.save();
  
    user_profile.username = username;
    await user_profile.save();
  
    req.login(user_info, err => {          //dá login novamente pois esta ação termina a sessão do jogador
      if (err) throw err;
      res.redirect('/my-account?success=username&scroll=username-form'); // informa do sucesso da operação e dá scroll para a secção do username
    });
  } catch (error) {
    res.status(500).send("Erro ao alterar nome de utilizador, tente novamente mais tarde.",error);
  }
  
}



const editBio = async function (req, res) {
  try {
    if (!req.isAuthenticated()) {
      return res.redirect("/login?warning=nao_autenticado");
    }
  
    const profile_id = req.params.id;
  
    const user_profile = await Profile.findById(profile_id).exec(); // procura o perfil a ser editado
  
    if(user_profile.user.toString() !== req.user.id){     // evitar que alterem o codigo html para mexerem noutros perfis
      console.log("Acesso não autorizado")
      return res.redirect("/my-account");
    }
  
  
    const bio = sanitizeHtml(req.body.bio, {       //sanitiza o texto introduzido pelo utilizador
      allowedTags: [ 'b', 'i', 'em', 'strong', 'a' ],
      allowedAttributes: {
        'a': [ 'href' ]},
      });
  
  
    user_profile.bio = bio;      //guarda o texto
    await user_profile.save();
  
    res.redirect('/my-account?success=bio&scroll=bio-form');  // informa do sucesso da operação e dá scroll para a secção da bio
  } catch (error) {
    res.status(500).send("Erro ao atualizar a biografia, tente novamente mais tarde.",error);
  }
}


const editLocation = async function (req, res) {
  try {
    if (!req.isAuthenticated()) {
      return res.redirect("/login?warning=nao_autenticado");
    }
  
    const profile_id = req.params.id;
  
    const user_profile = await Profile.findById(profile_id).exec(); // procura o perfil a ser editado
  
    if(user_profile.user.toString() !== req.user.id){     // evitar que alterem o codigo html para mexerem noutros perfis
      console.log(`Acesso não autorizado por parte de ${req.user.username}`)
      return res.redirect("/my-account");
    }
  
    //sanitiza o texto introduzido pelo utilizador
  
    const country = sanitizeHtml(req.body.new_comment, {
      allowedTags: [ 'b', 'i', 'em', 'strong', 'a' ],
      allowedAttributes: {
        'a': [ 'href' ]},
      });
  
    const region = sanitizeHtml(req.body.region, {
      allowedTags: [ 'b', 'i', 'em', 'strong', 'a' ],
      allowedAttributes: {
        'a': [ 'href' ]},
      });
  
    const city = sanitizeHtml(req.body.city, {
      allowedTags: [ 'b', 'i', 'em', 'strong', 'a' ],
      allowedAttributes: {
        'a': [ 'href' ]},
      });
  //
  
      //guarda as informações
    user_profile.country = country;
    user_profile.region = region;
    user_profile.city = city;
    
    await user_profile.save();
  
    res.redirect('/my-account?success=location&scroll=location-form'); // informa do sucesso da operação e dá scroll para a secção da localização
  } catch (error) {
    res.status(500).send("Erro ao atualizar a localização, tente novamente mais tarde.",error);
  }
}


const editEmail = async function (req, res) {
  try {
    
    if (!req.isAuthenticated()) {
      return res.redirect("/login?warning=nao_autenticado");
    }
  
    const profile_id = req.params.id;
  
    const user_profile = await Profile.findById(profile_id).exec(); // procura o perfil a ser editado
  
    if(user_profile.user.toString() !== req.user.id){     // evitar que alterem o codigo html para mexerem noutros perfis
      console.log(`Acesso não autorizado por parte de ${req.user.username}`)
      return res.redirect("/my-account");
    }
  
    const { email } = req.body; //novo email
  
    const existingUser = await UserInfo.findOne({ email: email}); //verifica se o email já está em uso
  
    if(existingUser){
      return res.redirect("/my-account?error=email-em-uso&scroll=email-form"); // informa o erro e dá scroll para a secção do email             
    }
  
    const user_info = await UserInfo.findById(user_profile.user).exec();  //procua o userInfo do jogador que vai alterar o seu email
  
    user_info.email = email; //guarda o novo email
    await user_info.save();
  
  
    
    req.login(user_info, err => {   //dá login novamente pois esta ação termina a sessão do jogador       
      if (err) throw err;
      res.redirect('/my-account?success=email&scroll=email-form');
    });
  } catch (error) {
    res.status(500).send("Erro ao atualizar o email, tente novamente mais tarde.",error);
  }
}






const editPassword = async function (req, res) {
  try {
    
    if (!req.isAuthenticated()) {
      return res.redirect("/login?warning=nao_autenticado");
    }
  
    const profile_id = req.params.id;
  
    const user_profile = await Profile.findById(profile_id).exec(); // procura o perfil a ser editado
  
    if(user_profile.user.toString() !== req.user.id){     // evitar que alterem o codigo html para mexerem noutros perfis
      console.log(`Acesso não autorizado por parte de ${req.user.username}`)
      return res.redirect("/my-account");
    }
  
    const { current_password, new_password  } = req.body;  //dados do formulário
  
    const user_info = await UserInfo.findById(user_profile.user).exec();  // userInfo do jogador que irá alterar a sua password 
  
    user_info.changePassword(current_password, new_password, function(err) {
      if (err) {
        return res.redirect('/my-account?error=password-errada&scroll=password-form');  // informa que a password está errada e dá scroll até a secção da password
  
      }
  
      req.login(user_info, err => {         //dá login novamente pois esta ação termina a sessão do jogador
        if (err) throw err;
        res.redirect('/my-account?success=palavra-passe&scroll=password-form'); // informa do sucesso da operação e dá scroll para a secção da password
      });
    });
  } catch (error) {
    res.status(500).send("Erro ao atualizar a palavra-passe, tente novamente mais tarde.",error);
  }
}


module.exports = { getMyAccount, getMyAccountJSON, editPhotos, editUsername, editBio, editLocation, editEmail, editPassword};
