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

module.exports.addUser = (signature, userID) => {

    const q = `INSERT INTO ${tableName} (signature, user_id)
                VALUES ($1, $2)
                RETURNING id`;

    const params = [signature, userID];
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
    TODO:   INSERT for signatures table needs to be changed to FIXME: include the user_id (in post /petition)
    TODO:   SELECT from signatures to find out if a user has signed (post /login OR get /petition)
 
 */

module.exports.signUpUser = (firstName, lastName, email, password ) => {
    const q = `INSERT INTO ${tableNameUser} (first, last, email, password)
                VALUES ($1, $2, $3, $4)
                RETURNING id`;

    const params = [firstName, lastName, email, password];
    return db.query(q, params);
};

module.exports.getUserByEmail = (email) => {
    // falls es nicht klappen sollte ($1) in single quotes stecken!
    
    const q = `SELECT * FROM ${tableNameUser} WHERE email = ($1)`;
    const params = [email];
    return db.query(q, params);
};



