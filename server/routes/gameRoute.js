// gameRoute.js
const express = require("express");
const router = express.Router();
const gameController = require("../controllers/gameController");
const ensureAuthenticated = require("../middlewares/authMiddleware"); // para verificar se o utilizador está autenticado antes de permitir o acesso às rotas

router.get("/game", ensureAuthenticated, gameController.getGame);
router.post('/game', ensureAuthenticated, gameController.submitWords);
router.get("/partials/game/:partial", ensureAuthenticated, gameController.getGamePartial);
router.get("/game/getUsername", ensureAuthenticated, gameController.getUsername);
router.get("/game/getUserImage", ensureAuthenticated, gameController.getUserImageByUsername);
router.get("/game/getFollowing", ensureAuthenticated, gameController.getFollowing);
router.post("/game/follow", ensureAuthenticated, gameController.followUser);
router.get("/game/getGameState", ensureAuthenticated, gameController.getGameState);
router.get("/game/get-texts/:id", ensureAuthenticated, gameController.getTexts);
router.post("/game/create-text", ensureAuthenticated, gameController.createAIText);
router.post("/game/submit-votes", ensureAuthenticated, gameController.receiveVotes);
router.post("/game/calculate-stats", ensureAuthenticated, gameController.calculateStats);
router.get("/game/get-results/:id", ensureAuthenticated, gameController.getResults);
router.get("game/room/:id", ensureAuthenticated, gameController.getRoom);


  module.exports = router;










































