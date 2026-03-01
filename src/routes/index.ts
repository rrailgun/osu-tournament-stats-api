import { Router } from 'express';
import playerRouter from './player.route';
import tournamentRouter from './tournament.route';
import scoresRouter from './scores.route';
import roundRouter from './round.route';

const apiRouter = Router();

apiRouter.use('/players', playerRouter);
apiRouter.use('/tournaments', tournamentRouter);
apiRouter.use('/scores', scoresRouter);
apiRouter.use('/rounds', roundRouter);

export default apiRouter;
