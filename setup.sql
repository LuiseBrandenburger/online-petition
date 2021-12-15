
 DROP TABLE IF EXISTS signatures;
 DROP TABLE IF EXISTS profiles;
 DROP TABLE IF EXISTS users;
 
CREATE TABLE users(
    id SERIAL PRIMARY KEY,
    first VARCHAR(255) NOT NULL,
    last VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

CREATE TABLE signatures (
    id SERIAL PRIMARY KEY,
    signature TEXT NOT NULL,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

CREATE TABLE profiles (
    id SERIAL PRIMARY KEY,
    age INTEGER,
    url VARCHAR(255),
    city VARCHAR(255),
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

SELECT * FROM signatures;
SELECT * FROM users;
SELECT * FROM profiles;
