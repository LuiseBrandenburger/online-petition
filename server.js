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
    signUpUserProfile,
    getSignatures,
    getSignaturesByCity,
    getProfileUserByID,
    getProfileById,
} = require("./db");
const { engine } = require("express-handlebars");
const cookieSession = require("cookie-session");
let secret =
    process.env.COOKIE_SECRET || require("./secrets.json").COOKIE_SECRET;
const { compare, hash } = require("./bc");

/*
    FIXME:  dont forget to start psql service: sudo service postgresql start
*/

/*************************** VIEW ENGINE ***************************/

app.engine("handlebars", engine());
app.set("view engine", "handlebars");

/*************************** MIDDLEWARE ***************************/

if (process.env.NODE_ENV == "production") {
    app.use((req, res, next) => {
        if (req.headers["x-forwarded-proto"].startsWith("https")) {
            return next();
        }
        res.redirect(`https://${req.hostname}${req.url}`);
    });
}

app.use((req, res, next) => {
    res.setHeader("x-frame-options", "deny");
    next();
});

app.use(
    cookieSession({
        secret: secret,
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
    if (req.session.userId) {
        if (req.session.signatureId) {
            res.redirect("/thanks");
        } else {
            res.render("profile", {});
        }
    } else {
        res.render("404", {});
    }
});

app.post("/profile", (req, res) => {
    const data = req.body;

    if (
        data.age.length !== 0 ||
        data.city.length !== 0 ||
        data.homepage.length !== 0
    ) {
        if (
            data.homepage.startsWith("http:") ||
            data.homepage.startsWith("https:") ||
            data.homepage.startsWith("//")
        ) {
            signUpUserProfile(
                data.age,
                data.city,
                data.homepage,
                req.session.userId
            )
                .then(({ rows }) => {
                    req.session.userId = rows[0].id;
                    req.session.profileId = rows[0].id;
                    console.log(
                        "Session Cookies after setting up user profile: ",
                        req.session
                    );
                    res.redirect("/petition");
                })
                .catch((err) => {
                    console.log("error adding profile: ", err);
                    res.render("profile", {
                        error: true,
                    });
                });
        }
    } else {
        res.render("profile", {
            error: true,
        });
    }
});

/*************************** LOGIN ROUTE ***************************/

app.get("/login", (req, res) => {
    if (req.session.userId) {
        if (!req.session.signatureId) {
            res.redirect("/petition");
        } else {
            res.redirect("/thanks");
        }
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

/*************************** SIGNERS ***************************/

app.get("/signers", (req, res) => {
    if (!req.session.userId) {
        res.redirect("/login");
    } else {
        if (!req.session.signatureId) {
            res.redirect("/petition");
        } else {
            getSignatures()
                .then(({ rows }) => {
                    console.log("rows of signatures: ", rows);
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
    if (!req.session.userId) {
        res.redirect("/login");
    } else {
        if (!req.session.signatureId) {
            res.redirect("/petition");
        } else {
            getSignaturesByCity(req.params.city)
                .then(({ rows }) => {
                    console.log("rows users: ", rows);
                    // FIXME: how can i render it correctly?
                    res.render("signers", {
                        rows,
                        // city: false,
                        // signed: true,
                    });
                })
                .catch((err) => {
                    console.log("error in getSignatures: ", err);
                });
        }
    }
});

/*************************** EDIT ROUTES ***************************/

app.get("/profile/edit", (req, res) => {
    if (!req.session.userId) {
        res.redirect("/login");
    } else {
        getProfileUserByID(req.session.userId).then(({ rows }) => {
            res.render("edit", {
                first: rows[0].first,
                last: rows[0].last,
                email: rows[0].email,
                age: rows[0].age,
                city: rows[0].city,
                url: rows[0].url,
            });
        });
    }
});

app.post("/profile/edit", (req, res) => {
    console.log(req.body.password);
    if (!req.body.password) {
        // user has left their password as it is
        // update users table and profiles table without a new password
        /*
        First Block (user has NOT updated their password)

        We need to update TWO tables
        TODO: UPDATE users table: first, last, email
        TODO: UPDATE user_profiles table: age, city, url (if row in table exists)
        We need 2 separate queries for this as there is no UPDATE JOIN

        ALSO: we need to consider that the user might have skipped the profile page without filling it in.

        In this case, they won't have a row to update in this table and this will cause an error
        SOLUTION: 
        TODO: We need to first of all check if they have a row
        TODO: If they don't, create one
        TODO: If they do, update it
        This is called an UPSERT and it looks like this
         */

        // TODO:    1. check if user has a row in profile table

        // get profile by id
        getProfileById().then(({ rows }) => {
            console.log("get profiles by id: ", rows);
            res.sendStatus(200);
        });

        // Promise.all([getUserByID(req.session.signatureId), numTotalUser()])
        //     .then((result) => {
        //         res.render("thanks", {
        //             count: result[1].rows[0].count,
        //             signatureURL: result[0].rows[0].signature,
        //         });
        //     })
        //     .catch((err) => {
        //         console.log(err);
        //     });
    } else {
        getProfileById().then(({ rows }) => {
            console.log("get profiles by id: ", rows);
            res.sendStatus(200);
        });

        // user has updated their password
        // update users table and profiles table with a new password
    }
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

app.listen(process.env.PORT || 8080, () =>
    console.log("petition app listening...")
);

/*************************** FUNCTIONS ***************************/
