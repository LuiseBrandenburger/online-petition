const spicedPg = require("spiced-pg");

const database = "petition";
const username = "postgres";
const password = "postgres";

const db = spicedPg(
    process.env.DATABASE_URL ||
    `postgres:${username}:${password}@localhost:5432/${database}`
);

// console.log("db", db);
// console.log(`[db] connecting to: ${database}`);

/*
    Queries
    TODO:   INSERT data into users table (in post /registration)
    TODO:   INSERT for signatures table needs to be changed to include the user_id (in post /petition)
    TODO:   SELECT from signatures to find out if a user has signed (post /login OR get /petition)
 
 */

module.exports.getUser = () => {
    const q = `SELECT * FROM users`;
    return db.query(q);
};

module.exports.getUserByID = (id) => {
    const q = `SELECT * FROM signatures WHERE id = ($1)`;
    const params = [id];
    return db.query(q, params);
};

module.exports.addUser = (signature, userID) => {
    const q = `INSERT INTO signatures (signature, user_id)
                VALUES ($1, $2)
                RETURNING id`;

    const params = [signature, userID];
    return db.query(q, params);
};

module.exports.numTotalUser = () => {
    const q = `SELECT COUNT(*) FROM signatures`;
    return db.query(q);
};

module.exports.signUpUser = (firstName, lastName, email, password) => {
    const q = `INSERT INTO users (first, last, email, password)
    VALUES ($1, $2, $3, $4)
    RETURNING id`;

    const params = [firstName, lastName, email, password];
    return db.query(q, params);
};

module.exports.getUserByEmail = (email) => {
    const q = `SELECT * FROM users WHERE email = ($1)`;
    const params = [email];
    return db.query(q, params);
};

module.exports.getSignatureById = (id) => {
    const q = `SELECT * FROM signatures WHERE user_id = ($1)`;
    const params = [id];
    return db.query(q, params);
};

module.exports.signUpUserProfile = (age, city, url, userID) => {
    const q = `INSERT INTO profiles (age, city, url, user_id)
    VALUES ($1, $2, $3, $4)
    RETURNING id`;

    const params = [age, city, url, userID];
    return db.query(q, params);
};

module.exports.getSignatures = () => {
    const q = `SELECT signatures.signature, signatures.user_id AS signature_user_id, users.first, users.last, profiles.age, profiles.city, profiles.url, profiles.user_id AS profiles_user_id
    FROM users
        JOIN signatures
        ON users.id = signatures.user_id
        JOIN profiles
        ON users.id = profiles.user_id`;
    return db.query(q);
};

module.exports.getSignaturesByCity = (city) => {
    const q = `SELECT signatures.signature, signatures.user_id AS signature_user_id, users.first, users.last, profiles.age, profiles.city, profiles.url, profiles.user_id AS profiles_user_id
    FROM users
        JOIN signatures
        ON users.id = signatures.user_id
        JOIN profiles
        ON users.id = profiles.user_id
        WHERE LOWER(profiles.city) = LOWER($1)`;
    const params = [city];
    return db.query(q, params);
};

// FIXME: something is wrong here, I cant finde the issue!

module.exports.getProfileUserByID = (id) => {
    const q = `SELECT user.id, users.first, users.last, users.email, users.password, profiles.age, profiles.city, profiles.url, profiles.user_id 
    FROM users 
    JOIN profiles
    ON users.id = profiles.user_id
    WHERE users.id = ($1)`;
    const params = [id];
    return db.query(q, params);
};

module.exports.getUserFromUsersByID = (id) => {
    const q = `SELECT * FROM users WHERE id = ($1)`;
    const params = [id];
    return db.query(q, params);
};


// get profile by id

module.exports.getProfileById = (id) => {
    const q = `SELECT * FROM profiles WHERE user_id = ($1)`;
    const params = [id];
    return db.query(q, params);
};

// update users
module.exports.updateUser = (firstName, lastName, email, id) => {
    const q = `UPDATE users SET first = ($1), last = ($2), email = ($3)
    WHERE id = ($4)`;
    const params = [firstName, lastName, email, id];
    return db.query(q, params);
};

// Update Users And Password
module.exports.updateUserAndPW = (firstName, lastName, email, password, id) => {
    const q = `UPDATE users SET first = ($1), last = ($2), email = ($3), password = ($4)
    WHERE id = ($5)`;

    const params = [firstName, lastName, email, password, id];
    return db.query(q, params);
};

// TODO: UPSERT!


// DELETE

module.exports.deleteSignature = (id) => {
    const q = `DELETE FROM signatures WHERE user_id = ($1)`;
    const params = [id];
    return db.query(q, params);
};