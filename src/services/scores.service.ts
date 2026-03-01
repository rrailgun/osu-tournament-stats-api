import db from "../db";
import { Player } from "../types/player.model";
import { ScoresViewColumns } from "../enum/columns.enum";
import { Views } from "../enum/tables.enum";

export class ScoresService {
    static buildFilters(body: any) {
        const { tournamentId, matchIds, playerIds, beatmapIds, roundId } = body;

        const conditions: string[] = [];
        const params: Record<string, any> = {};

        if (tournamentId) {
            conditions.push(`"${ScoresViewColumns.TOURNAMENT_ID}"::text = $(tournamentId)`);
            params.tournamentId = tournamentId;
        }

        if (roundId) {
            conditions.push(`"${ScoresViewColumns.ROUND_ID}"::text = $(roundId)`);
            params.roundId = roundId;
        }

        if (matchIds?.length) {
            conditions.push(`"${ScoresViewColumns.MATCH_ID}" IN ($(matchIds:csv))`);
            params.matchIds = matchIds;
        }

        if (playerIds?.length) {
            conditions.push(`"${ScoresViewColumns.PLAYER_ID}" IN ($(playerIds:csv))`);
            params.playerIds = playerIds;
        }

        if (beatmapIds?.length) {
            conditions.push(`"${ScoresViewColumns.BEATMAP_ID}" IN ($(beatmapIds:csv))`);
            params.beatmapIds = beatmapIds;
        }

        return { conditions, params };
    }

    static async getScoresGroupedByBeatmap(filters: any) {
        let { conditions, params } = this.buildFilters(filters);
        let query = `
            SELECT
                (
                    jsonb_agg(
                        jsonb_build_object(
                            '${ScoresViewColumns.BEATMAP_ID}', s."${ScoresViewColumns.BEATMAP_ID}",
                            '${ScoresViewColumns.BEATMAP_TITLE}', s."${ScoresViewColumns.BEATMAP_TITLE}",
                            '${ScoresViewColumns.BEATMAP_ARTIST}', s."${ScoresViewColumns.BEATMAP_ARTIST}",
                            '${ScoresViewColumns.BEATMAP_DIFFICULTY_NAME}', s."${ScoresViewColumns.BEATMAP_DIFFICULTY_NAME}",
                            '${ScoresViewColumns.BEATMAP_CREATOR}', s."${ScoresViewColumns.BEATMAP_CREATOR}",
                            '${ScoresViewColumns.BEATMAP_SR}', s."${ScoresViewColumns.BEATMAP_SR}",
                            '${ScoresViewColumns.BEATMAPSET_ID}', s."${ScoresViewColumns.BEATMAPSET_ID}",
                            '${ScoresViewColumns.SLOT}', s."${ScoresViewColumns.SLOT}"
                        )
                    )->0
                ) AS beatmap_info,
                json_agg(s ORDER BY s."${ScoresViewColumns.SCORE}" DESC) AS scores
            FROM public."${Views.SCORES_VIEW}" s
            ${conditions.length ? "WHERE " + conditions.join(" AND ") : ""}
            GROUP BY s."${ScoresViewColumns.BEATMAP_ID}";
            `;
        return db.any(query, params);
    }

    static async getScores(filters: any): Promise<Player[]> {
        const { conditions, params } = this.buildFilters(filters);

        const query = `
            SELECT *
            FROM public."${Views.SCORES_VIEW}" s
            ${conditions.length ? "WHERE " + conditions.join(" AND ") : ""}
            ORDER BY s."${ScoresViewColumns.SCORE}" DESC
        `;

        return db.any(query, params);
    }

    static async getScoresGrouped(filters: any, groupBy: string) {
        const { conditions, params } = this.buildFilters(filters);
        const query = `
            SELECT
                "${groupBy}" AS key,
                '${groupBy}' AS column,
                json_agg(s ORDER BY s."${ScoresViewColumns.SCORE}" DESC) AS rows
            FROM public."${Views.SCORES_VIEW}" s
            ${conditions.length ? "WHERE " + conditions.join(" AND ") : ""}
            GROUP BY "${groupBy}"
        `;

        return db.any(query, params);
    }
}
