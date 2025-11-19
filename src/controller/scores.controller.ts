import { Request, Response } from "express";
import { body } from "express-validator";
import db from "../db";
import { Player } from "../models/player.model";

class ScoresController {
    async getScores(req: Request, res: Response) {
        try {
            await Promise.all([
                body('tournamentId')
                    .optional()
                    .isString()
                    .withMessage('tournamentId must be an string')
                    .run(req),
                body('playerId')
                    .optional()
                    .isInt()
                    .withMessage('playerId must be a integer')
                    .run(req),
                body('beatmapId')
                    .optional()
                    .isInt()
                    .withMessage('beatmapId must be a integer')
                    .run(req),
                body('matchId')
                    .optional()
                    .isInt()
                    .withMessage('matchId must be a integer')
                    .run(req)
            ]);
            let { tournamentId, matchId, playerId, beatmapId } = req.body;

            let conditions: string[] = [];
            let params: Record<string, any> = {};

            if (tournamentId) {
                conditions.push(`"tournament_id"::text = \${tournamentId}`);
                params.tournamentId = tournamentId;
            }
            if (matchId) {
                conditions.push(`"match_id" = \${matchId}`);
                params.matchId = matchId;
            }
            if (playerId) {
                conditions.push(`"player_id" = \${playerId}`);
                params.playerId = playerId;
            }
            if (beatmapId) {
                conditions.push(`"beatmap_id" = \${beatmapId}`);
                params.beatmapId = beatmapId;
            }

            let query = `SELECT * FROM public."Scores"`;
            if (conditions.length > 0) {
                query += " WHERE " + conditions.join(" AND ");
            }

            let scores: Player[] = await db.any(query, params);
            res.send(scores);
        } catch (err) {
            console.error(err);
            res.status(500).send({ error: "Failed to fetch scores" });
        }
    }
}

export default new ScoresController();
