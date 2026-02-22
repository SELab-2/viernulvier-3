-- =========================
-- Base tables
-- =========================

CREATE TABLE language (
  id INT PRIMARY KEY,
  language VARCHAR
);

CREATE TABLE gallery (
  id INT PRIMARY KEY,
  media TEXT
);

CREATE TABLE productions (
  id INT PRIMARY KEY,
  performer_type VARCHAR,
  attendance_mode VARCHAR,
  media_gallery_id INT REFERENCES gallery(id),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- =========================
-- Production translations
-- =========================

CREATE TABLE prod_info (
  production_id INT REFERENCES productions(id),
  language_id INT REFERENCES language(id),

  title VARCHAR,
  supertitle VARCHAR,
  artist VARCHAR,
  tagline VARCHAR,
  teaser VARCHAR,

  description TEXT,
  info TEXT,

  PRIMARY KEY (production_id, language_id)
);

-- =========================
-- Genres
-- =========================

CREATE TABLE genres (
  id INT PRIMARY KEY
);

CREATE TABLE genre_names (
  genre_id INT REFERENCES genres(id),
  language_id INT REFERENCES language(id),
  name VARCHAR,

  PRIMARY KEY (genre_id, language_id)
);

-- =========================
-- Tags
-- =========================

CREATE TABLE tags (
  id INT PRIMARY KEY,
  name VARCHAR
);

CREATE TABLE tag_names (
  tag_id INT REFERENCES tags(id),
  language_id INT REFERENCES language(id),
  name VARCHAR,

  PRIMARY KEY (tag_id, language_id)
);

-- =========================
-- Many-to-many relations
-- =========================

CREATE TABLE prod_tags (
  tag_id INT REFERENCES tags(id),
  prod_id INT REFERENCES productions(id),

  PRIMARY KEY (tag_id, prod_id)
);

CREATE TABLE prod_genres (
  genre_id INT REFERENCES genres(id),
  prod_id INT REFERENCES productions(id),

  PRIMARY KEY (genre_id, prod_id)
);

-- =========================
-- Venue / halls
-- =========================

CREATE TABLE halls (
  id INT PRIMARY KEY,
  address VARCHAR,
  name VARCHAR
);

-- =========================
-- Events
-- =========================

CREATE TABLE events (
  id INT PRIMARY KEY,
  production_id INT REFERENCES productions(id),
  hall_id INT REFERENCES halls(id),

  starts_at TIMESTAMP,
  ends_at TIMESTAMP,

  order_url VARCHAR,
  external_order_url VARCHAR,

  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE event_prices (
  id INT PRIMARY KEY,
  event_id INT REFERENCES events(id),

  label VARCHAR,
  amount DECIMAL,
  available INT,
  expires_at TIMESTAMP,

  created_at TIMESTAMP,
  updated_at TIMESTAMP
);