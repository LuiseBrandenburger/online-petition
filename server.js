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
    console.log("log data.age: ", data.age);

    if (data.url.length !== 0) {
        if (
            data.url.startsWith("http:") ||
            data.url.startsWith("https:") ||
            data.url.startsWith("//")
        ) {
            if (data.age.length === 0) {
                data.age = 0;
            }
            signUpUserProfile(data.age, data.city, data.url, req.session.userId)
                .then(() => {
                    res.redirect("/petition");
                })
                .catch((err) => {
                    console.log("error adding profile: ", err);
                    res.render("profile", {
                        error: true,
                    });
                });
        } else {
            res.render("profile", {
                wrongUrl: true,
            });
        }
    } else if (data.url.length === 0) {
        if (data.age.length === 0) {
            data.age = 0;
        }
        signUpUserProfile(data.age, data.city, data.url, req.session.userId)
            .then(() => {
                res.redirect("/petition");
            })
            .catch((err) => {
                console.log("error adding profile: ", err);
                res.render("profile", {
                    error: true,
                });
            });
    } else {
        res.redirect("/petition");
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

/*************************** PROFILE EDIT HERE ***************************/

app.get("/profile/edit", (req, res) => {
    if (!req.session.userId) {
        res.redirect("/login");
    } else {
        getProfileById(req.session.userId).then(({ rows }) => {
            if (rows.length > 0) {
                getProfileUserByID(req.session.userId)
                    .then(({ rows }) => {
                        if (rows.length > 0) {
                            if (rows[0].age === 0) {
                                rows[0].age = "";
                            }
                            res.render("edit", {
                                first: rows[0].first,
                                last: rows[0].last,
                                email: rows[0].email,
                                age: rows[0].age,
                                city: rows[0].city,
                                url: rows[0].url,
                            });
                        } else {
                            res.render("edit", {
                                first: rows[0].first,
                                last: rows[0].last,
                                email: rows[0].email,
                                age: "",
                                city: "",
                                url: "",
                            });
                        }
                    })
                    .catch((err) => {
                        console.log(
                            "something went wrong with the query:",
                            err
                        );
                    });
            } else {
                getUserFromUsersByID(req.session.userId).then(({ rows }) => {
                    res.render("edit", {
                        first: rows[0].first,
                        last: rows[0].last,
                        email: rows[0].email,
                        age: "",
                        city: "",
                        url: "",
                    });
                });
            }
        });
    }
});

app.post("/profile/edit", (req, res) => {
    const data = req.body;
    const password = data.password;

    if (data.age.length === 0) {
        data.age = 0;
    }

    if (data.url.length !== 0) {
        if (
            data.url.startsWith("http:") ||
            data.url.startsWith("https:") ||
            data.url.startsWith("//")
        ) {
            if (!req.body.password) {
                if (data.first.length === 0 || data.last.length === 0) {
                    Promise.all([
                        getUserFromUsersByID(req.session.userId),
                        getProfileById(req.session.userId),
                    ])
                        .then((results) => {
                            if (results[1].rows[0].age === 0) {
                                results[1].rows[0].age = "";
                            }
                            res.render("edit", {
                                first: results[0].rows[0].first,
                                last: results[0].rows[0].last,
                                email: results[0].rows[0].email,
                                age: results[1].rows[0].age,
                                city: results[1].rows[0].city,
                                url: results[1].rows[0].url,
                                noNameInput: true,
                            });
                        })
                        .catch((err) => {
                            console.log("error aupdating Profile data: ", err);
                            res.render("edit", {
                                error: true,
                            });
                        });
                } else {
                    Promise.all([
                        updateUser(
                            data.first,
                            data.last,
                            data.email,
                            req.session.userId
                        ),
                        upsertUserProfile(
                            data.age,
                            data.city,
                            data.url,
                            req.session.userId
                        ),
                    ])
                        .then(() => {
                            Promise.all([
                                getUserFromUsersByID(req.session.userId),
                                getProfileById(req.session.userId),
                            ]).then((results) => {
                                if (results[1].rows[0].age === 0) {
                                    results[1].rows[0].age = "";
                                }
                                res.render("edit", {
                                    first: results[0].rows[0].first,
                                    last: results[0].rows[0].last,
                                    email: results[0].rows[0].email,
                                    age: results[1].rows[0].age,
                                    city: results[1].rows[0].city,
                                    url: results[1].rows[0].url,
                                    updated: true,
                                });
                            });
                        })
                        .catch((err) => {
                            console.log(
                                "error aupdating new Profile data: ",
                                err
                            );
                            res.render("edit", {
                                error: true,
                            });
                        });
                }
            } else {
                if (data.first.length === 0 || data.last.length === 0) {
                    Promise.all([
                        getUserFromUsersByID(req.session.userId),
                        getProfileById(req.session.userId),
                    ])
                        .then((results) => {
                            if (results[1].rows[0].age === 0) {
                                results[1].rows[0].age = "";
                            }
                            res.render("edit", {
                                first: results[0].rows[0].first,
                                last: results[0].rows[0].last,
                                email: results[0].rows[0].email,
                                age: results[1].rows[0].age,
                                city: results[1].rows[0].city,
                                url: results[1].rows[0].url,
                                noNameInput: true,
                            });
                        })
                        .catch((err) => {
                            console.log("error aupdating Profile data: ", err);
                            res.render("edit", {
                                error: true,
                            });
                        });
                } else {
                    hash(password)
                        .then((hashedPw) => {
                            Promise.all([
                                updateUserAndPW(
                                    data.first,
                                    data.last,
                                    data.email,
                                    hashedPw,
                                    req.session.userId
                                ),
                                upsertUserProfile(
                                    data.age,
                                    data.city,
                                    data.url,
                                    req.session.userId
                                ),
                            ])
                                .then(() => {
                                    Promise.all([
                                        getUserFromUsersByID(
                                            req.session.userId
                                        ),
                                        getProfileById(req.session.userId),
                                    ]).then((results) => {
                                        if (results[1].rows[0].age === 0) {
                                            results[1].rows[0].age = "";
                                        }
                                        res.render("edit", {
                                            first: results[0].rows[0].first,
                                            last: results[0].rows[0].last,
                                            email: results[0].rows[0].email,
                                            age: results[1].rows[0].age,
                                            city: results[1].rows[0].city,
                                            url: results[1].rows[0].url,
                                            updated: true,
                                        });
                                    });
                                })
                                .catch((err) => {
                                    console.log(
                                        "error aupdating new Profile data: ",
                                        err
                                    );
                                    res.render("edit", {
                                        error: true,
                                    });
                                });
                        })
                        .catch((err) => {
                            console.log("err in hash", err);
                            res.render("edit", {
                                error: true,
                            });
                        });
                }
            }
        } else {
            if (data.first.length === 0 || data.last.length === 0) {
                Promise.all([
                    getUserFromUsersByID(req.session.userId),
                    getProfileById(req.session.userId),
                ])
                    .then((results) => {
                        if (results[1].rows[0].age === 0) {
                            results[1].rows[0].age = "";
                        }
                        res.render("edit", {
                            first: results[0].rows[0].first,
                            last: results[0].rows[0].last,
                            email: results[0].rows[0].email,
                            age: results[1].rows[0].age,
                            city: results[1].rows[0].city,
                            url: results[1].rows[0].url,
                            noNameInput: true,
                        });
                    })
                    .catch((err) => {
                        console.log("error aupdating Profile data: ", err);
                        res.render("edit", {
                            error: true,
                        });
                    });
            } else {
                Promise.all([
                    getUserFromUsersByID(req.session.userId),
                    getProfileById(req.session.userId),
                ])
                    .then((results) => {
                        if (results[1].rows[0].age === 0) {
                            results[1].rows[0].age = "";
                        }
                        res.render("edit", {
                            first: results[0].rows[0].first,
                            last: results[0].rows[0].last,
                            email: results[0].rows[0].email,
                            age: results[1].rows[0].age,
                            city: results[1].rows[0].city,
                            url: results[1].rows[0].url,
                            wrongUrl: true,
                        });
                    })
                    .catch((err) => {
                        console.log("error aupdating Profile data: ", err);
                        res.render("edit", {
                            error: true,
                        });
                    });
            }
        }
    } else if (data.url.length === 0) {
        if (!req.body.password) {
            if (data.first.length === 0 || data.last.length === 0) {
                Promise.all([
                    getUserFromUsersByID(req.session.userId),
                    getProfileById(req.session.userId),
                ])
                    .then((results) => {
                        if (results[1].rows[0].age === 0) {
                            results[1].rows[0].age = "";
                        }
                        res.render("edit", {
                            first: results[0].rows[0].first,
                            last: results[0].rows[0].last,
                            email: results[0].rows[0].email,
                            age: results[1].rows[0].age,
                            city: results[1].rows[0].city,
                            url: results[1].rows[0].url,
                            noNameInput: true,
                        });
                    })
                    .catch((err) => {
                        console.log("error aupdating Profile data: ", err);
                        res.render("edit", {
                            error: true,
                        });
                    });
            } else {
                Promise.all([
                    updateUser(
                        data.first,
                        data.last,
                        data.email,
                        req.session.userId
                    ),
                    upsertUserProfile(
                        data.age,
                        data.city,
                        data.url,
                        req.session.userId
                    ),
                ])
                    .then(() => {
                        Promise.all([
                            getUserFromUsersByID(req.session.userId),
                            getProfileById(req.session.userId),
                        ]).then((results) => {
                            if (results[1].rows[0].age === 0) {
                                results[1].rows[0].age = "";
                            }
                            res.render("edit", {
                                first: results[0].rows[0].first,
                                last: results[0].rows[0].last,
                                email: results[0].rows[0].email,
                                age: results[1].rows[0].age,
                                city: results[1].rows[0].city,
                                url: results[1].rows[0].url,
                                updated: true,
                            });
                        });
                    })
                    .catch((err) => {
                        console.log("error aupdating new Profile data: ", err);
                        res.render("edit", {
                            error: true,
                        });
                    });
            }
        } else {
            if (data.first.length === 0 || data.last.length === 0) {
                Promise.all([
                    getUserFromUsersByID(req.session.userId),
                    getProfileById(req.session.userId),
                ])
                    .then((results) => {
                        if (results[1].rows[0].age === 0) {
                            results[1].rows[0].age = "";
                        }
                        res.render("edit", {
                            first: results[0].rows[0].first,
                            last: results[0].rows[0].last,
                            email: results[0].rows[0].email,
                            age: results[1].rows[0].age,
                            city: results[1].rows[0].city,
                            url: results[1].rows[0].url,
                            noNameInput: true,
                        });
                    })
                    .catch((err) => {
                        console.log("error aupdating Profile data: ", err);
                        res.render("edit", {
                            error: true,
                        });
                    });
            } else {
                hash(password)
                    .then((hashedPw) => {
                        if (data.age.length === 0) {
                            data.age = 0;
                        }
                        Promise.all([
                            updateUserAndPW(
                                data.first,
                                data.last,
                                data.email,
                                hashedPw,
                                req.session.userId
                            ),
                            upsertUserProfile(
                                data.age,
                                data.city,
                                data.url,
                                req.session.userId
                            ),
                        ])
                            .then(() => {
                                Promise.all([
                                    getUserFromUsersByID(req.session.userId),
                                    getProfileById(req.session.userId),
                                ]).then((results) => {
                                    if (results[1].rows[0].age === 0) {
                                        results[1].rows[0].age = "";
                                    }
                                    res.render("edit", {
                                        first: results[0].rows[0].first,
                                        last: results[0].rows[0].last,
                                        email: results[0].rows[0].email,
                                        age: results[1].rows[0].age,
                                        city: results[1].rows[0].city,
                                        url: results[1].rows[0].url,
                                        updated: true,
                                    });
                                });
                            })
                            .catch((err) => {
                                console.log(
                                    "error aupdating new Profile data: ",
                                    err
                                );
                                res.render("edit", {
                                    error: true,
                                });
                            });
                    })
                    .catch((err) => {
                        console.log("err in hash", err);
                        res.render("edit", {
                            error: true,
                        });
                    });
            }
        }
    }
});

/*************************** SIGN PETITION ***************************/

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
