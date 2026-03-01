CREATE OR REPLACE VIEW scores_view AS
SELECT
    s.*,

    -- IDs from relations
    m.round_id,
    r.tournament_id,

    -- Slot from Pool
    p.slot,

    -- User
    u.username,
    u.country_code,
    u.country_name,

    -- Beatmap
    b.title,
    b.artist,
    b.creator,
    b.difficulty_rating,
    b.difficulty_name,
    b.beatmapset_id,

    -- Match / Round / Tournament names
    m.match_name,
    r.round_name,
    t.name AS tournament_name

FROM public."Scores" s
JOIN public."Match" m ON m.match_id = s.match_id
JOIN public."Round" r ON r.round_id = m.round_id
JOIN public."Tournament" t ON t.id = r.tournament_id
JOIN public."User" u ON u.id = s.player_id
JOIN public."Beatmap" b ON b.id = s.beatmap_id
JOIN public."Pool" p ON p.beatmap_id = s.beatmap_id AND p.round_id = m.round_id;
