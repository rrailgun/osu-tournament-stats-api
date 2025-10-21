import { Request, Response } from "express";
import { Player } from "../models/player.model";
import db from "../db";
import { checkForErrors } from "../util/redirect.util";
import { body, query } from "express-validator";
import { Client, LegacyClient } from "osu-web.js";
import pgPromise from "pg-promise";
import { Game, MatchResponse, MatchUser } from "../models/match.model";
import { MatchColumns, RoundColumns, ScoreColumns, UserColumns } from "../enum/columns.enum";
import { Tables } from "../enum/tables.enum";

class TournamentController {

    async getTournamentDetails(req: Request, res: Response) {
        let result = await db.one(`
            SELECT
                t.*,
                COALESCE(
                    json_agg(
                        jsonb_build_object('round_id', r.round_id, 'round_name', r.round_name)
                    )
                ) AS rounds
            FROM public."Tournament" t
            LEFT JOIN public."Round" r ON r.tournament_id = t.id
            WHERE t.id = $1
            GROUP BY t.id
            `, req.params.tournamentId)
        res.send(result)
    }

    async getTournamentList(req: Request, res: Response) {
        await query('query').optional().isString().withMessage('Query must be a string').run(req);
        if (await checkForErrors(req, res)) return;

        let where = req.query.query || '';
        let dbQuery = req.query.query ? db.any('SELECT * FROM public."Tournament" WHERE name ILIKE $1', '%' + where + '%') : db.any('SELECT * FROM public."Tournament"')
        dbQuery.then((queryRes: Player[]) => {
            res.send(queryRes)
        })
    }

    async getRoundsByTournament(tournamentId: string) {
        const rounds = await db.any<{
            round_id: string;
            round_name: string;
        }>(
            `SELECT ${RoundColumns.ROUND_ID}, ${RoundColumns.ROUND_NAME} FROM "${Tables.ROUND}" WHERE ${RoundColumns.TOURNAMENT_ID} = $1`,
            [tournamentId]
        );

        return rounds;
    }

    async createTournament(req: Request, res: Response) {
        await body('name').notEmpty().isString().withMessage('Name must be a string').run(req);
        if (await checkForErrors(req, res)) return;
        let user: any = req.user;
        let result = await db.one(`INSERT INTO "Tournament" (name, creator)VALUES ($1, $2) RETURNING *`, [req.body.name, user!.player_id]);
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
        let user: any = req.user;
        let apiV2 = new Client(user.token)
        let mpLinks: number[] = req.body.mpLinks;
        let tournament_id: number = req.body.tournamentId;
        let round_id: string = req.body.roundId;

        res.status(202).send({ status: 'PENDING' });
        setImmediate(async () => {
            let pgp = pgPromise();
            let matches: MatchResponse[] = [];
            let scores = [];
            let users: Map<number, MatchUser> = new Map<number, MatchUser>();
            for (let match_id of mpLinks) {
                let match: MatchResponse = await apiV2.getUndocumented('matches/' + match_id);
                match.users.forEach(user => {
                    users.set(user.id, user);
                })
                let games: Game[] = match.events.map(event => event.game).filter(game => game !== undefined);
                matches.push(match);
                for (let game of games) {
                    for (let score of game.scores) {
                        let row = {
                            tournament_id,
                            match_id,
                            player_id: score.user_id,
                            beatmap_id: game.beatmap_id,
                            score: score.score,
                            accuracy: score.accuracy,
                            count300: score.statistics.count_300,
                            count100: score.statistics.count_100,
                            count50: score.statistics.count_50,
                            countmiss: score.statistics.count_miss,
                            combo: score.max_combo,
                            mods: score.mods,
                            rank: score.rank,
                            date: score.created_at
                        };
                        scores.push(row);
                    }
                }
            }
            let userColumns = new pgp.helpers.ColumnSet([
                UserColumns.ID,
                UserColumns.USERNAME,
                { name: UserColumns.COUNTRY_CODE, init: (v: any) => v.source.country.code },
                { name: UserColumns.COUNTRY_NAME, init: (v: any) => v.source.country.name },
            ], {
                table: Tables.USER
            });

            db.none(pgp.helpers.insert(Array.from(users.values()), userColumns) + `ON CONFLICT (id) DO UPDATE SET
                username = EXCLUDED.username,
                country_code = EXCLUDED.country_code,
                country_name = EXCLUDED.country_name
                `);
            let matchesTableInfo = matches.map(mp => ({ match_id: mp?.match.id, match_name: mp?.match.name, round_id: round_id }))
            let matchColumns = new pgp.helpers.ColumnSet(
                [MatchColumns.MATCH_ID, MatchColumns.MATCH_NAME, MatchColumns.ROUND_ID],
                { table: Tables.MATCH }
            );
            let scoreColumns = new pgp.helpers.ColumnSet([
                ScoreColumns.TOURNAMENT_ID,
                ScoreColumns.MATCH_ID,
                ScoreColumns.PLAYER_ID,
                ScoreColumns.BEATMAP_ID,
                ScoreColumns.SCORE,
                ScoreColumns.COUNT_300,
                ScoreColumns.COUNT_100,
                ScoreColumns.COUNT_50,
                ScoreColumns.COUNT_MISS,
                ScoreColumns.ACCURACY,
                ScoreColumns.COMBO,
                ScoreColumns.MODS,
                ScoreColumns.RANK,
                ScoreColumns.DATE
            ], {
                table: Tables.SCORES
            });
            db.none(pgp.helpers.insert(matchesTableInfo, matchColumns) + ' ON CONFLICT (match_id) DO NOTHING');
            db.none(pgp.helpers.insert(scores, scoreColumns) + `ON CONFLICT (tournament_id, match_id, player_id, beatmap_id) DO NOTHING`);
        });
    }
}

export default new TournamentController();