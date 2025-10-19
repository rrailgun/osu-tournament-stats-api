import { Request, Response } from "express";
import { Player } from "../models/player.model";
import db from "../db";
import { checkForErrors } from "../util/redirect.util";
import { body, query } from "express-validator";
import { Client, LegacyClient } from "osu-web.js";
import pgPromise from "pg-promise";
import { calculateAccuracy } from "../util/calc.util";

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
        await db.one('INSERT INTO "User" (id, username) VALUES($1, $2) ON CONFLICT (id) DO NOTHING', [user!.player_id, user!.username])
        let result = await db.one(`INSERT INTO "Tournament" (name, creator)VALUES ($1, $2)RETURNING *`, [req.body.name, user!.player_id]);
        res.status(201).json(result);
    }

    async createRound(req: Request, res: Response) {
        await Promise.all([
            body('name').notEmpty().isString().withMessage('Name must be a string').run(req),
            body('tournamentId').notEmpty().isString().withMessage('tournamentId must be a string').run(req)
        ])
        if (await checkForErrors(req, res)) return;
        let result = await db.one(`INSERT INTO "Round" (round_name, tournament_id)VALUES ($1, $2)RETURNING *`, [req.body.name, req.body.tournamentId]);
        res.status(201).json(result);
    }

    async addMpLinks(req: Request, res: Response) {
        await Promise.all([
            body('mpLinks')
                .isArray({ min: 1 }).withMessage('mpLinks must be a non-empty array')
                .bail()
                .custom((arr: any[]) => arr.every(item => typeof item === 'string')).withMessage('Each item in mpLinks must be a string')
                .run(req),

            body('tournamentId')
                .isString().withMessage('tournamentId must be an integer')
                .notEmpty().withMessage('tournamentId cannot be empty')
                .run(req),

            body('roundId')
                .isString().withMessage('roundId must be a string')
                .notEmpty().withMessage('roundId cannot be empty')
                .run(req)
        ]);
        if (await checkForErrors(req, res)) return;
        let api = new LegacyClient(process.env.OSU_LEGACY_API!)
        let mpLinks: number[] = req.body.mpLinks;
        let tournament_id: number = req.body.tournamentId;
        let round_id: string = req.body.roundId;

        res.status(202).send({ status: 'PENDING' });
        setImmediate(async () => {
            let pgp = pgPromise();
            let matches = [];
            let scores = [];
            for (let match_id of mpLinks) {
                let match = await api.getMultiplayerLobby({ mp: match_id });
                matches.push(match);
                for (let game of match!.games) {
                    for (let score of game.scores) {
                        let count300 = score.count300
                        let count100 = score.count100
                        let count50 = score.count50
                        let countmiss = score.countmiss

                        let row = {
                            tournament_id,
                            match_id,
                            player_id: score.user_id,
                            beatmap_id: game.beatmap_id,
                            score: score.score,
                            count300,
                            count100,
                            count50,
                            countmiss,
                            combo: score.maxcombo,
                            mods: score.enabled_mods,
                        };
                        scores.push(row);
                    }
                }
            }
            let matchesTableInfo = matches.map(mp => ({ match_id: mp?.match.match_id, match_name: mp?.match.name, round_id: round_id }))
            let matchColumns = new pgp.helpers.ColumnSet(
                ['match_id', 'match_name', 'round_id'],
                { table: 'Match' }
            );
            let scoreColumns = new pgp.helpers.ColumnSet([
                'tournament_id',
                'match_id',
                'player_id',
                'beatmap_id',
                'score',
                'count300',
                'count100',
                'count50',
                'countmiss',
                'combo',
                'mods',
            ], {
                table: 'Scores'
            });
            db.none(pgp.helpers.insert(matchesTableInfo, matchColumns) + ' ON CONFLICT (match_id) DO NOTHING');
            // db.none(pgp.helpers.insert(scores, scoreColumns) + `ON CONFLICT (tournament_id, match_id, player_id, beatmap_id) DO NOTHING`);
            for (let score of scores) {
                try {
                    await db.none(pgp.helpers.insert(score, scoreColumns) + `ON CONFLICT (tournament_id, match_id, player_id, beatmap_id) DO NOTHING`);
                }
                catch (e) {
                    console.log(e)
                }
            }
        });
    }
}

export default new TournamentController();