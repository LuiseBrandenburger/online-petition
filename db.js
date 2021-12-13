const spicedPg = require("spiced-pg");

const database = "petition";
const username = "postgres";
const password = "postgres";
const tableName = "signatures";
const tableNameUser = "users";

const db = spicedPg(
    `postgres:${username}:${password}@localhost:5432/${database}`
);

console.log("db", db);
console.log(`[db] connecting to: ${database}`);


module.exports.getUser = () => {
    const q = `SELECT * FROM ${tableName}`;
    return db.query(q);
};

module.exports.getUserByID = (id) => {
    const q = `SELECT * FROM ${tableName} WHERE id = ($1)`; 
    const params = [id];
    return db.query(q, params);
};

module.exports.addUser = (firstName, lastName, signature) => {

    const q = `INSERT INTO ${tableName} (first, last, signature)
                VALUES ($1, $2, $3)
                RETURNING id`;

    const params = [firstName, lastName, signature];
    return db.query(q, params);
};

module.exports.numTotalUser = () => {
    const q = `SELECT COUNT(*) FROM ${tableName}`;
    return db.query(q);
};


/*
    Queries
    TODO:   INSERT data into users table (in post /registration)
    TODO:   SELECT to get user info by email address (in post /login)
    TODO:   INSERT for signatures table needs to be changed to include the user_id (in post /petition)
    TODO:   SELECT from signatures to find out if a user has signed (post /login OR get /petition)
 
 */


