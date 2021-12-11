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
    res.redirect("/");
});

app.get("*", (req, res) => {
    res.redirect("/");
});

/*************************** SERVER LISTENING ***************************/

app.listen(8080, () => console.log("petition app listening..."));

/*************************** FUNCTIONS ***************************/
