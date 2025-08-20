import express from "express";
import tournamentController from "../controller/tournament.controller";

const tournamentRouter = express.Router();

tournamentRouter.get("/search", tournamentController.getTournamentList);

export default tournamentRouter;