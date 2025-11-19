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


}

export default new TournamentController();