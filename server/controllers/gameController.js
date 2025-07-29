// gameController.js
const { Profile, UserInfo } = require("../models/users.js"); // importa o modelo profile para poder fazer queries à base de dados (no caso, para foto e username)
const Room = require("../models/room.js"); // importa o modelo room para poder fazer queries à base de dados (no caso, para o estado da sala)
const Played = require("../models/played.js");
const {PlayerStats, GameStats } = require("../models/stats.js");


// renderiza game.ejs e passa os dados do utilizador autenticado
const getGame = function(req, res) {
    res.render("game", { user: req.user });
};

// renderiza os partials utilizados ao longo do jogo
const getGamePartial = function(req, res) {
    const partial = req.params.partial; // guarda o parametro da url
    const allowedPartials = ["waiting-room", "brainstorming", "loading", "voting", "results"];

    // garante que o utilizador não tenta aceder a um partial do jogo que não existe
    if (!allowedPartials.includes(partial)) {
        return res.status(404).send("A página do jogo que está a tentar aceder não existe.");
    }
    res.render(`partials/game/${partial}`, { user: req.user, layout: false }); // layout a falso porque ja ta carregado no game.ejs (se nao ia ter o footer, header e head do partial a mais na pagina - tamos a usar express-ejs-layouts para nao ter que andar a repetir código)
};

// encontra o perfil do utilizador na base de dados e devolve o username
const getUsername = async function(req, res) {
    try {
        const profile = await Profile.findOne({ user: req.user._id }); // encontra o perfil na base de dados através do id do utilizador autenticado para poder depois ir buscar o username
        if (!profile) {
            return res.status(404).send("Ocorreu um erro ao tentar obter os seus dados do seu perfil na base de dados. Tente novamente mais tarde.");
        }
        return res.json({ username: profile.username });
    } catch (err) {
        console.error(err);
        return res.status(500).send("Ocorreu um erro no servidor ao tentar obter o username do seu perfil. Tente novamente mais tarde.");
    }
};

// encontra o perfil do utilizador na base de dados e devolve a imagem de perfil (avatar)
const getUserImageByUsername = async function(req, res) {
    const { username } = req.query;

    if (!username) {
        return res.status(400).send("O parâmetro 'username' é obrigatório.");
    }

    try {
        const profile = await Profile.findOne({ username: username });
        if (!profile) {
            return res.status(404).send(`Perfil do utilizador "${username}" não encontrado.`);
        }
        return res.json({ profile_picture: profile.profile_picture });
    } catch (err) {
        console.error(err);
        return res.status(500).send("Ocorreu um erro no servidor ao tentar obter a imagem do perfil.");
    }
};

// saca lista de utilizadores que o utilizador autenticado ta a seguir
const getFollowing = async function(req, res) {
    try {
        const profile = await Profile.findOne({ user: req.user._id }).populate('following.user_profile'); // encontra o perfil na base de dados atraves do id do utilizador autenticado
        const followingUsernames = profile.following.map(f => f.user_profile.username); // de cada perfil seguido, saca o username
        return res.json({ following: followingUsernames }); // devolve em json a lista de usernames seguidos 
    } catch (err) {
        console.error(err);
        return res.status(500).send("Ocorreu um erro no servidor ao tentar obter a lista de utilizadores seguidos.");
    }
};

// segue o utilizador 
const followUser = async function(req, res) {
    const { usernameToFollow } = req.body; // username do utilizador que o utilizador quer seguir

    try {
        const currentUserProfile = await Profile.findOne({ user: req.user._id }); // encontra o perfil do utilizador autenticado
        if (!currentUserProfile) {
            return res.status(404).send("Ocorreu um erro ao tentar obter os seus dados do seu perfil na base de dados. Tente novamente mais tarde.");
        }
        const targetProfile = await Profile.findOne({ username: usernameToFollow }); // encontra o perfil do utilizador que o utilizador quer seguir
        if (!targetProfile) {
            return res.status(404).send("Ocorreu um erro ao tentar obter os dados do perfil do jogador que queria seguir. Tente novamente mais tarde.");
        }
        const alreadyFollowing = currentUserProfile.following.some(f => f.user_profile.toString() === targetProfile._id.toString()); // verifica se já ta a seguir o jogador que se quer seguir
        // se nao tiver, adiciona o jogador à lista de seguidores do utilizador autenticado
        if (!alreadyFollowing) {
            currentUserProfile.following.push({ user_profile: targetProfile._id });
            await currentUserProfile.save(); // guarda na base de dados
        }
        return res.json({ success: true }); // devolve em json que foi bem sucedido
    } catch (err) {
        console.error(err);
        return res.status(500).send("Ocorreu um erro no servidor ao tentar seguir o utilizador. Tente novamente mais tarde.");
    }
};

