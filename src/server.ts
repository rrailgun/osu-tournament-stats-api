import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import bodyParser from 'body-parser';
dotenv.config()
import session from 'express-session';
import passport from 'passport';
import OAuth2Strategy from 'passport-oauth2';
import { Client } from 'osu-web.js';
import db from './db';


import playerRouter from './routes/player.route';
import tournamentRouter from './routes/tournament.route';


const app = express();
const apiRouter = express.Router();
app.use(express.json());
app.use(cors({
    credentials: true
}));
app.use(bodyParser.json());
app.use(session({
    secret: process.env.COOKIE_KEY || 'default',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));
app.use(passport.session())

//temp
passport.use(new OAuth2Strategy({
    authorizationURL: 'https://osu.ppy.sh/oauth/authorize',
    tokenURL: 'https://osu.ppy.sh/oauth/token',
    clientID: process.env.OSU_CLIENT_ID || '',
    clientSecret: process.env.OSU_CLIENT_SECRET || '',
    scope: ['identify', 'public'],
    callbackURL: "http://localhost:3000/api/auth/cb"
},
    function (_accessToken: any, _refreshToken: any, profile: any, cb: any) {
        let api = new Client(_accessToken);
        api.users.getSelf().then(res => {
            console.log(_accessToken)
            db.none(`INSERT INTO "Player" (id, name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING`, [res.id, res.username]);
            return cb(null, {
                token: _accessToken,
                refreshToken: _refreshToken,
                username: res.username,
                player_id: res.id
            });
        })
    }
));

passport.serializeUser(function (user, cb) {
    process.nextTick(function () {
        return cb(null, user);
    });
});

passport.deserializeUser(function (user: any, cb) {
    process.nextTick(function () {
        return cb(null, user);
    });
});

apiRouter.get('/auth', passport.authenticate('oauth2'))
apiRouter.get('/auth/cb', passport.authenticate('oauth2', { failureRedirect: '/' }), (req, res) => {
    // req.session.cookie.maxAge = 365 * 24 * 60 * 60 * 1000;
    res.redirect('http://localhost:4200/')
})

apiRouter.use('/players', playerRouter);
apiRouter.use('/tournaments', tournamentRouter);

app.use('/api', apiRouter)


app.listen(3000, () => {
    console.log("running on 3000")
});