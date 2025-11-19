import express from "express";
import isBasicAuthenticated from "../middleware/auth";
import roundController from "../controller/round.controller";

const roundRouter = express.Router();

roundRouter.get("/search", roundController.getRounds);
roundRouter.post("/pool", roundController.getPoolByRound);
roundRouter.post('/addBeatmaps', isBasicAuthenticated, roundController.addBeatmapsToPool)
roundRouter.post("/addMpLinks", isBasicAuthenticated, roundController.addMpLinks);


export default roundRouter;