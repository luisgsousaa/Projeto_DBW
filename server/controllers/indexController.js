const {PlayerStats, playerStatsTranslations } = require("../models/stats");


const indexController = async function (req, res) {



  const playerStatsNames = Object.keys(PlayerStats.schema.paths).filter(  // tira os nomes das estatisticas da schema
    field => !['user', '_id', '__v'].includes(field)
  );
  
  const twoRandomStatKeys = playerStatsNames // baralha o array e escolhe dois aleatoriamente para serem apresentados
  .sort(() => 0.5 - Math.random())
  .slice(0, 2);


  const translatedPlayerStats = twoRandomStatKeys.map(stat => ({ //traduz apenas as duas estatisticas que foram escolhidas
    key: stat,
    label: playerStatsTranslations[stat] || stat
  }));


  const rankings = {};

  for (const { key, label } of translatedPlayerStats) {  //Guarda os nomes dos jogadores no top 4 e os seus respetivos valores
    const topPlayers = await PlayerStats.find({}, { user: 1, [key]: 1 })
      .populate({ path: 'user', select: 'username' })
      .sort({ [key]: -1 })
      .limit(4)
      .lean();

    rankings[label] = topPlayers.map((player, index) => ({
      username: `${index + 1} - ${player.user?.username || 'Nome não encontrado'}`,  //caso não encontre o nome é posta esta mensagem
      value: player[key] || 0
    }));
  }



  const success = req.query.success;  // usado para exibir uma mensagem de sucesso para o login e registo
  res.render("index", {success, user: req.user , rankings});
};

module.exports = { indexController };
