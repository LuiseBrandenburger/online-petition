const spicedPg = require("spiced-pg");

const database = "petition";
const username = "postgres";
const password = "postgres";
const tableName = "signatures";

const db = spicedPg(
    `postgres:${username}:${password}@localhost:5432/${database}`
);

console.log("db", db);
console.log(`[db] connecting to: ${database}`);

// columns: id, first, last, signature
/*
    queries
    INSERT the user's signature and name
    SELECT first and last names of every signer
    SELECT to get a total number of signers
 */

module.exports.getUser = () => {
    const q = `SELECT * FROM ${tableName}`;
    return db.query(q);
};

// FIXME: Fix the ID Function!!
module.exports.getUserByID = (id) => {
    const q = `SELECT * FROM ${tableName} WHERE id = ($1)`; //TODO: check again!! REMEBER pg
    const params = [id];
    return db.query(q, params);
};

module.exports.addUser = (firstName, lastName, signature) => {
    // i want to run an insert statement
    const q = `INSERT INTO ${tableName} (first, last, signature)
                VALUES ($1, $2, $3)
                RETURNING id`;
    // RETURNING id
    const params = [firstName, lastName, signature];
    return db.query(q, params);
};

module.exports.numTotalUser = () => {
    const q = `SELECT COUNT(*) FROM ${tableName}`;
    return db.query(q);
};
