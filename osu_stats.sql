CREATE TABLE "Scores" (
  "tournament_id" integer,
  "match_id" integer,
  "player_id" integer,
  "beatmap_id" integer,
  "title" text,
  "score" integer,
  "count300" integer,
  "count100" integer,
  "count50" integer,
  "countmiss" integer,
  "accuracy" float,
  "mods" text[],
  PRIMARY KEY ("tournament_id", "match_id", "player_id", "beatmap_id")
);

CREATE TABLE "Beatmap" (
  "id" integer PRIMARY KEY,
  "title" text,
  "star" float,
  "approach_rate" float,
  "circle_size" float,
  "overall_difficulty" float,
  "health_points" float,
  "bpm" float,
  "length" integer,
  "drain" float
);

CREATE TABLE "Pool" (
  "beatmap_id" integer,
  "tournament_id" integer,
  "slot" varchar(16),
  "round" varchar(16),
  PRIMARY KEY ("beatmap_id", "tournament_id")
);

CREATE TABLE "Player" (
  "id" integer PRIMARY KEY,
  "name" varchar(18) NOT NULL
);

CREATE TABLE "Team" (
  "name" varchar(255),
  "tournament_id" integer,
  "seed" integer,
  "placement" integer,
  PRIMARY KEY ("name", "tournament_id")
);

CREATE TABLE "Match" (
  "id" integer PRIMARY KEY,
  "name" varchar(255),
  "team1_score" integer,
  "team2_score" integer
);

CREATE TABLE "Tournament" (
  "id" integer PRIMARY KEY,
  "name" TEXT
);

CREATE TABLE "Player_Teams" (
  "tournament_id" integer,
  "player_id" integer,
  "team_name" varchar(255),
  PRIMARY KEY ("tournament_id", "player_id", "team_name")
);

ALTER TABLE "Scores" ADD FOREIGN KEY ("tournament_id") REFERENCES "Tournament" ("id");

ALTER TABLE "Scores" ADD FOREIGN KEY ("match_id") REFERENCES "Match" ("id");

ALTER TABLE "Scores" ADD FOREIGN KEY ("player_id") REFERENCES "Player" ("id");

ALTER TABLE "Scores" ADD FOREIGN KEY ("beatmap_id") REFERENCES "Beatmap" ("id");

ALTER TABLE "Pool" ADD FOREIGN KEY ("beatmap_id") REFERENCES "Beatmap" ("id");

ALTER TABLE "Pool" ADD FOREIGN KEY ("tournament_id") REFERENCES "Tournament" ("id");

ALTER TABLE "Team" ADD FOREIGN KEY ("tournament_id") REFERENCES "Tournament" ("id");

ALTER TABLE "Player_Teams" ADD FOREIGN KEY ("player_id") REFERENCES "Player" ("id");

ALTER TABLE "Player_Teams" ADD FOREIGN KEY ("team_name", "tournament_id") REFERENCES "Team" ("name", "tournament_id");
