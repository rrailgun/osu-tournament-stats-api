import express from "express";
import playerController from "../controller/player.controller";

const playerRouter = express.Router();

playerRouter.get("/search", playerController.getPlayerList);

export default playerRouter;