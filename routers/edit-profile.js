const express = require("express");
const editProfile = express.Router();
const {
    getProfileUserByID,
    getProfileById,
    updateUser,
    updateUserAndPW,
    getUserFromUsersByID,
    upsertUserProfile,
} = require("../db");
const { hash } = require("../bc");

/*************************** PROFILE EDIT HERE ***************************/

editProfile.get("/profile/edit", (req, res) => {
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

editProfile.post("/profile/edit", (req, res) => {
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

module.exports = editProfile;
