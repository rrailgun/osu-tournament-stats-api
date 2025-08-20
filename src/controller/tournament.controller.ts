import { Request, Response } from "express";
import { Player } from "../models/player.model";
import db from "../db";
import { checkForErrors } from "../util/redirect.util";
import { query } from "express-validator";

class TournamentController {

    async getTournamentList(req: Request, res: Response) {
        await query('query').optional().isString().withMessage('Query must be a string').run(req);
        if (checkForErrors(req,res)) return;
        
        let where = req.query.query || '';
        let dbQuery = req.query.query ? db.any('SELECT * FROM public."Tournament" WHERE name ILIKE $1', '%' + where + '%') : db.any('SELECT * FROM public."Tournament"')
        dbQuery.then((queryRes: Player[]) => {
            res.send(queryRes)
        })
    }
}

export default new TournamentController();