const express = require("express");
const app = express();
const {
    getUser,
    addUser,
    getUserByID,
    numTotalUser,
    signUpUser,
    getUserByEmail,
    getSignatureById,
    getSignatures,
} = require("./db");
const { engine } = require("express-handlebars");
const cookieSession = require("cookie-session");
const secret = require("./secrets.json");
const { compare, hash } = require("./bc");

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
    if (req.session.userId) {
        if (req.session.signatureId) {
            res.redirect("/thanks");
        } else {
            res.render("petition", {});
        }
    } else {
        // res.send("please log in to sign the petition");
        res.render("welcome", {
            error: true,
        });
    }
});

app.post("/petition", (req, res) => {
    if (!req.session.signatureId) {
        const data = req.body;
        addUser(data.signature, req.session.userId)
            .then(({ rows }) => {
                req.session.signatureId = rows[0].id;
                res.redirect("/thanks");
            })
            .catch((err) => {
                console.log("error adding user: ", err);
                res.render("petition", {
                    error: true,
                });
            });
    } else {
        res.redirect("/thanks");
    }
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
    if (!req.session.userId) {
        res.redirect("/login");
    } else {
        if (!req.session.signatureId) {
            res.redirect("/petition");
        } else {
            getUser()
                .then(({ rows }) => {
                    // FIXME: signature ID checken wer hat unterschrieben und wer nicht.
                    // console.log("rows users: ", rows);
                    // rows.forEach((element) => {});

                    res.render("signers", {
                        rows,
                        signed: true,
                    });
                })
                .catch((err) => {
                    console.log("error in getSignatures: ", err);
                });
        }
    }
});

app.get("/signers/:city", (req, res) => {
    /*
    GET /signers/:city - Calls a new query to get signers for the 
    city specified in the url (req.params.city). It is fine to 
    pass these rows to the exact same template as the other signers page.
     */

    console.log("reg params City: ", req.params.city);
    // pass in the req.params.city into a query and show the list of signatures in Berlin

    res.sendStatus(200);

    // if (!req.session.userId) {
    //     res.redirect("/login");
    // } else {
    //     if (!req.session.signatureId) {
    //         res.redirect("/petition");
    //     } else {
        // FIXME: 
    //     //     getSignaturesByCity(req.params.city)
    //     //         // .then(({ rows }) => {
    //     //         //     // console.log("rows users: ", rows);
    //     //         //     // rows.forEach((element) => {});
    //     //         //     res.render("signers", {
    //     //         //         rows,
    //     //         //         signed: true,
    //     //         //     });
    //     //         // })
    //     //         // .catch((err) => {
    //     //         //     console.log("error in getSignatures: ", err);
    //     //         // });
    //     // }
    // }
});

/*************************** REGISTRATION ROUTE ***************************/

app.get("/signup", (req, res) => {
    if (req.session.userId) {
        res.redirect("/petition");
    } else {
        res.render("signup", {});
    }
});

app.post("/signup", (req, res) => {
    const data = req.body;
    const pw = data.password;

    // console.log("DATA INPUT FROM SIGNUP: ",data);
    // maybe needs some fixing with Regular Expressions later
    if (data.first == "" || data.last == "" || data.email == "" || pw == "") {
        res.render("signup", {
            error: true,
        });
    } else {
        hash(pw)
            .then((hashedPw) => {
                signUpUser(data.first, data.last, data.email, hashedPw)
                    .then(({ rows }) => {
                        req.session.userId = rows[0].id;
                        res.redirect("/profile");
                    })
                    .catch((err) => {
                        console.log("error adding user: ", err);
                        res.render("signup", {
                            error: true,
                        });
                    });
            })
            .catch((err) => {
                console.log("err in hash", err);
                res.render("signup", {
                    error: true,
                });
            });
    }
});

/*************************** PROFILE ROUTE ***************************/

app.get("/profile", (req, res) => {
    // FIXME: you can only see this if you signed up
    if (req.session.userId) {
        res.render("profile", {});
    } else {
        // res.redirect("login", {});
        res.sendStatus(404);
    }
});

app.post("/profile", (req, res) => {
    const data = req.body;

    console.log("DATA INPUT FROM PROFILE: ", data);
    // maybe needs some fixing with Regular Expressions later
    if (data.age == "" || data.city == "" || data.homepage == "") {
        res.render("profile", {
            error: true,
        });
    } else if (data) {
        // check if data.homepage input is http: etc.
        console.log("data Homepage", data.homepage);
        res.sendStatus(200);
    } else {
        // TODO: push data into DB
        // signUpUser(data.age, data.city, data.homepage)
        //     .then(({ rows }) => {
        //         req.session.userId = rows[0].id;
        //         res.redirect("/profile");
        //     })
        //     .catch((err) => {
        //         console.log("error adding user: ", err);
        //         res.render("signup", {
        //             error: true,
        //         });
        //     });
        res.sendStatus(200);
    }
});

/*************************** LOGIN ROUTE ***************************/

app.get("/login", (req, res) => {
    if (req.session.userId) {
        res.redirect("/petition");
    } else {
        res.render("login", {});
    }
});

app.post("/login", (req, res) => {
    const data = req.body;
    const pw = data.password;

    getUserByEmail(data.email)
        .then(({ rows }) => {
            compare(pw, rows[0].password)
                .then((match) => {
                    if (match) {
                        req.session.userId = rows[0].id;
                        // console.log(
                        //     "session cookies after logged in: ",
                        //     req.session
                        // );
                        getSignatureById(req.session.userId).then(
                            ({ rows }) => {
                                if (rows[0].signature) {
                                    req.session.signatureId = rows[0].id;
                                    res.redirect("/thanks");
                                } else {
                                    res.redirect("/petition");
                                }
                            }
                        );
                    } else {
                        res.render("login", {
                            error: true,
                        });
                    }
                })
                .catch((err) => {
                    console.log("password error", err);
                    res.render("login", {
                        error: true,
                    });
                });
        })
        .catch((err) => {
            console.log("error finding user: ", err);
            res.render("login", {
                error: true,
            });
        });
});

/*************************** LOGOUT / REDIRECT* AND OTHER ROUTES ***************************/

app.get("/about", (req, res) => {
    res.render("about", {});
});

app.get("/logout", (req, res) => {
    req.session = null;
    res.render("logout", {});
});

app.get("*", (req, res) => {
    res.redirect("/");
});

/*************************** SERVER LISTENING ***************************/

app.listen(8080, () => console.log("petition app listening..."));

/*************************** FUNCTIONS ***************************/
