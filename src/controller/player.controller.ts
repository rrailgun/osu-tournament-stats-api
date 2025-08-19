import { Request, Response } from "express";
import { Player } from "../models/player.model";
import db from "../db";

class PlayerController {

    getPlayerList(req: Request, res: Response) {
        let where = req.query.query || '';
        let dbQuery = req.query.query ? db.any('SELECT * FROM public."Player" WHERE name ILIKE $1', '%' + where + '%') : db.any('SELECT * FROM public."Player"')
        dbQuery.then((queryRes: Player[]) => {
            res.send(queryRes)
        })
    }
}

export default new PlayerController();