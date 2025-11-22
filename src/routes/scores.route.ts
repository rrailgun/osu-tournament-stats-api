import express from "express";
import scoresController from "../controller/scores.controller";


const scoresRouter = express.Router();

scoresRouter.post("/query", scoresController.getScores);
scoresRouter.post("/groupedQuery", scoresController.getScoresGrouped);
scoresRouter.post("/query/group/beatmap", scoresController.getScoresGroupedByBeatmap);

export default scoresRouter;