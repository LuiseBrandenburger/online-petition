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

// FIXME: ????
module.exports.getUser = () => {
    const q = `SELECT * FROM ${tableName}`;
    return db.query(q);
};

// FIXME: ????
module.exports.addUser = (firstName, lastName, signature) => {
    // i want to run an insert statement
    const q = `INSERT INTO ${tableName} (first, last, signature)
                VALUES ($1, $2, $3)`;
    // pg takes whatever is passed in and escapes any evil stuff
    // code david wrote for us :)
    // die order ist wichtig!!!
    const params = [firstName, lastName, signature];
    return db.query(q, params);
};

// FIXME: ???? SELECT first and last names of every signer
module.exports.selectUser = (firstName, lastName) => {
    const q = `SELECT (first, last) FROM ${tableName}`;
    return db.query(q);
};

// TODO: SELECT to get a total number of signers
module.exports.numTotalUser = () => {
    const q = `SELECT COUNT(*) FROM ${tableName}`;
    return db.query(q);
};
