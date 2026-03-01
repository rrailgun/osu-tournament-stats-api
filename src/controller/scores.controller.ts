import { ScoresViewColumns } from "../enum/columns.enum";
import { ScoresService } from "../services/scores.service";

const allowedGroupBy = new Set([
    ScoresViewColumns.TOURNAMENT_ID,
    ScoresViewColumns.ROUND_ID,
    ScoresViewColumns.MATCH_ID,
    ScoresViewColumns.PLAYER_ID,
    ScoresViewColumns.BEATMAP_ID,
]);

class ScoresController {
    async getScoresGroupedByBeatmap(req: any, res: any) {
        try {
            const result = await ScoresService.getScoresGroupedByBeatmap(req.body);
            res.send(result);
        } catch (err) {
            console.error(err);
            res.status(500).send({ error: "Failed to fetch scores grouped by beatmap" });
        }
    }

    async getScores(req: any, res: any) {
        try {
            const scores = await ScoresService.getScores(req.body);
            res.send(scores);
        } catch (err) {
            console.error(err);
            res.status(500).send({ error: "Failed to fetch scores" });
        }
    }

    async getScoresGrouped(req: any, res: any) {
        try {
            const { groupBy } = req.body;
            if (!allowedGroupBy.has(groupBy)) {
                return res.status(400).send({ error: "Invalid groupBy column" });
            }

            const groupedScores = await ScoresService.getScoresGrouped(req.body, groupBy);
            res.send(groupedScores);

        } catch (err) {
            console.error(err);
            res.status(500).send({ error: "Failed to fetch grouped scores" });
        }
    }
}

export default new ScoresController();
