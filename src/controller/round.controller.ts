import { RoundService } from "../services/round.service";

class RoundController {
    async getRounds(req: any, res: any) {
        try {
            const rounds = await RoundService.getRounds();
            res.status(200).json(rounds);
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async getPoolByRound(req: any, res: any) {
        try {
            let pool = await RoundService.getPoolByRound(req.body.roundId);
            res.status(200).json(pool);
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async addBeatmapsToPool(req: any, res: any) {
        try {
            await RoundService.addBeatmapsToPool(req.body.roundId, req.body.beatmapIds, req.token!);
            res.status(200).json({ status: 'Beatmaps added to pool' });
        }
        catch (error) {
            console.log(error)
            return res.status(400).json({ error: 'Invalid input data', log: error });
        }
    }

    async addMpLinks(req: any, res: any) {
        try {
            await RoundService.addMpLinks(req.body.roundId, req.body.mpLinks, req.token!);
            res.status(202).send({ status: 'PENDING' });
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

export default new RoundController();