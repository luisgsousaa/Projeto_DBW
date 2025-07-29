const mongoose = require("mongoose");

const playedSchema = new mongoose.Schema({
    theme: String,
    gameID: String,
    finished: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now },
    players: [{
        username: String,
        position: Number,
        points: Number,
        text: String,
        words: [String],
    }],
});

const Played = mongoose.model("Played", playedSchema); // cria modelo

module.exports = Played;