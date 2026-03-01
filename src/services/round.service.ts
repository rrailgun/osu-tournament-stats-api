import db from "../db";
import { Tables } from "../enum/tables.enum";
import { PoolColumns, BeatmapColumns, UserColumns, MatchColumns, ScoreColumns } from "../enum/columns.enum";
import pgPromise from "pg-promise";
import { Client } from "osu-web.js";
import { MatchResponse, MatchUser, Game } from "../types/match.model";

export class RoundService {
    static async getRounds() {
        return db.any(`SELECT * FROM public."${Tables.ROUND}"`);
    }

    static async getPoolByRound(roundId: string) {
        return db.any(`SELECT * FROM public."${Tables.POOL}" WHERE ${PoolColumns.ROUND_ID} = $1`, [roundId]);
    }

    static async addBeatmapsToPool(roundId: string, beatmapRequests: any[], token: string) {
        let pgp = pgPromise();
        let beatmaps = beatmapRequests.map((b: any) => ({ beatmap_id: b.beatmapId, round_id: roundId, ...b }));
        let apiV2 = new Client(token);
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
        }));

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
        await db.none(pgp.helpers.insert(beatmapsInfo, beatmap_columns) + ' ON CONFLICT ("id") DO NOTHING');

        let pool_columns = new pgp.helpers.ColumnSet([
            PoolColumns.SLOT,
            PoolColumns.ROUND_ID,
            PoolColumns.BEATMAP_ID
        ], {
            table: Tables.POOL
        });
        await db.none(pgp.helpers.insert(beatmaps, pool_columns) + ' ON CONFLICT ("round_id", "slot") DO NOTHING');
    }

    static async addMpLinks(roundId: string, mpLinks: number[], token: string) {
        let apiV2 = new Client(token);
        let poolBeatmaps: number[] =
            (await db.any(
                'SELECT beatmap_id FROM "Pool" WHERE round_id = $1',
                [roundId]
            )).map(b => b.beatmap_id);

        setImmediate(async () => {
            let pgp = pgPromise();
            let matches: MatchResponse[] = [];
            let scores: any[] = [];
            let users: Map<number, MatchUser> = new Map<number, MatchUser>();
            for (let match_id of mpLinks) {
                let match: MatchResponse = await apiV2.getUndocumented('matches/' + match_id);
                match.users.forEach(user => {
                    users.set(user.id, user);
                })
                let games: Game[] = match.events.map(event => event.game).filter(game => game !== undefined);
                matches.push(match);
                for (let game of games) {
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
            let matchesTableInfo = matches.map(mp => ({ match_id: mp?.match.id, match_name: mp?.match.name, round_id: roundId }))
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
                await db.none(pgp.helpers.insert(Array.from(users.values()), userColumns) + `ON CONFLICT (id) DO UPDATE SET
                username = EXCLUDED.username,
                country_code = EXCLUDED.country_code,
                country_name = EXCLUDED.country_name
                `);
                await db.none(pgp.helpers.insert(matchesTableInfo, matchColumns) + ' ON CONFLICT (match_id) DO NOTHING');
                if (scores.length > 0) {
                    await db.none(pgp.helpers.insert(scores, scoreColumns) + `ON CONFLICT (match_id, player_id, beatmap_id) DO NOTHING`);
                }
            } catch (error) {
                console.log(error);
            }
        });
    }
}
