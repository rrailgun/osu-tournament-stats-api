import { Request, Response } from "express";
import { Player } from "../models/player.model";
import db from "../db";
import { checkForErrors } from "../util/redirect.util";
import { body, query } from "express-validator";
import { Client, LegacyClient } from "osu-web.js";
import pgPromise from "pg-promise";

class TournamentController {

    async getTournamentList(req: Request, res: Response) {
        await query('query').optional().isString().withMessage('Query must be a string').run(req);
        if (await checkForErrors(req, res)) return;

        let where = req.query.query || '';
        let dbQuery = req.query.query ? db.any('SELECT * FROM public."Tournament" WHERE name ILIKE $1', '%' + where + '%') : db.any('SELECT * FROM public."Tournament"')
        dbQuery.then((queryRes: Player[]) => {
            res.send(queryRes)
        })
    }

    async createTournament(req: Request, res: Response) {
        await body('name').notEmpty().isString().withMessage('Name must be a string').run(req);
        if (await checkForErrors(req, res)) return;
        let user: any = req.user;
        let result = await db.one(`INSERT INTO "Tournament" (name, creator)VALUES ($1, $2)RETURNING *`, [req.body.name!, user!.player_id]);
        res.status(201).json(result);
    }

    async addMpLinks(req: Request, res: Response) {
        console.log(req.body)
        await Promise.all([
            body('mpLinks')
                .isArray({ min: 1 }).withMessage('mpLinks must be a non-empty array')
                .bail()
                .custom((arr: any[]) => arr.every(item => typeof item === 'string')).withMessage('Each item in mpLinks must be a string')
                .run(req),

            body('tournamentId')
                .isString().withMessage('tournamentId must be an integer')
                .run(req),

            body('round')
                .isString().withMessage('round must be a string')
                .notEmpty().withMessage('round cannot be empty')
                .run(req)
        ]);
        if (await checkForErrors(req, res)) return;
        let api = new LegacyClient(process.env.OSU_LEGACY_API!)
        let mpLinks: number[] = req.body.mpLinks;
        let tournamentId: number = req.body.tournamentId;
        let round: string = req.body.round;

        res.status(202).send({status: 'PENDING'});
        setImmediate(async () => {
            let pgp = pgPromise();
            let matches = [];
            for (let multId of mpLinks) {
                let match = await api.getMultiplayerLobby({ mp: multId });
                matches.push(match);
                console.log(match);
            }
            let matchesTableInfo = matches.map(mp => ({ id: mp?.match.match_id, name: mp?.match.name }))
            let matchColumns = new pgp.helpers.ColumnSet(
                ['id', 'name'],
                { table: 'Match' }
            );
            db.none(pgp.helpers.insert(matchesTableInfo, matchColumns)+ ' ON CONFLICT (id) DO NOTHING');
        });



    }
}

export default new TournamentController();