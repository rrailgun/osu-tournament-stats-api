import { Request, Response } from "express";
import { body } from "express-validator";
import db from "../db";
import { Player } from "../models/player.model";
import { ScoresViewColumns } from "../enum/columns.enum";
import { Views } from "../enum/tables.enum";

class ScoresController {
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

            const { tournamentId, matchIds, playerIds, beatmapIds, roundId } = req.body;

            let conditions: string[] = [];
            let params: Record<string, any> = {};

            let joinRound = false;

            if (tournamentId) {
                conditions.push(`"${ScoresViewColumns.TOURNAMENT_ID}"::text = $(tournamentId)`);
                params.tournamentId = tournamentId;
            }

            if (roundId) {
                joinRound = true;
                conditions.push(`"${ScoresViewColumns.ROUND_ID}"::text = $(roundId)`);
                params.roundId = roundId;
            }

            if (matchIds && matchIds.length > 0) {
                conditions.push(`"${ScoresViewColumns.MATCH_ID}" IN ($(matchIds:csv))`);
                params.matchIds = matchIds;
            }

            if (playerIds && playerIds.length > 0) {
                conditions.push(`"${ScoresViewColumns.PLAYER_ID}" IN ($(playerIds:csv))`);
                params.playerIds = playerIds;
            }

            if (beatmapIds && beatmapIds.length > 0) {
                conditions.push(`"${ScoresViewColumns.BEATMAP_ID}" IN ($(beatmapIds:csv))`);
                params.beatmapIds = beatmapIds;
            }

            let query = `
                SELECT *
                FROM public."${Views.SCORES_VIEW}" s
            `;

            if (conditions.length > 0) {
                query += " WHERE " + conditions.join(" AND ");
            }

            const scores: Player[] = await db.any(query, params);
            res.send(scores);

        } catch (err) {
            console.error(err);
            res.status(500).send({ error: "Failed to fetch scores" });
        }
    }
}

export default new ScoresController();