// saca o estado do jogo de uma sala atraves do id na base de dados
const getGameState = async function(req, res) {
    const roomID = req.query.roomID;

    try {
        const room = await Room.findOne({ _id: roomID }); // encontra a sala na base de dados através do id da sala
        if (!room) {
            return res.status(404).send("Ocorreu um erro ao tentar obter os dados da sala. Tente novamente mais tarde.");
        }

        return res.json({ state: room.game_state }); // devolve em json o estado do jogo da sala
    } catch (err) {
        console.error(err);
        return res.status(500).send("Ocorreu um erro ao tentar obter os dados da sala. Tente novamente mais tarde.");
    }
};




const submitWords = async function(req, res) {
    const words = req.body.palavras;
    const username = req.body.username;
    const gameID = req.body.gameID;
    
    
    const player = { // preenche o nome e as palavas do jogador
        username: username,
        words: words,
        }

    try {
        const game = await Played.findOne({ gameID: gameID });
                    
        game.players.push(player); //adiciona nome e palavras
        await game.save();
        
        return res.status(200).json({ message: "Palavras submetidas com sucesso" });

    } catch (error) {
        return res.status(500).send("Ocorreu um erro ao submeter as palavras");
    }
};



const LM_STUDIO_URL = "http://89.109.76.139:1234/v1/chat/completions";
const axios = require("axios");

const createAIText = async function(req, res) {
    const username = req.user.username;
    const gameID = req.body.gameID;
    

    try{
        const game = await Played.findOne({ gameID: gameID });
        const theme = game.theme;


        if (game) {
            const player = game.players.find(p => p.username === username);


            if (player) {
                
                const words = player.words;

                let prompt = `Escreve um texto sobre o tema ${theme}, usando palavras ${words}. Coloca a apenas a resposta final e a mais curta possível. Sem explicações ou raciocinio. Sem "#" ou formatação.`;
                
                const payload = {
                      messages: [
                        {
                          role: "user", // O papel do remetente (no caso, o usuário)
                          content: prompt, // O conteúdo enviado pelo usuário
                        },
                      ],
                      model: "llama-3.2-1b-claude-3.7-sonnet-reasoning-distilled",
                      temperature: 0.7,
                      stream: false,
                };

                const lmResponse = await axios.post(LM_STUDIO_URL, payload);
            
                
                const content = lmResponse.data.choices[0].message.content;


                player.text = content;
                await game.save();
                
            }


            return res.status(200).json({ message: "Texto gerado com sucesso" });

        }







    
    } catch (error) {
        return res.status(500).send(error);
    }
};




const getTexts = async function(req, res) {
    const gameID = req.params.id;

    try {
        const game = await Played.findOne({ gameID: gameID });
                    
        const texts = game.players.map(player => ({
            username: player.username,
            text: player.text
        }));

        return res.json({ texts });
        
    } catch (error) {
        return res.status(500).send(error);
    }
};



const roomsVotes = {}
const receiveVotes = async function(req, res) {

    const { selectedAnswers, roomID } = req.body;

    if (!roomsVotes[roomID]) {
        roomsVotes[roomID] = {};
      }
    
      for (const [targetPlayer, scoreStr] of Object.entries(selectedAnswers)) {
        const score = parseInt(scoreStr);
    
        if (!roomsVotes[roomID][targetPlayer]) {
          roomsVotes[roomID][targetPlayer] = 0;
        }
        
        roomsVotes[roomID][targetPlayer] += score;
      }
        res.json({ message: 'Votos recebidos' });
  };




