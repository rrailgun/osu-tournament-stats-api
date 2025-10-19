import { body } from "express-validator";
import db from "../db";
import { Player } from "../models/player.model";
import { checkForErrors } from "../util/redirect.util";
import { Request, Response } from "express";

class ScoresController {

    async getScores(req: Request, res: Response) {
        await Promise.all([
            body('tournamentId')
                .optional()
                .isString().withMessage('tournamentId must be an integer')
                .run(req),
            body('playerId')
                .optional()
                .isString().withMessage('playerId must be a string')
                .run(req),
            body('beatmapId')
                .optional()
                .isString().withMessage('beatmapId must be a string')
                .run(req)
        ]);
        if (await checkForErrors(req, res)) return;
        let dbQuery = db.any('SELECT * FROM public."Scores"');
        dbQuery.then((queryRes: Player[]) => {
            res.send(queryRes)
        })
    }
}

export default new ScoresController();