
 DROP TABLE IF EXISTS signatures;
 DROP TABLE IF EXISTS profiles;
 DROP TABLE IF EXISTS users;
 
-- ****************************** USERS ********************************

CREATE TABLE users(
    id SERIAL PRIMARY KEY,
    first VARCHAR(255) NOT NULL,
    last VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

-- ****************************** SIGNATURES ********************************

-- here we are adding the foreign key (user_id)
-- foreign key lets us identify which user from the users table signed the petition
-- and which signature is theirs (acts as an identifier btw the 2 tables!)

CREATE TABLE signatures (
    id SERIAL PRIMARY KEY,
    signature TEXT NOT NULL,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );


-- the order in which you drop your tables in your sql file matters now that we have 
-- introduced a foreign key, make sure that you first drop the table the contains the 
-- foreign key (signatures), then the table that is the source for the foreign key (users), 
-- and your create table commands should have the order of first create the table the 
-- provides the reference value (users), then the table that stores this 
-- value as a foreign key

-- ****************************** PROFILES ********************************

CREATE TABLE profiles (
    id SERIAL PRIMARY KEY,
    age INTEGER,
    url VARCHAR(255),
    city VARCHAR(255),
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

-- ****************************** INSERTS ********************************

-- INSERT INTO users (first, last, email, password) VALUES ('Michael', 'Risberg', 'michi@abc.com', 'nyc123');
-- INSERT INTO users (first, last, email, password) VALUES ('Luise', 'Brandenburger', 'luise@abc.com', 'berlin123');

SELECT * FROM signatures;
SELECT * FROM users;
SELECT * FROM profiles;
-- SELECT (first, last) FROM signatures;
