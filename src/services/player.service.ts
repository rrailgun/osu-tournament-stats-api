import db from "../db";
import { Player } from "../types/player.model";
import { Client, UserExtended } from "osu-web.js";

export class PlayerService {
    static async getSelfInfo(token: string): Promise<{ username: string, player_id: number }> {
        let api = new Client(token);
        let userResponse: UserExtended = await api.users.getSelf();
        return {
            username: userResponse.username,
            player_id: userResponse.id
        }
    }

    static async syncUser(token: string): Promise<{ id: number, username: string, country_code: string | null, country_name: string | null }> {
        let api = new Client(token);
        let userResponse: UserExtended = await api.users.getSelf();

        await db.none(`
            INSERT INTO public."User" (id, username, country_code, country_name)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (id) DO UPDATE SET
                username = EXCLUDED.username,
                country_code = EXCLUDED.country_code,
                country_name = EXCLUDED.country_name
        `, [
            userResponse.id,
            userResponse.username,
            userResponse.country?.code || null,
            userResponse.country?.name || null
        ]);
        return (
            {
                id: userResponse.id,
                username: userResponse.username,
                country_code: userResponse.country?.code || null,
                country_name: userResponse.country?.name || null
            }
        )
    }

    static async getPlayerList(query?: string): Promise<Player[]> {
        let where = query || '';
        if (query) {
            return db.any('SELECT id, username FROM public."User" WHERE username ILIKE $1', '%' + where + '%');
        } else {
            return db.any('SELECT id, username FROM public."User"');
        }
    }
}
