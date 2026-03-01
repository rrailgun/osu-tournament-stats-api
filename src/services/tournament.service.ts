import db from "../db";
import { Player } from "../types/player.model";
import { Tables } from "../enum/tables.enum";
import { RoundColumns } from "../enum/columns.enum";

export class TournamentService {
    static async getTournamentDetails(tournamentId: string) {
        return db.one(
            `
            WITH tournament_rounds AS (
                SELECT
                    r.tournament_id,
                    jsonb_agg(r.*) AS rounds
                FROM public."Round" r
                GROUP BY r.tournament_id
            )
            SELECT
                t.*,
                to_jsonb(u) AS creator,
                COALESCE(tr.rounds, '[]'::jsonb) AS rounds
            FROM public."Tournament" t
            JOIN public."User" u ON u.id = t.creator
            LEFT JOIN tournament_rounds tr ON tr.tournament_id = t.id
            WHERE t.id = $1
            `,
            [tournamentId]
        );
    }

    static async getTournamentList(searchQuery?: string): Promise<Player[]> {
        return db.any(`
            SELECT 
                t.*, 
                u.username AS creator_username
            FROM public."Tournament" t
            JOIN public."User" u ON u.id = t.creator
            WHERE ($1::text IS NULL OR t.name ILIKE '%' || $1 || '%')
        `, [searchQuery || null]);
    }

    static async getRoundsByTournament(tournamentId: string) {
        return db.any<{
            round_id: string;
            round_name: string;
        }>(
            `SELECT ${RoundColumns.ROUND_ID}, ${RoundColumns.ROUND_NAME} FROM "${Tables.ROUND}" WHERE ${RoundColumns.TOURNAMENT_ID} = $1`,
            [tournamentId]
        );
    }

    static async createTournament(name: string, creatorId: number) {
        return db.one(`INSERT INTO "Tournament" (name, creator)VALUES ($1, $2) RETURNING *`, [name, creatorId]);
    }

    static async createRound(name: string, tournamentId: string) {
        return db.one(`INSERT INTO "Round" (round_name, tournament_id)VALUES ($1, $2)RETURNING *`, [name, tournamentId]);
    }
}
