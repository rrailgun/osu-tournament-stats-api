import express from "express";
import scoresController from "../controller/scores.controller";


const scoresRouter = express.Router();

scoresRouter.post("/query", scoresController.getScores);

export default scoresRouter;