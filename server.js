const express = require("express");
const app = express();
const {
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
    updateUser,
    updateUserAndPW,
    deleteSignature,
    getUserFromUsersByID,
    upsertUserProfile,
} = require("./db");
const { engine } = require("express-handlebars");
const cookieSession = require("cookie-session");
let secret =
    process.env.COOKIE_SECRET || require("./secrets.json").COOKIE_SECRET;
const { compare, hash } = require("./bc");

/*************************** REQUIRE ROUTERS ***************************/

const authRouter = require("./routers/auth-router");
const editProfile = require("./routers/edit-profile");
const profile = require("./routers/profile");
const signPetition = require("./routers/sign-petition");

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

app.locals.helpers = {
    toLowerCase(text) {
        return text.toLowerCase();
    },
};

// TODO: Update Middleware! Make Code look nice!

/*************************** ROUTES MIDLLEWARE ***************************/

app.use(authRouter);
app.use(signPetition);
app.use(profile);
app.use(editProfile);


/*************************** ROUTES ***************************/

app.get("/", (req, res) => {
    if (req.session.userId) {
        res.render("welcome", {
            loggedIn: true,
        });
    } else {
        res.render("welcome", {});
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


// /*************************** SIGN PETITION ***************************/

// app.get("/petition", (req, res) => {
//     if (req.session.userId) {
//         if (req.session.signatureId) {
//             res.redirect("/thanks");
//         } else {
//             res.render("petition", {});
//         }
//     } else {
//         res.render("welcome", {
//             error: true,
//         });
//     }
// });

// app.post("/petition", (req, res) => {
//     if (!req.session.signatureId) {
//         const data = req.body;
//         addUser(data.signature, req.session.userId)
//             .then(({ rows }) => {
//                 req.session.signatureId = rows[0].id;
//                 res.redirect("/thanks");
//             })
//             .catch((err) => {
//                 console.log("error adding user: ", err);
//                 res.render("petition", {
//                     error: true,
//                 });
//             });
//     } else {
//         res.redirect("/thanks");
//     }
// });

// app.get("/thanks", (req, res) => {
//     if (req.session.signatureId) {
//         Promise.all([getUserByID(req.session.signatureId), numTotalUser()])
//             .then((result) => {
//                 res.render("thanks", {
//                     count: result[1].rows[0].count,
//                     signatureURL: result[0].rows[0].signature,
//                 });
//             })
//             .catch((err) => {
//                 console.log(err);
//             });
//     } else {
//         res.redirect("/petition");
//     }
// });

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
                    res.render("signers", {
                        rows,
                        helpers: {
                            ...app.locals.helpers,
                        },
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

/*************************** LOGOUT / REDIRECT* AND OTHER ROUTES ***************************/

app.post("/thanks/delete", (req, res) => {
    deleteSignature(req.session.userId)
        .then(() => {
            req.session.signatureId = null;
            res.redirect("/petition");
        })
        .catch((err) => {
            console.log(err);
            res.sendStatus(200);
        });
});

app.get("/logout", (req, res) => {
    req.session = null;
    res.render("logout", {});
});

app.get("*", (req, res) => {
    res.redirect("/");
});

/*************************** SERVER LISTENING ***************************/

if (require.main == module) {
    app.listen(process.env.PORT || 8080, () =>
        console.log("petition app listening...")
    );
}

module.exports.app = app;
