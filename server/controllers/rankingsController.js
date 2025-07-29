const { GameStats, PlayerStats, playerStatsTranslations, gameStatsTranslations } = require("../models/stats");


const getRankings = async function (req, res) {
  try {
    
    if (!req.isAuthenticated()) {
      return res.redirect("/login?warning=nao_autenticado");
    }
  
    const playerStatsNames = Object.keys(PlayerStats.schema.paths).filter(  // tira os nomes da schema
      field => !['user', '_id', '__v'].includes(field)
    );
    
    const translatedPlayerStats = playerStatsNames.map(stat => ({  // traduz da schema para português apresentável
      key: stat,
      label: playerStatsTranslations[stat] || stat    // se não tiver na lista portuguesa fica como está na bd
    }));
    
    const rankings = {};
    
    for (const { key, label } of translatedPlayerStats) { 
      const topPlayers = await PlayerStats.find({}, { user: 1, [key]: 1 }) //procura o top 10 de jogadores nas respetivas estatísticas
        .populate({ path: 'user', select: 'username' })
        .sort({ [key]: -1 })
        .limit(10)
        .lean();
    
      rankings[label] = topPlayers.map((player, index) => ({ //guarda o username e o valor no objeto rankings
        username: `${index + 1} - ${player.user?.username || 'Nome não encontrado'}`, // é posto o número da posição antes do nome
        value: player[key] || 0
      }));
    }
    
    
    // game stats
    const game_stats = await GameStats.findOne({}).select('-_id -__v ').lean(); // procura o documento com as estatistícas do jogo e remove o que não é necessário
    
    
    if (!game_stats) {
      console.log('Estatísticas do jogo não foram encontradas.');
      return;
    }
    
    
    const translatedGameStats = Object.entries(game_stats).reduce((acc, [key, value]) => { //traduz para português o nome das estatísticas 
      
      const translatedKey = gameStatsTranslations[key];
      acc[translatedKey] = value;
      
      return acc;
    }, {});
    
    
    return res.render("rankings", { user: req.user, rankings, stats: translatedGameStats});
    } catch (error) {
      res.status(500).send("Erro ao aceder aos rankings, tente novamente mais tarde.",error);
    }
  };
  

const getRankingsJSON = async function (req, res) {
    try {
      
      if (!req.isAuthenticated()) {
        return res.redirect("/login?warning=nao_autenticado");
      }
    
      const playerStatsNames = Object.keys(PlayerStats.schema.paths).filter(  // tira os nomes da schema
        field => !['user', '_id', '__v'].includes(field)
      );
      
      const translatedPlayerStats = playerStatsNames.map(stat => ({  // traduz da schema para português apresentável
        key: stat,
        label: playerStatsTranslations[stat] || stat    // se não tiver na lista portuguesa fica como está na bd
      }));
      
      const rankings = {};
      
      for (const { key, label } of translatedPlayerStats) { 
        const topPlayers = await PlayerStats.find({}, { user: 1, [key]: 1 }) //procura o top 10 de jogadores nas respetivas estatísticas
          .populate({ path: 'user', select: 'username' })
          .sort({ [key]: -1 })
          .limit(10)
          .lean();
      
        rankings[label] = topPlayers.map((player, index) => ({ //guarda o username e o valor no objeto rankings
          username: `${index + 1} - ${player.user?.username || 'Nome não encontrado'}`, // é posto o número da posição antes do nome
          value: player[key] || 0
        }));
      }
      
      
      
       res.json({rankings: rankings});
      } catch (error) {
        res.status(500).send("Erro ao aceder aos rankings, tente novamente mais tarde.",error);
      }
    };


  const getGlobalStatsJSON = async function (req, res) {
    try {
      
      if (!req.isAuthenticated()) {
        return res.redirect("/login?warning=nao_autenticado");
      }
      
      
      // game stats
      const game_stats = await GameStats.findOne({}).select('-_id -__v ').lean(); // procura o documento com as estatistícas do jogo e remove o que não é necessário
      
      
      if (!game_stats) {
        console.log('Estatísticas do jogo não foram encontradas.');
        return;
      }
      
      
      const translatedGameStats = Object.entries(game_stats).reduce((acc, [key, value]) => { //traduz para português o nome das estatísticas 
        
        const translatedKey = gameStatsTranslations[key];
        acc[translatedKey] = value;
        
        return acc;
      }, {});
      
      res.json({stats: translatedGameStats});
      } catch (error) {
        res.status(500).send("Erro ao aceder às estatísticas globais, tente novamente mais tarde.",error);
      }
    };


  
  
  module.exports = { getRankings, getRankingsJSON, getGlobalStatsJSON};