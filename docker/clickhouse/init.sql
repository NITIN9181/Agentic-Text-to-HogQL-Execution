CREATE DATABASE IF NOT EXISTS posthog;

USE posthog;

-- Events table: stores all analytics events
CREATE TABLE IF NOT EXISTS posthog.events (
    uuid UUID DEFAULT generateUUIDv4(),
    timestamp DateTime64(3) DEFAULT now64(3),
    event String,
    person_id String,
    distinct_id String,
    properties String DEFAULT '{}',
    team_id Int32 DEFAULT 1,
    created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (team_id, toDate(timestamp), person_id, uuid);

-- Persons table: stores user profiles
CREATE TABLE IF NOT EXISTS posthog.persons (
    id String,
    team_id Int32 DEFAULT 1,
    properties String DEFAULT '{}',
    created_at DateTime DEFAULT now(),
    version Int64 DEFAULT 1
) ENGINE = ReplacingMergeTree(version)
ORDER BY (team_id, id);

-- Sessions table: stores user sessions
CREATE TABLE IF NOT EXISTS posthog.sessions (
    session_id String,
    person_id String,
    team_id Int32 DEFAULT 1,
    start_time DateTime DEFAULT now(),
    end_time DateTime DEFAULT now(),
    event_count Int32 DEFAULT 0,
    duration_seconds Int32 DEFAULT 0,
    entry_url String DEFAULT '',
    exit_url String DEFAULT ''
) ENGINE = MergeTree()
ORDER BY (team_id, toDate(start_time), session_id);

-- Insert 10,000 mock events spread over the last 30 days
INSERT INTO posthog.events (timestamp, event, person_id, distinct_id, properties)
SELECT
    now() - INTERVAL (number * 260) SECOND AS timestamp,
    arrayElement(
        ['$pageview','$pageleave','button_clicked','form_submitted','payment_failed','payment_succeeded','signup_completed','feature_used'],
        (number % 8) + 1
    ) AS event,
    concat('user_', toString(number % 200)) AS person_id,
    concat('user_', toString(number % 200)) AS distinct_id,
    concat(
        '{"$current_url":"https://app.example.com/page',
        toString(number % 15),
        '","$browser":"',
        arrayElement(['Chrome','Firefox','Safari','Edge'], (number % 4) + 1),
        '","plan":"',
        arrayElement(['free','pro','enterprise'], (number % 3) + 1),
        '"}'
    ) AS properties
FROM numbers(10000);

-- Insert 200 mock persons
INSERT INTO posthog.persons (id, properties)
SELECT
    concat('user_', toString(number)) AS id,
    concat(
        '{"email":"user',
        toString(number),
        '@example.com","name":"User ',
        toString(number),
        '","plan":"',
        arrayElement(['free','pro','enterprise'], (number % 3) + 1),
        '","country":"',
        arrayElement(['US','UK','DE','FR','JP','BR','IN','CA'], (number % 8) + 1),
        '"}'
    ) AS properties
FROM numbers(200);

-- Insert 500 mock sessions
INSERT INTO posthog.sessions (session_id, person_id, start_time, end_time, event_count, duration_seconds, entry_url, exit_url)
SELECT
    concat('sess_', toString(number)) AS session_id,
    concat('user_', toString(number % 200)) AS person_id,
    now() - INTERVAL (number * 3600) SECOND AS start_time,
    (now() - INTERVAL (number * 3600) SECOND) + INTERVAL (300 + (number % 3600)) SECOND AS end_time,
    1 + (number % 50) AS event_count,
    300 + (number % 3600) AS duration_seconds,
    concat('https://app.example.com/page', toString(number % 15)) AS entry_url,
    concat('https://app.example.com/page', toString((number + 3) % 15)) AS exit_url
FROM numbers(500);
