CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE "Scores" (
  "match_id" int,
  "player_id" int,
  "beatmap_id" int,
  "score" int,
  "count300" int,
  "count100" int,
  "count50" int,
  "countmiss" int,
  "accuracy" float,
  "combo" int,
  "mods" text[],
  "rank" char(1),
  "date" timestamp,
  PRIMARY KEY ("match_id", "player_id", "beatmap_id")
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
  "username" varchar(24),
  "admin" bool DEFAULT (false),
  "country_code" varchar(3),
  "country_name" varchar(64)
);

CREATE TABLE "Beatmap" (
  "id" int PRIMARY KEY,
  "difficulty_rating" float,
  "difficulty_name" varchar(256),
  "beatmapset_id" int,
  "title" varchar(256),
  "artist" varchar(64),
  "creator" varchar(24)
);

CREATE TABLE "Pool" (
  "slot" varchar(16),
  "beatmap_id" int,
  "round_id" uuid,
  PRIMARY KEY ("slot", "round_id")
);

ALTER TABLE "Scores" ADD FOREIGN KEY ("match_id") REFERENCES "Match" ("match_id");

ALTER TABLE "Scores" ADD FOREIGN KEY ("player_id") REFERENCES "User" ("id");

ALTER TABLE "Scores" ADD FOREIGN KEY ("beatmap_id") REFERENCES "Beatmap" ("id");

ALTER TABLE "Tournament" ADD FOREIGN KEY ("creator") REFERENCES "User" ("id");

ALTER TABLE "Round" ADD FOREIGN KEY ("tournament_id") REFERENCES "Tournament" ("id");

ALTER TABLE "Match" ADD FOREIGN KEY ("round_id") REFERENCES "Round" ("round_id");

ALTER TABLE "Pool" ADD FOREIGN KEY ("beatmap_id") REFERENCES "Beatmap" ("id");

ALTER TABLE "Pool" ADD FOREIGN KEY ("round_id") REFERENCES "Round" ("round_id");
