import express from "express";
import isBasicAuthenticated from "../middleware/auth";
import roundController from "../controller/round.controller";
import { body } from "express-validator";
import { validateRequest } from "../middleware/validator";

const roundRouter = express.Router();

roundRouter.get("/search", roundController.getRounds);
roundRouter.post("/pool", [
    body('roundId').isString().withMessage('roundId must be a string'),
    validateRequest
], roundController.getPoolByRound);

roundRouter.post('/addBeatmaps', [
    isBasicAuthenticated,
    body('roundId').isString().withMessage('roundId must be a string'),
    body('beatmapIds').isArray({ min: 1 }).withMessage('beatmapIds must be a non-empty array'),
    body('beatmapIds.*.beatmapId').isInt().withMessage('Each beatmapId must be an integer'),
    body('beatmapIds.*.slot').isString().withMessage('Each slot must be a string'),
    validateRequest
], roundController.addBeatmapsToPool);

roundRouter.post("/addMpLinks", [
    isBasicAuthenticated,
    body('mpLinks').isArray({ min: 1 }).withMessage('mpLinks must be a non-empty array'),
    body('mpLinks.*').isInt().withMessage('Each MP link must be an integer'),
    body('roundId').isString().withMessage('roundId must be a string').notEmpty().withMessage('roundId cannot be empty'),
    validateRequest
], roundController.addMpLinks);

export default roundRouter;