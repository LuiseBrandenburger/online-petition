const express = require("express");
const app = express();
const { getUser, addUser, getUserByID, numTotalUser } = require("./db");
const { engine } = require("express-handlebars");
const cookieSession = require("cookie-session");
const secret = require("./secrets.json");

/*
    FIXME:  dont forget to start psql service: sudo service postgresql start
*/

/*************************** VIEW ENGINE ***************************/

app.engine("handlebars", engine());
app.set("view engine", "handlebars");

/*************************** MIDDLEWARE ***************************/

// FIXME:   Check die Reihenfolge am Ende!

// prevent Clickjacking
app.use((req, res, next) => {
    res.setHeader("x-frame-options", "deny");
    next();
});

app.use(
    cookieSession({
        secret: secret.COOKIE_SECRET,
        maxAge: 1000 * 60 * 60 * 24 * 14,
        sameSite: true,
    })
);
app.use(express.urlencoded({ extended: false }));
app.use(express.static(`${__dirname}/public`));

/*************************** ROUTES ***************************/

app.get("/", (req, res) => {
    res.render("welcome", {});
});

app.get("/petition", (req, res) => {
    if (req.session.signatureId) {
        res.redirect("/thanks");
    } else {
        res.render("petition", {});
    }
});

app.post("/petition", (req, res) => {
    /*

    TODO: alter your route so that you pass userId from the cookie to your query instead of first and last name
            TODO:   first and last are not required anymore
            TODO:   update database function to no longer need these values
            TODO:   instead of first and last make sure you enter the user's id into the database
    
    */

    const data = req.body;

    addUser(data.first, data.last, data.signature)
        .then(({ rows }) => {
            // set cookie to ID of the signature in db
            req.session.first = data.first;
            req.session.last = data.last;
            req.session.signatureId = rows[0].id;
            res.redirect("/thanks");
        })
        .catch((err) => {
            console.log("error adding user: ", err);
            res.render("petition", {
                error: true,
            });
        });
});

app.get("/thanks", (req, res) => {
    if (req.session.signatureId) {
        Promise.all([getUserByID(req.session.signatureId), numTotalUser()])
            .then((result) => {
                res.render("thanks", {
                    count: result[1].rows[0].count,
                    signatureURL: result[0].rows[0].signature,
                });
            })
            .catch((err) => {
                console.log(err);
            });
    } else {
        res.redirect("/petition");
    }
});

app.get("/signers", (req, res) => {
    if (!req.session.signatureId) {
        res.redirect("/petition");
    }

    // Promise.all

    getUser()
        .then(({ rows }) => {
            // console.log("rows: ", rows);
            res.render("signers", {
                rows,
                signed: true,
            });
        })
        .catch((err) => {
            console.log("error in getUser: ", err);
        });
});

app.get("/about", (req, res) => {
    res.render("about", {});
});

app.get("/logout", (req, res) => {
    req.session = null;
    res.render("logout", {});
});


/*************************** REGISTRATION & LOGIN ROUTES ***************************/

// FIXME: *************************************************************** SIGNUP


app.get("/signup", (req, res) => {
    res.render("signup", {});
});

app.post("/signup", (req, res) => {
    /*
    
    POST /register
    TODO:   grab the user input and read it on the server
    TODO:   hash the password that the user typed and THEN
    TODO:   insert a row in the USERS table (new table) 
            -> see 3. for table structure
    TODO:   if the insert is successful, add userId in a cookie 
            (value should be the id created by postgres when the row was inserted).
    TODO:   if insert fails, re-render template with an error message
    */

    const data = req.body;

    console.log(data);

    // addUser(data.first, data.last, data.signature)
    //     .then(({ rows }) => {
    //         // set cookie to ID of the signature in db
    //         req.session.first = data.first;
    //         req.session.last = data.last;
    //         req.session.signatureId = rows[0].id;
    //         res.redirect("/thanks");
    //     })
    //     .catch((err) => {
    //         console.log("error adding user: ", err);
    //         res.render("petition", {
    //             error: true,
    //         });
    //     });
    res.send("this worked!");
});

// FIXME: *************************************************************** LOGIN

app.get("/login", (req, res) => {
    res.render("login", {});
});

app.post("/login", (req, res) => {
    /*
    POST /login

    TODO:   get the user's stored hashed password from the db using the user's email address
    TODO:   pass the hashed password to COMPARE along with the password the user typed in the input field
            TODO:   if they match, COMPARE returns a boolean value of true
                    TODO:   store the userId in a cookie
                    TODO:   do a db query to find out if they've signed
                            TODO:   if yes, you want to put their sigId in a cookie & redirect to /thanks
                            TODO:   if not, redirect to /petition
            TODO:   if they don't match, COMPARE returns a boolean value of false & re-render with an error message 
    */

    const data = req.body;

    console.log(data);

    // addUser(data.first, data.last, data.signature)
    //     .then(({ rows }) => {
    //         // set cookie to ID of the signature in db
    //         req.session.first = data.first;
    //         req.session.last = data.last;
    //         req.session.signatureId = rows[0].id;
    //         res.redirect("/thanks");
    //     })
    //     .catch((err) => {
    //         console.log("error adding user: ", err);
    //         res.render("petition", {
    //             error: true,
    //         });
    //     });

    res.send("this worked!");
});


/*************************** SERVER LISTENING ***************************/

app.get("*", (req, res) => {
    res.redirect("/");
});


app.listen(8080, () => console.log("petition app listening..."));

/*************************** FUNCTIONS ***************************/
