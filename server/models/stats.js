const mongoose = require("mongoose");

const playerStatsSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "UserInfo", required: true, unique: true },
    total_words_contributed: { type: Number, default: 0 },
    max_words_in_a_game: { type: Number, default: 0 },
    average_words_per_game: { type: Number, default: 0 },
    games_played: { type: Number, default: 0 },
    best_ranked_ai_text: { type: Number, default: 0 },
    worst_ranked_ai_text: { type: Number, default: 0 },
    win_rate: { type: Number, default: 0 }
});

const gameStatsSchema = new mongoose.Schema({
    total_words_submitted: { type: Number, default: 0 },
    total_games_played: { type: Number, default: 0 },
  });

const PlayerStats = mongoose.model("PlayerStats", playerStatsSchema);
const GameStats = mongoose.model("GameStats", gameStatsSchema);


//traduções dos nomes apropriados para a base de dados para nomes em português que podem ser expostos na site
const playerStatsTranslations = {
    total_words_contributed: 'Palavras contribuídas',
    max_words_in_a_game: 'Mais palavras num só jogo',
    average_words_per_game: 'Média de palavras por jogo',
    games_played: 'Jogos jogados',
    best_ranked_ai_text: 'Vitórias',
    worst_ranked_ai_text: 'Votado como pior texto',
    win_rate: 'Taxa de vitória (%)'
  };

const gameStatsTranslations = {
    total_words_submitted: 'Palavras submetidas',
    total_games_played: 'Jogos jogados',
  };


module.exports = { PlayerStats, GameStats, playerStatsTranslations, gameStatsTranslations };