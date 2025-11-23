import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import bodyParser from 'body-parser';
dotenv.config()
import session from 'express-session';
import passport from 'passport';
import OAuth2Strategy from 'passport-oauth2';
import { Auth, buildUrl, Client } from 'osu-web.js';
import db from './db';


import playerRouter from './routes/player.route';
import tournamentRouter from './routes/tournament.route';
import scoresRouter from './routes/scores.route';
import roundRouter from './routes/round.route';


const app = express();
const apiRouter = express.Router();
const osuApiAuth = new Auth(Number(process.env.OSU_CLIENT_ID), process.env.OSU_CLIENT_SECRET!, 'http://localhost:4200/auth');
const authGrant = osuApiAuth.authorizationCodeGrant(['identify']);
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:4200',
    credentials: true
}));
app.use(bodyParser.json());

app.post('/auth', async (req, res) => {
    let code = req.body.code;
    if (!code) return res.status(400).send({ error: 'Code is required' });
    try {
        let token = await authGrant.requestToken(code);
        res.send(token);
    }
    catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Failed to authenticate' });  
    }
});


apiRouter.use('/players', playerRouter);
apiRouter.use('/tournaments', tournamentRouter);
apiRouter.use('/scores', scoresRouter);
apiRouter.use('/rounds', roundRouter);


app.use('/api', apiRouter)


app.listen(3000, () => {
    console.log("running on 3000")
});