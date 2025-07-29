// preGameRoute.js
const express = require("express");
const router = express.Router();
const preGameController = require("../controllers/preGameController");
const ensureAuthenticated = require("../middlewares/authMiddleware"); // para verificar se o utilizador está autenticado antes de permitir o acesso às rotas

router.get("/pre-game", ensureAuthenticated, preGameController.getPreGame);
router.get("/pre-game/getUsername", ensureAuthenticated, preGameController.getUsername);

module.exports = router;