import { Request, Response } from "express";
import { body } from "express-validator";
import db from "../db";
import { Player } from "../models/player.model";
import { ScoresViewColumns } from "../enum/columns.enum";
import { Views } from "../enum/tables.enum";
import { checkForErrors } from "../util/redirect.util";

const allowedGroupBy = new Set([
    ScoresViewColumns.TOURNAMENT_ID,
    ScoresViewColumns.ROUND_ID,
    ScoresViewColumns.MATCH_ID,
    ScoresViewColumns.PLAYER_ID,
    ScoresViewColumns.BEATMAP_ID,
]);

/**
 * Builds SQL WHERE conditions and parameters based on request body
 */
function buildFilters(body: any) {
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

class ScoresController {
    /**
     * Groups scores by beatmap_id and extracts beatmap info into a separate object.
     * Response: Array of { beatmap_id, beatmap_info, scores }
     */
    async getScoresGroupedByBeatmap(req: Request, res: Response) {
        try {
            await Promise.all([
                body('tournamentId').optional().isString().run(req),
                body('playerIds').optional().isArray().run(req),
                body('playerIds.*').optional().isInt().run(req),
                body('beatmapIds').optional().isArray().run(req),
                body('beatmapIds.*').optional().isInt().run(req),
                body('matchIds').optional().isArray().run(req),
                body('matchIds.*').optional().isInt().run(req),
                body('roundId').optional().isString().run(req)
            ]);
            if (await checkForErrors(req, res)) return;
            let { conditions, params } = buildFilters(req.body);
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
                                '${ScoresViewColumns.BEATMAPSET_ID}', s."${ScoresViewColumns.BEATMAPSET_ID}"
                            )
                        )->0
                    ) AS beatmap_info,
                    json_agg(s ORDER BY s."${ScoresViewColumns.SCORE}" DESC) AS scores
                FROM public."${Views.SCORES_VIEW}" s
                ${conditions.length ? "WHERE " + conditions.join(" AND ") : ""}
                GROUP BY s."${ScoresViewColumns.BEATMAP_ID}";
                `;
            const result = await db.any(query, params);
            res.send(result);
        } catch (err) {
            console.error(err);
            res.status(500).send({ error: "Failed to fetch scores grouped by beatmap" });
        }
    }

    async getScores(req: Request, res: Response) {
        try {
            await Promise.all([
                body('tournamentId').optional().isString().run(req),
                body('playerIds').optional().isArray().run(req),
                body('playerIds.*').optional().isInt().run(req),
                body('beatmapIds').optional().isArray().run(req),
                body('beatmapIds.*').optional().isInt().run(req),
                body('matchIds').optional().isArray().run(req),
                body('matchIds.*').optional().isInt().run(req),
                body('roundId').optional().isString().run(req)
            ]);
            if (await checkForErrors(req, res)) return;
            const { conditions, params } = buildFilters(req.body);

            const query = `
                SELECT *
                FROM public."${Views.SCORES_VIEW}" s
                ${conditions.length ? "WHERE " + conditions.join(" AND ") : ""}
                ORDER BY s."${ScoresViewColumns.SCORE}" DESC
            `;

            const scores: Player[] = await db.any(query, params);
            res.send(scores);

        } catch (err) {
            console.error(err);
            res.status(500).send({ error: "Failed to fetch scores" });
        }
    }

    /*
    This will return scores grouped by the specified column. The response will be an array of objects, each containing:
    - key: the value of the groupBy column
    - column: the name of the groupBy column
    - rows: an array of score records belonging to that group, ordered by score descending
    This is probably not the most effective way to handle this. Ex. grouped by beatmap_id, each entry has a ton of repeat data 
    that is the same for every single row. If this becomes a PIA I will need to make a specific functions for some group types,
    such as beatmaps, to make it easier to use in the front end 
    */
    async getScoresGrouped(req: Request, res: Response) {
        try {
            await Promise.all([
                body('groupBy')
                    .exists()
                    .custom((value) => Object.values(ScoresViewColumns).includes(value))
                    .withMessage(`groupBy must be one of: [${Object.values(ScoresViewColumns).join(', ')}]`)
                    .run(req),
                body('tournamentId').optional().isString().run(req),
                body('playerIds').optional().isArray().run(req),
                body('playerIds.*').optional().isInt().run(req),
                body('beatmapIds').optional().isArray().run(req),
                body('beatmapIds.*').optional().isInt().run(req),
                body('matchIds').optional().isArray().run(req),
                body('matchIds.*').optional().isInt().run(req),
                body('roundId').optional().isString().run(req)
            ]);
            if (await checkForErrors(req, res)) return;
            const { groupBy } = req.body;

            if (!allowedGroupBy.has(groupBy)) {
                return res.status(400).send({ error: "Invalid groupBy column" });
            }

            const { conditions, params } = buildFilters(req.body);
            const query = `
                SELECT
                    "${groupBy}" AS key,
                    '${groupBy}' AS column,
                    json_agg(s ORDER BY s."${ScoresViewColumns.SCORE}" DESC) AS rows
                FROM public."${Views.SCORES_VIEW}" s
                ${conditions.length ? "WHERE " + conditions.join(" AND ") : ""}
                GROUP BY "${groupBy}"
            `;

            const groupedScores = await db.any(query, params);
            res.send(groupedScores);

        } catch (err) {
            console.error(err);
            res.status(500).send({ error: "Failed to fetch grouped scores" });
        }
    }

}

export default new ScoresController();
