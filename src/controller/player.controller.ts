import { PlayerService } from "../services/player.service";

class PlayerController {

    async getSelfInfo(req: any, res: any) {
        try {
            const userInfo = await PlayerService.getSelfInfo(req.token!);
            res.send(userInfo);
        }
        catch (err) {
            res.status(500).send({ error: 'Failed to fetch user info' });
        }
    }

    async getPlayerList(req: any, res: any) {
        try {
            const queryRes = await PlayerService.getPlayerList(req.query.query as string | undefined);
            res.send(queryRes);
        } catch (err) {
            res.status(500).send({ error: 'Database error' });
        }
    }
}

export default new PlayerController();