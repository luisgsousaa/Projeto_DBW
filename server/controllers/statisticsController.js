const { UserInfo } = require("../models/users.js");
const { PlayerStats, playerStatsTranslations } = require("../models/stats.js");


const getStatistics = async function (req, res) {
  if (!req.isAuthenticated()) {
    return res.redirect("/login?warning=nao_autenticado");
  }
  
try {
  const username = req.params.id;  //username que está no link

  const user = await UserInfo.findOne({ username: username });  //procura o documento associado a este username

  if (!user) {
    return res.redirect("/error?error=nao-existe");
  }

  const player_stats = await PlayerStats.findOne({ user: user._id }).select('-_id -__v -user').lean(); // procura o documento associado a user da query anterior e remove valores desnecessários 

  if (!player_stats) {
      return res.status(404).send("Estatísticas não encontradas");
  }

  const translatedStats = Object.entries(player_stats).reduce((acc, [key, value]) => { // traduz para português as estatísticas mantendo os valores de cada uma
    
        const translatedKey = playerStatsTranslations[key];
        acc[translatedKey] = value;
    
    return acc;
  }, {});

  
  //envia para o ejs as estatisticas e o nome do jogador, e o user logado
  res.render('statistics', { stats: translatedStats, username: user.username , user: req.user });

  } catch (error) {
    console.error("Erro ao aceder às estatísticas:", error);
    res.status(500).send("Erro ao aceder às estatísticas");
  }
};


const getStatisticsJSON = async function (req, res) {
  if (!req.isAuthenticated()) {
    return res.redirect("/login?warning=nao_autenticado");
  }
  
try {
  const username = req.params.id;  //username que está no link

  const user = await UserInfo.findOne({ username: username });  //procura o documento associado a este username

  if (!user) {
    return res.redirect("/error?error=nao-existe");
  }

  const player_stats = await PlayerStats.findOne({ user: user._id }).select('-_id -__v -user').lean(); // procura o documento associado a user da query anterior e remove valores desnecessários 

  if (!player_stats) {
      return res.status(404).send("Estatísticas não encontradas");
  }

  const translatedStats = Object.entries(player_stats).reduce((acc, [key, value]) => { // traduz para português as estatísticas mantendo os valores de cada uma
    
        const translatedKey = playerStatsTranslations[key];
        acc[translatedKey] = value;
    
    return acc;
  }, {});

  
  //envia para o ejs as estatisticas e o nome do jogador, e o user logado
  res.json({stats: translatedStats})

  } catch (error) {
    console.error("Erro ao aceder às estatísticas:", error);
    res.status(500).send("Erro ao aceder às estatísticas");
  }
};






module.exports = { getStatistics, getStatisticsJSON };
