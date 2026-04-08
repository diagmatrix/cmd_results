DROP VIEW IF EXISTS public.commander_matchups;
CREATE OR REPLACE VIEW public.commander_matchups WITH (security_invoker = on) AS
WITH matches AS (
    SELECT
        cmd.game_id,
        cmd.commander,
        opps.commander AS opponent,
        cmd.is_winner AS won,
        opps.is_winner AS lost,
        NOT (cmd.is_winner OR opps.is_winner) AS drawn
    FROM public.games cmd
    LEFT JOIN public.games opps
        ON cmd.game_id = opps.game_id
        AND cmd.id <> opps.id
)
SELECT
    commander,
    opponent,
    count(*) AS games_together,
    sum(won::int) AS won,
    sum(lost::int) AS opponent_won,
    sum(drawn::int) AS neither_won
FROM matches
GROUP BY commander, opponent
ORDER BY commander, games_together DESC;