const calculateStats = async function (req, res) {
  const { roomID } = req.body;

  if (!roomsVotes[roomID]) {
    return res.status(200).json({});
    //já foi apagado porque outra pessoa já comecou os calculos 
  }

  const votesCopy = { ...roomsVotes[roomID] }; // copia do objeto geral para um apenas desta sala

  delete roomsVotes[roomID]; //apaga esta sala do objeto geral

  const game = await Played.findOne({ gameID: gameID }); // procura as estatisticas do jogo

  game.finished = true; //guarda o jogo como terminado
  await game.save();

  const sortedVotes = Object.entries(votesCopy).sort((a, b) => b[1] - a[1]); // dar sort no array de votos do menor para o maior
  
    // lugares de cada jogador
   game.players.forEach(player => {
        const index = sortedVotes.findIndex(([username]) => username === player.username);
        if (index !== -1) {
        player.position = index + 1; //atribui o lugar do jogador na bd
        }
        try {
            player.points = sortedVotes[index][1];  //para não dar erro quando não tem pontos
        } catch (error) {
            player.points = 0;
        }
    });



    try {
        
        const numberOfPlayers = sortedVotes.length;
        let words_submitted = 0;
        let total_characters = 0; 
        
        //percorre o array e conta para cada jogador quantas palavras escreveu
        game.players.forEach(async player => {
            const wordCount = player.words.length;
            const totalCharacters = player.words.join('').length;
            
            //stats globais do jogo
            words_submitted+=wordCount;
            total_characters+=totalCharacters;
            
            const userInfo = await UserInfo.findOne({username: player.username}); //procura o userinfo usando o username
            const profile = await Profile.findOne({username: player.username}); //procura o userinfo usando o username
            const playerStats = await PlayerStats.findOne({ user: userInfo });  //procura o playerStats usando o userInfo
            
            //atualizar stats de cada jogador
            
            playerStats.total_words_contributed += wordCount; //total de palavras
            
            if(playerStats.total_words_in_a_game < wordCount){  //máximo de palavras
                playerStats.total_words_in_a_game = wordCount;
            }
            
            playerStats.games_played += 1;          // incrementar jogos jogados

            playerStats.games_played += 1;

            if (playerStats.games_played % 3 === 0 && profile.level < 100) {
                profile.level += 1;
            }

            profile.last_seen = Date.now();

            await profile.save();

            
            await playerStats.save();  // já é guardado para evitar problemas com divisões com 0
            
            playerStats.average_words_per_game = playerStats.total_words_contributed / playerStats.games_played; //calcula média de palavras por jogo
            
            playerStats.average_words_per_game = parseFloat(playerStats.average_words_per_game.toFixed(2)); //apenas permite duas casas decimais

            if(player.position == 1){ // se ficou em primeiro lugar incrementa essa estatistica
                playerStats.best_ranked_ai_text += 1; 
            }
            else if(player.position == numberOfPlayers ){ //se ficou em ultimo incrementa essa estatistica
                playerStats.worst_ranked_ai_text +=1;
            }
            
            await playerStats.save();// já é guardado para evitar problemas com divisões com 0
            
            playerStats.win_rate = (playerStats.best_ranked_ai_text / playerStats.games_played) * 100; //calculo de win rate
            
            playerStats.win_rate = parseFloat(playerStats.win_rate.toFixed(2)); //

            await playerStats.save();//apenas permite duas casas decimais
        });
        // guardar este jogo
        await game.save();
        
        
        //stats do jogo em geral
        const gameStats = await GameStats.findOne({});
        
        gameStats.total_words_submitted += words_submitted; //incrementa stats gerais
        gameStats.total_games_played += 1; //incrementa jogos jogados no total
        
        await gameStats.save();
        
    } catch (error) {
        return res.status(500).json({error});         
    }
        
  return res.status(200).json({});
};




const getResults = async function(req, res) {
    const gameID = req.params.id;

    try {
        const game = await Played.findOne({ gameID: gameID });
        
        const room = await Room.findOne({ _id: gameID });
        const allowedReentriesCount = room?.allowed_reentries?.length || 0;

        return res.json({ 
            game: {
                ...game.toObject(),
                allowedReentriesCount: allowedReentriesCount
            }
        });
        
    } catch (error) {
        return res.status(500).send(error);
    }
};

const getRoom = async function(req, res) {
  const roomID = req.params.id;

  try {
    const room = await Room.findById(roomID);
    if (!room) return res.status(404).json({ error: "Sala não encontrada" });

    res.json({ room });
  } catch (err) {
    res.status(500).send(err);
  }
};



module.exports = {
    getGame,
    getUsername,
    getGamePartial,
    getUserImageByUsername,
    getFollowing,
    followUser,
    getGameState,
    submitWords,
    createAIText,
    getTexts,
    receiveVotes,
    calculateStats,
    getResults,
    getRoom
};