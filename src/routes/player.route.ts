import express from "express";
import playerController from "../controller/player.controller";
import isBasicAuthenticated from "../middleware/auth";

const playerRouter = express.Router();

playerRouter.get("/search", playerController.getPlayerList);
playerRouter.get('/getSelf', isBasicAuthenticated, playerController.getSelfInfo)

export default playerRouter;