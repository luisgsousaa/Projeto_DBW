const Played = require("../models/played.js");

const getLastGames = async function(req, res) {

    const played = await Played.find().sort({ timestamp: -1 }); //mete os mais recentes primeiro



    //organiza os arrays de players pelo lugar que ficaram 
    played.forEach(game => {
        if (game.players && Array.isArray(game.players)) {
            game.players.sort((a, b) => a.position - b.position);
        }
    })




    res.render("last-games", { user: req.user, played });





};

module.exports = { getLastGames };