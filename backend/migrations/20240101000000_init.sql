-- halls (no FKs)
CREATE TABLE IF NOT EXISTS halls (
    id    SERIAL PRIMARY KEY,
    address TEXT,
    name  TEXT
);

-- users (no FKs)
CREATE TABLE IF NOT EXISTS users (
    id              SERIAL PRIMARY KEY,
    username        TEXT    UNIQUE NOT NULL,
    hashed_password TEXT    NOT NULL,
    token_version   INTEGER NOT NULL DEFAULT 0,
    super_user      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    last_login_at   TIMESTAMPTZ
);

-- roles / permissions
CREATE TABLE IF NOT EXISTS roles (
    id   SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS permissions (
    id   SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id INTEGER REFERENCES users(id)  ON DELETE CASCADE,
    role_id INTEGER REFERENCES roles(id)  ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id       INTEGER REFERENCES roles(id)       ON DELETE CASCADE,
    permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- productions
CREATE TABLE IF NOT EXISTS productions (
    id               SERIAL PRIMARY KEY,
    viernulvier_id   INTEGER UNIQUE,
    performer_type   TEXT,
    attendance_mode  TEXT,
    created_at       TIMESTAMP DEFAULT NOW(),
    updated_at       TIMESTAMP DEFAULT NOW(),
    earliest_at      TIMESTAMP,
    latest_at        TIMESTAMP
);

CREATE TABLE IF NOT EXISTS prod_info (
    production_id INTEGER REFERENCES productions(id) NOT NULL,
    language      TEXT NOT NULL,
    title         TEXT,
    supertitle    TEXT,
    artist        TEXT,
    tagline       TEXT,
    teaser        TEXT,
    description   TEXT,
    info          TEXT,
    PRIMARY KEY (production_id, language)
);

-- events
CREATE TABLE IF NOT EXISTS events (
    id             SERIAL PRIMARY KEY,
    viernulvier_id INTEGER UNIQUE,
    production_id  INTEGER REFERENCES productions(id),
    hall_id        INTEGER REFERENCES halls(id),
    starts_at      TIMESTAMP,
    ends_at        TIMESTAMP,
    order_url      TEXT,
    created_at     TIMESTAMP DEFAULT NOW(),
    updated_at     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_prices (
    id             SERIAL PRIMARY KEY,
    viernulvier_id INTEGER UNIQUE,
    event_id       INTEGER REFERENCES events(id),
    amount         NUMERIC,
    available      INTEGER,
    expires_at     TIMESTAMP,
    created_at     TIMESTAMP DEFAULT NOW(),
    updated_at     TIMESTAMP DEFAULT NOW()
);

-- tags
CREATE TABLE IF NOT EXISTS tags (
    id             SERIAL PRIMARY KEY,
    viernulvier_id INTEGER UNIQUE
);

CREATE TABLE IF NOT EXISTS tag_names (
    tag_id   INTEGER REFERENCES tags(id) NOT NULL,
    language TEXT NOT NULL,
    name     TEXT,
    PRIMARY KEY (tag_id, language)
);

CREATE TABLE IF NOT EXISTS prod_tags (
    tag_id  INTEGER REFERENCES tags(id),
    prod_id INTEGER REFERENCES productions(id),
    PRIMARY KEY (tag_id, prod_id)
);

-- production groups
CREATE TABLE IF NOT EXISTS production_groups (
    id               SERIAL PRIMARY KEY,
    title            TEXT    NOT NULL,
    is_public_filter BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS prod_groups (
    group_id INTEGER REFERENCES production_groups(id),
    prod_id  INTEGER REFERENCES productions(id),
    PRIMARY KEY (group_id, prod_id)
);

-- blogs
CREATE TABLE IF NOT EXISTS blogs (
    id SERIAL PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS blog_content (
    blog_id  INTEGER REFERENCES blogs(id) NOT NULL,
    language TEXT NOT NULL,
    title    TEXT,
    content  TEXT,
    PRIMARY KEY (blog_id, language)
);

CREATE TABLE IF NOT EXISTS prod_blogs (
    blog_id INTEGER REFERENCES blogs(id),
    prod_id INTEGER REFERENCES productions(id),
    PRIMARY KEY (blog_id, prod_id)
);

-- media
CREATE TABLE IF NOT EXISTS media (
    id             SERIAL PRIMARY KEY,
    vnv_item_id    INTEGER UNIQUE,
    production_id  INTEGER REFERENCES productions(id),
    blog_id        INTEGER REFERENCES blogs(id),
    object_key     TEXT UNIQUE NOT NULL,
    content_type   TEXT NOT NULL,
    uploaded_at    TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT ck_media_production_or_blog CHECK (
        (production_id IS NOT NULL) OR (blog_id IS NOT NULL)
    )
);

-- history
CREATE TABLE IF NOT EXISTS history (
    year     INTEGER NOT NULL,
    language TEXT    NOT NULL,
    title    TEXT,
    content  TEXT NOT NULL,
    PRIMARY KEY (year, language)
);

-- sync_state
DO $$ BEGIN
    CREATE TYPE resource_type AS ENUM (
        'production', 'event', 'gallery', 'event_prices', 'genres', 'halls', 'tags'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE TYPE sync_type_enum AS ENUM (
        'created_at', 'updated_at'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS sync_state (
    resource   resource_type  NOT NULL,
    sync_type  sync_type_enum NOT NULL,
    last_timestamp TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (resource, sync_type)
);
