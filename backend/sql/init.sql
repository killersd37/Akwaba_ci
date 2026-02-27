CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(80) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  badges TEXT[] DEFAULT ARRAY[]::TEXT[]
);

CREATE TABLE IF NOT EXISTS ethnic_groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  history TEXT,
  culture TEXT,
  gastronomy TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO ethnic_groups (name, history, culture, gastronomy)
VALUES
('Baoulé', 'Issus du groupe Akan, installés au centre de la Côte d''Ivoire.', 'Art du pagne, masques, fêtes de génération.', 'Kplala, foutou, sauce graine.'),
('Sanwi', 'Royaume historique situé à l''est ivoirien.', 'Traditions royales, langue agni-sanwi.', 'Plats à base d''igname et sauces locales.')
ON CONFLICT (name) DO NOTHING;
