// preGameController.js
const { Profile } = require("../models/users.js"); // importa o modelo profile para poder fazer queries à base de dados (no caso, username)
const getPreGame = function(req, res) {
    res.render("pre-game", { user: req.user });
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

module.exports = { getPreGame, getUsername };