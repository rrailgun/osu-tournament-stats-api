import express from "express";
import tournamentController from "../controller/tournament.controller";
import isBasicAuthenticated from "../middleware/auth";

const tournamentRouter = express.Router();

tournamentRouter.get("/search", isBasicAuthenticated, tournamentController.getTournamentList);
tournamentRouter.post('/createTournament', isBasicAuthenticated, tournamentController.createTournament);
// tournamentRouter.post("/addMpLinks", isBasicAuthenticated, tournamentController.addMpLinks);
tournamentRouter.post("/addMpLinks", tournamentController.addMpLinks);
tournamentRouter.post("/createRound", tournamentController.createRound);


export default tournamentRouter;