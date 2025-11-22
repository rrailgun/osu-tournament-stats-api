import { Request, Response } from "express";
import db from "../db";
import { body } from "express-validator";
import { Client } from "osu-web.js";
import { BeatmapColumns, MatchColumns, PoolColumns, ScoreColumns, UserColumns } from "../enum/columns.enum";
import { Tables } from "../enum/tables.enum";
import pgPromise from "pg-promise";
import { MatchResponse, MatchUser, Game } from "../models/match.model";
import { checkForErrors } from "../util/redirect.util";


class RoundController {
    async getRounds(req: Request, res: Response) {
        try {
            const rounds = await db.any(`SELECT * FROM public."${Tables.ROUND}"`);
            res.status(200).json(rounds);
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async getPoolByRound(req: Request, res: Response) {
        await body('roundId').isString().withMessage('roundId must be a string').run(req);
        if (await checkForErrors(req, res)) return;
        let roundId = req.body.roundId;
        let pool = await db.any(`SELECT * FROM public."${Tables.POOL}" WHERE ${PoolColumns.ROUND_ID} = $1`, [roundId]);
        res.status(200).json(pool);
    }

    async addBeatmapsToPool(req: Request, res: Response) {
        try {
            await Promise.all([
                body('roundId').isString().withMessage('roundId must be a string').run(req),
                body('beatmapIds').isArray({ min: 1 }).withMessage('beatmapIds must be a non-empty array').run(req),
                body('beatmapIds.*.beatmapId').isInt().withMessage('Each beatmapId must be an integer').run(req),
                body('beatmapIds.*.slot').isString().withMessage('Each slot must be a string').run(req)
            ]);
            let pgp = pgPromise();
            let roundId = req.body.roundId;
            let beatmaps = req.body.beatmapIds.map((b: any) => ({ beatmap_id: b.beatmapId, round_id: roundId, ...b }));
            let user: any = req.user;
            let apiV2 = new Client(user.token)
            let beatmapsInfo = (await apiV2.beatmaps.getBeatmaps({
                query: {
                    ids: beatmaps.map((b: any) => b.beatmapId)
                }
            })).map(beatmap => ({
                id: beatmap.id,
                artist: beatmap.beatmapset.artist,
                title: beatmap.beatmapset.title,
                creator: beatmap.beatmapset.creator,
                difficulty_rating: beatmap.difficulty_rating,
                [BeatmapColumns.DIFFICULTY_NAME]: beatmap.version,
                [BeatmapColumns.BEATMAPSET_ID]: beatmap.beatmapset_id
            }))

            let beatmap_columns = new pgp.helpers.ColumnSet([
                BeatmapColumns.ID,
                BeatmapColumns.ARTIST,
                BeatmapColumns.CREATOR,
                BeatmapColumns.TITLE,
                BeatmapColumns.DIFFICULTY_RATING,
                BeatmapColumns.DIFFICULTY_NAME,
                BeatmapColumns.BEATMAPSET_ID
            ], {
                table: Tables.BEATMAP
            });
            db.none(pgp.helpers.insert(beatmapsInfo, beatmap_columns) + ' ON CONFLICT ("id") DO NOTHING');

            let pool_columns = new pgp.helpers.ColumnSet([
                PoolColumns.SLOT,
                PoolColumns.ROUND_ID,
                PoolColumns.BEATMAP_ID
            ], {
                table: Tables.POOL
            });
            db.none(pgp.helpers.insert(beatmaps, pool_columns) + ' ON CONFLICT ("round_id", "slot") DO NOTHING');
            res.status(200).json({ status: 'Beatmaps added to pool' });
        }
        catch (error) {
            console.log(error)
            return res.status(400).json({ error: 'Invalid input data', log: error });
        }
    }

    async addMpLinks(req: Request, res: Response) {
        await Promise.all([
            body('mpLinks')
                .isArray({ min: 1 }).withMessage('mpLinks must be a non-empty array')
                .run(req),
            body('mpLinks.*')
                .isInt().withMessage('Each MP link must be an integer')
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
        let round_id: string = req.body.roundId;
        let poolBeatmaps: number[] =
            (await db.any(
                'SELECT beatmap_id FROM "Pool" WHERE round_id = $1',
                [round_id]
            )).map(b => b.beatmap_id);

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
                    // skip if this beatmap isnt in the pool
                    if (!poolBeatmaps.includes(game.beatmap_id)) continue;
                    for (let score of game.scores) {
                        let row = {
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
            let matchesTableInfo = matches.map(mp => ({ match_id: mp?.match.id, match_name: mp?.match.name, round_id: round_id }))
            let matchColumns = new pgp.helpers.ColumnSet(
                [MatchColumns.MATCH_ID, MatchColumns.MATCH_NAME, MatchColumns.ROUND_ID],
                { table: Tables.MATCH }
            );
            let scoreColumns = new pgp.helpers.ColumnSet([
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
            try {
                // Temporary - will eventually be its own endpoint to add players (and set teams) to a tournament
                db.none(pgp.helpers.insert(Array.from(users.values()), userColumns) + `ON CONFLICT (id) DO UPDATE SET
                username = EXCLUDED.username,
                country_code = EXCLUDED.country_code,
                country_name = EXCLUDED.country_name
                `);
                db.none(pgp.helpers.insert(matchesTableInfo, matchColumns) + ' ON CONFLICT (match_id) DO NOTHING');
                db.none(pgp.helpers.insert(scores, scoreColumns) + `ON CONFLICT (match_id, player_id, beatmap_id) DO NOTHING`);
            } catch (error) {
                console.log(error)
            }
        });
    }
}


export default new RoundController();