const express = require("express");
const router = express.Router();
const lastGamesController = require("../controllers/lastGamesController");
const ensureAuthenticated = require("../middlewares/authMiddleware"); // para verificar se o utilizador está autenticado antes de permitir o acesso às rotas

router.get("/last-games", ensureAuthenticated , lastGamesController.getLastGames);

module.exports = router;