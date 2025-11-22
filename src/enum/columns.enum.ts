export enum ScoreColumns {
    TOURNAMENT_ID = 'tournament_id',
    MATCH_ID = 'match_id',
    PLAYER_ID = 'player_id',
    BEATMAP_ID = 'beatmap_id',
    SCORE = 'score',
    COUNT_300 = 'count300',
    COUNT_100 = 'count100',
    COUNT_50 = 'count50',
    COUNT_MISS = 'countmiss',
    ACCURACY = 'accuracy',
    COMBO = 'combo',
    MODS = 'mods',
    RANK = 'rank',
    DATE = 'date'
}

export enum TournamentColumns {
    ID = 'id',
    NAME = 'name',
    CREATOR = 'creator'
}

export enum RoundColumns {
    ROUND_ID = 'round_id',
    TOURNAMENT_ID = 'tournament_id',
    ROUND_NAME = 'round_name'
}

export enum MatchColumns {
    MATCH_ID = 'match_id',
    ROUND_ID = 'round_id',
    MATCH_NAME = 'match_name'
}

export enum UserColumns {
    ID = 'id',
    USERNAME = 'username',
    COUNTRY_CODE = 'country_code',
    COUNTRY_NAME = 'country_name'
}

export enum BeatmapColumns {
    ID = 'id',
    DIFFICULTY_RATING = 'difficulty_rating',
    DIFFICULTY_NAME = 'difficulty_name',
    TITLE = 'title',
    ARTIST = 'artist',
    CREATOR = 'creator',
    BEATMAPSET_ID = 'beatmapset_id'
}

export enum PoolColumns {
    SLOT = 'slot',
    ROUND_ID = 'round_id',
    BEATMAP_ID = 'beatmap_id'
}

export enum ScoresViewColumns {
    MATCH_ID = "match_id",
    PLAYER_ID = "player_id",
    BEATMAP_ID = "beatmap_id",
    SCORE = "score",
    COUNT300 = "count300",
    COUNT100 = "count100",
    COUNT50 = "count50",
    COUNTMISS = "countmiss",
    ACCURACY = "accuracy",
    COMBO = "combo",
    MODS = "mods",
    RANK = "rank",
    DATE = "date",
    ROUND_ID = "round_id",
    TOURNAMENT_ID = "tournament_id",
    SLOT = "slot",
    PLAYER_USERNAME = "username",
    COUNTRY_CODE = "country_code",
    COUNTRY_NAME = "country_name",
    BEATMAP_TITLE = "title",
    BEATMAP_ARTIST = "artist",
    BEATMAP_CREATOR = "creator",
    BEATMAP_SR = "difficulty_rating",
    BEATMAP_DIFFICULTY_NAME = "difficulty_name",
    BEATMAPSET_ID = "beatmapset_id",
    MATCH_NAME = "match_name",
    ROUND_NAME = "round_name",
    TOURNAMENT_NAME = "tournament_name"
}
