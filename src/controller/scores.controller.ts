import { Request, Response } from "express";
import { body } from "express-validator";
import db from "../db";
import { Player } from "../models/player.model";

class ScoresController {
    async getScores(req: Request, res: Response) {
        try {
            await Promise.all([
                body('tournamentId').optional().isString().run(req),
                body('playerId').optional().isInt().run(req),
                body('beatmapId').optional().isInt().run(req),
                body('matchId').optional().isInt().run(req),
                body('roundId').optional().isString().run(req)
            ]);

            const { tournamentId, matchId, playerId, beatmapId, roundId } = req.body;

            let conditions: string[] = [];
            let params: Record<string, any> = {};

            let joinRound = false;

            if (tournamentId) {
                conditions.push(`s."tournament_id"::text = $(tournamentId)`);
                params.tournamentId = tournamentId;
            }

            if (roundId) {
                joinRound = true;
                conditions.push(`r."round_id"::text = $(roundId)`);
                params.roundId = roundId;
            }

            if (matchId) {
                conditions.push(`s."match_id" = $(matchId)`);
                params.matchId = matchId;
            }

            if (playerId) {
                conditions.push(`s."player_id" = $(playerId)`);
                params.playerId = playerId;
            }

            if (beatmapId) {
                conditions.push(`s."beatmap_id" = $(beatmapId)`);
                params.beatmapId = beatmapId;
            }

            let query = `
                SELECT *
                FROM public."scores_view" s
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
