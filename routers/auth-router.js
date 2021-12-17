const express = require("express");
const authRouter = express.Router();
const { signUpUser, getUserByEmail, getSignatureById } = require("../db");
const { compare, hash } = require("../bc");

/*************************** ROUTES ***************************/

authRouter.get("/", (req, res) => {
    if (req.session.userId) {
        if (!req.session.signatureId) {
            res.render("welcome", {
                loggedIn: true,
            });
        } else {
            res.render("welcome", {
                loggedInAndSignedPetition: true,
            });
        }
    } else {
        res.render("welcome", {});
    }
});

/*************************** REGISTRATION ROUTE ***************************/

authRouter.get("/signup", (req, res) => {
    if (req.session.userId) {
        res.redirect("/petition");
    } else {
        res.render("signup", {});
    }
});

authRouter.post("/signup", (req, res) => {
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

authRouter.get("/login", (req, res) => {
    if (req.session.userId) {
        if (!req.session.signatureId) {
            res.redirect("/petition");
        } else {
            res.redirect("/thanks", {});
        }
    } else {
        res.render("login", {});
    }
});

authRouter.post("/login", (req, res) => {
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

authRouter.get("/logout", (req, res) => {
    req.session = null;
    res.render("logout", {});
});

module.exports = authRouter;
