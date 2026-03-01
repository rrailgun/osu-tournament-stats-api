import { TournamentService } from "../services/tournament.service";
import jwt from "jsonwebtoken";

class TournamentController {

    async getTournamentDetails(req: any, res: any) {
        try {
            const result = await TournamentService.getTournamentDetails(req.params.tournamentId);
            res.send(result);
        } catch (err) {
            res.status(500).send({ error: err });
        }
    }

    async getTournamentList(req: any, res: any) {
        try {
            const queryRes = await TournamentService.getTournamentList(req.query.query as string | undefined);
            res.send(queryRes);
        } catch (err) {
            console.log(err)
            res.status(500).send({ error: err });
        }
    }

    async getRoundsByTournament(req: any, res: any) {
        try {
            const rounds = await TournamentService.getRoundsByTournament(req.params.tournamentId);
            res.status(200).send(rounds);
        } catch (err) {
            res.status(500).send({ error: "Database error" });
        }
    }

    async createTournament(req: any, res: any) {
        try {
            let decodeToken = jwt.decode(req.token);
            const result = await TournamentService.createTournament(req.body.name, Number(decodeToken!.sub));
            res.status(201).json(result);
        } catch (err) {
            console.log(err)
            res.status(500).send({ error: "Database error" });
        }
    }

    async createRound(req: any, res: any) {
        try {
            const result = await TournamentService.createRound(req.body.name, req.body.tournamentId);
            res.status(201).json(result);
        } catch (err) {
            res.status(500).send({ error: "Database error" });
        }
    }
}

export default new TournamentController();