CREATE TABLE "Scores" (
  "tournament_id" uuid,
  "match_id" int,
  "player_id" int,
  "beatmap_id" int,
  "score" int,
  "count300" int,
  "count100" int,
  "count50" int,
  "countmiss" int,
  "combo" int,
  "mods" text,
  PRIMARY KEY ("tournament_id", "match_id", "player_id", "beatmap_id")
);

CREATE TABLE "Tournament" (
  "id" uuid PRIMARY KEY DEFAULT (uuid_generate_v4()),
  "name" varchar(100),
  "creator" int
);

CREATE TABLE "Round" (
  "round_id" uuid PRIMARY KEY DEFAULT (uuid_generate_v4()),
  "tournament_id" uuid,
  "round_name" varchar(32)
);

CREATE TABLE "Match" (
  "match_id" int PRIMARY KEY,
  "round_id" uuid,
  "match_name" text
);

CREATE TABLE "User" (
  "id" int PRIMARY KEY,
  "username" varchar(24)
);

ALTER TABLE "Scores" ADD FOREIGN KEY ("tournament_id") REFERENCES "Tournament" ("id");

ALTER TABLE "Scores" ADD FOREIGN KEY ("match_id") REFERENCES "Match" ("match_id");

ALTER TABLE "Tournament" ADD FOREIGN KEY ("creator") REFERENCES "User" ("id");

ALTER TABLE "Round" ADD FOREIGN KEY ("tournament_id") REFERENCES "Tournament" ("id");

ALTER TABLE "Match" ADD FOREIGN KEY ("round_id") REFERENCES "Round" ("round_id");
