import express from "express";
import tournamentController from "../controller/tournament.controller";
import isBasicAuthenticated from "../middleware/auth";
import { body, query } from "express-validator";
import { validateRequest } from "../middleware/validator";

const tournamentRouter = express.Router();

tournamentRouter.get("/search", [
    query('query').optional().isString().withMessage('Query must be a string'),
    validateRequest
], tournamentController.getTournamentList);
tournamentRouter.post('/createTournament', [
    isBasicAuthenticated,
    body('name').notEmpty().isString().withMessage('Name must be a string'),
    validateRequest
], tournamentController.createTournament);
tournamentRouter.get('/:tournamentId', tournamentController.getTournamentDetails);
tournamentRouter.get('/:tournamentId/rounds', tournamentController.getRoundsByTournament);
tournamentRouter.post("/createRound", [
    body('name').notEmpty().isString().withMessage('Name must be a string'),
    body('tournamentId').notEmpty().isString().withMessage('tournamentId must be a string'),
    validateRequest
], tournamentController.createRound);

export default tournamentRouter;