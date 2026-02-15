CREATE TABLE IF NOT EXISTS predictions (
    id SERIAL PRIMARY KEY,
    match_id VARCHAR(100) NOT NULL,
    match_name VARCHAR(300) NOT NULL,
    league VARCHAR(200) NOT NULL,
    predicted_winner VARCHAR(100) NOT NULL,
    actual_winner VARCHAR(100),
    confidence INTEGER NOT NULL,
    bet_type VARCHAR(20),
    p1_odds DECIMAL(5,2),
    p2_odds DECIMAL(5,2),
    is_correct BOOLEAN,
    match_start_time TIMESTAMPTZ NOT NULL,
    match_finish_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(match_id)
);

CREATE INDEX idx_predictions_created_at ON predictions(created_at DESC);
CREATE INDEX idx_predictions_league ON predictions(league);
CREATE INDEX idx_predictions_bet_type ON predictions(bet_type);
CREATE INDEX idx_predictions_is_correct ON predictions(is_correct) WHERE is_correct IS NOT NULL;
