import express from "express";
import scoresController from "../controller/scores.controller";
import { body } from "express-validator";
import { validateRequest } from "../middleware/validator";
import { ScoresViewColumns } from "../enum/columns.enum";

const scoresRouter = express.Router();

const commonScoresValidation = [
    body('tournamentId').optional().isString(),
    body('playerIds').optional().isArray(),
    body('playerIds.*').optional().isInt(),
    body('beatmapIds').optional().isArray(),
    body('beatmapIds.*').optional().isInt(),
    body('matchIds').optional().isArray(),
    body('matchIds.*').optional().isInt(),
    body('roundId').optional().isString()
];

scoresRouter.post("/query", [
    ...commonScoresValidation,
    validateRequest
], scoresController.getScores);

scoresRouter.post("/groupedQuery", [
    body('groupBy')
        .exists()
        .custom((value) => Object.values(ScoresViewColumns).includes(value as any))
        .withMessage(`groupBy must be one of: [${Object.values(ScoresViewColumns).join(', ')}]`),
    ...commonScoresValidation,
    validateRequest
], scoresController.getScoresGrouped);

scoresRouter.post("/query/group/beatmap", [
    ...commonScoresValidation,
    validateRequest
], scoresController.getScoresGroupedByBeatmap);

export default scoresRouter;