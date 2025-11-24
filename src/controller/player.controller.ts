import { Request, Response } from "express";
import { Player } from "../models/player.model";
import db from "../db";
import { query } from "express-validator";
import { checkForErrors } from "../util/redirect.util";
import { Client, UserExtended } from "osu-web.js";

class PlayerController {

    async getSelfInfo(req: Request, res: Response) {
        try {
            let api = new Client(req.token!);
            let userResponse: UserExtended = await api.users.getSelf();
            res.send({
                username: userResponse.username,
                player_id: userResponse.id
            })
        }
        catch (err) {
            res.status(500).send({ error: 'Failed to fetch user info' });
        }
    }

    async getPlayerList(req: Request, res: Response) {
        await query('query').optional().isString().withMessage('Query must be a string').run(req);
        if (await checkForErrors(req, res)) return;

        let where = req.query.query || '';
        let dbQuery = req.query.query ? db.any('SELECT * FROM public."Player" WHERE name ILIKE $1', '%' + where + '%') : db.any('SELECT * FROM public."Player"')
        dbQuery.then((queryRes: Player[]) => {
            res.send(queryRes)
        })
    }
}

export default new PlayerController();