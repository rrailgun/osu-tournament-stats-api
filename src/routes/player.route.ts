import express from "express";
import playerController from "../controller/player.controller";
import isBasicAuthenticated from "../middleware/auth";
import { query } from "express-validator";
import { validateRequest } from "../middleware/validator";

const playerRouter = express.Router();

playerRouter.get("/search", [
    query('query').optional().isString().withMessage('Query must be a string'),
    validateRequest
], playerController.getPlayerList);
playerRouter.get('/getSelf', isBasicAuthenticated, playerController.getSelfInfo)

export default playerRouter;