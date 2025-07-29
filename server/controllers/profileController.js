// profileController.js

const sanitizeHtml = require("sanitize-html");
const { PlayerStats } = require("../models/stats.js");
const { Profile } = require("../models/users.js");

const getProfile = async function (req, res) {
  if (!req.isAuthenticated()) {
    return res.redirect("/login?warning=nao_autenticado");
  }

  try {
    const user = req.params.id; //username do perfil que estamos a ver

    const profile = await Profile.findOne({ username: user }) // procurar perfil com o respetivo username e popular os arrays para o following e para os comentários
      .populate("comments.user_profile")
      .populate("following.user_profile");

    if (!profile) {
      return res.redirect("/error?error=perfil-inexistente"); // Se o perfil não existir, redireciona para a página de erro
    }
    const stats = await PlayerStats.findOne({ user: profile.user }); //procura as stats do dono do perfil

    const visiting_user_profile = await Profile.findOne({
      username: req.user.username,
    }); // usado para buscar a foto do jogador que visita o perfil

    const checkFollowing = await Profile.findOne({
      username: req.user.username,
      "following.user_profile": profile.id,
    }); //verifica se o jogador que está a visitar o perfil segue o perfil

    res.render("profile", {
      profile_data: profile,
      stats: stats,
      user: req.user,
      visiting_user_profile: visiting_user_profile,
      isFollowing: checkFollowing !== null,
    });
  } catch (error) {
    res.status(500).send("Erro ao aceder ao perfil");
  }
};

const getError = async function (req, res) {
  if (!req.isAuthenticated()) {
    return res.redirect("/login");
  }

  return res.redirect("/error?error=perfil-inexistente");
};




const followPlayer = async function (req, res) {
  if (!req.isAuthenticated()) {
    return res.redirect("/login?warning=nao_autenticado");
  }
  const followingUserProfileID = req.user.id; //o que começou esta açao
  const followedUserProfileID = req.params.id; //o que está a ser seguido

  const followingUserProfile = await Profile.findOne({
    user: followingUserProfileID,
  }); //perfil do jogador que começou a ação

  const checkDuplicate = await Profile.findOne({  //verificação se já segue para não haver duplicados
    user: followingUserProfileID,
    "following.user_profile": followedUserProfileID,
  });

  const followedUserProfile = await Profile.findOne({
    _id: followedUserProfileID,
  }); //perfil do que está a ser seguido

  if (followingUserProfileID === followedUserProfileID) { //para evitar seguir-se a si proprio
    res.redirect(`/profile/${followedUserProfile.username}?erro=self-follow`);
  } else if (!checkDuplicate) { //verificar se não ta duplicado
    const followee = {
      user_profile: followedUserProfileID,
    };

    followingUserProfile.following.push(followee); //adicionar o jogador no array do perfil do que está a seguir
    await followingUserProfile.save();

    res.redirect(`/profile/${followedUserProfile.username}`); // volta para o perfil inicial
  } else {
    res.redirect(`/profile/${followedUserProfile.username}?erro=seguir`); 
  }
};

const unfollowPlayer = async function (req, res) {
  if (!req.isAuthenticated()) {
    return res.redirect("/login?warning=nao_autenticado");
  }
  const unfollowingUserProfileID = req.user.id; //o que começou esta açao
  const unfollowedUserProfileID = req.params.id; //o que está a ser removido

  const unfollowingUserProfile = await Profile.findOne({
    user: unfollowingUserProfileID,
  }); //o que começou esta açao

  unfollowingUserProfile.following = unfollowingUserProfile.following.filter( // remove o jogador do array de pessoas que segue
    (player) => player.user_profile.toString() !== unfollowedUserProfileID
  );

  await unfollowingUserProfile.save();

  const unfollowedUserProfile = await Profile.findOne({
    _id: unfollowedUserProfileID,
  }); //o que está a deixar de ser seguido (para o redirect)
  res.redirect(`/profile/${unfollowedUserProfile.username}`);
};

const writeComment = async function (req, res) {
  if (!req.isAuthenticated()) {
    return res.redirect("/login?warning=nao_autenticado");
  }

  const commentorID = req.user.id; // id user a comentar
  const profileID = req.params.id; //id do perfil

  const commentorProfile = await Profile.findOne({ user: commentorID }); //perfil do jogador que comenta

  const targetProfile = await Profile.findOne({ _id: profileID }); //perfil que vai ser comentado


  const new_comment = sanitizeHtml(req.body.new_comment, { //sanitiza o texto introduzido pelo utilizador
  allowedTags: [ 'b', 'i', 'em', 'strong', 'a' ],
  allowedAttributes: {
    'a': [ 'href' ]},
  });

  
  
  if(!new_comment){ //caso o comentario tenha ficado vazio
    return res.redirect(`/profile/${targetProfile.username}?scroll=comments`);
  }

  //comentario a ser introduzido
  const newComment = {
    user_profile: commentorProfile.id,
    text: new_comment,
  };

  targetProfile.comments.push(newComment); //adicionar comentario no array
  await targetProfile.save();

  res.redirect(`/profile/${targetProfile.username}?scroll=comments`); // scroll para os comentarios após dar submit
};

const deleteComment = async function (req, res) {
  if (!req.isAuthenticated()) {
    return res.redirect("/login?warning=nao_autenticado");
  }

  const targetProfileID = req.params.id; // id perfil onde o comentário está

  const { comment_id } = req.body; // id do comentário

  const targetProfile = await Profile.findOne({ _id: targetProfileID }); //perfil onde o comentário está

  targetProfile.comments = targetProfile.comments.filter(  //elimina do array o comentario cujo id é passado 
    (comment) => comment._id.toString() !== comment_id
  );

  await targetProfile.save();

  res.redirect(`/profile/${targetProfile.username}?scroll=comments`); // volta ao perfil e dá scroll até os comentarios
};

module.exports = {
  getProfile,
  getError,
  followPlayer,
  unfollowPlayer,
  writeComment,
  deleteComment,
};
