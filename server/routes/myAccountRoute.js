const express = require("express");
const router = express.Router();
const myAccountController = require("../controllers/myAccountController");


router.get("/my-account", myAccountController.getMyAccount); 
router.get("/my-account/JSON", myAccountController.getMyAccountJSON);

//id = id do jogador para todas as rotas a baixo
router.patch("/my-account/fotos/:id", myAccountController.editPhotos);

router.patch("/my-account/username/:id", myAccountController.editUsername);

router.patch("/my-account/bio/:id", myAccountController.editBio); 

router.patch("/my-account/location/:id", myAccountController.editLocation);

router.patch("/my-account/email/:id", myAccountController.editEmail);

router.patch("/my-account/password/:id", myAccountController.editPassword);


module.exports = router;
