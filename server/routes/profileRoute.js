const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");

router.get("/profile", profileController.getError);
router.get("/profile/:id", profileController.getProfile); //id = username


//id = id do jogador para todas as rotas a baixo
router.patch("/profile/follow-player/:id", profileController.followPlayer);
router.patch("/profile/unfollow-player/:id", profileController.unfollowPlayer);

router.patch("/profile/write-comment/:id", profileController.writeComment);

router.patch("/profile/delete-comment/:id", profileController.deleteComment);


module.exports = router;


