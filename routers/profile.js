const express = require("express");
const profile = express.Router();
const {
    signUpUserProfile,
} = require("../db");


/*************************** PROFILE ROUTE ***************************/

profile.get("/profile", (req, res) => {
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

profile.post("/profile", (req, res) => {
    const data = req.body;
    console.log("log data.age: ", data.age);

    if (data.url.length !== 0) {
        if (
            data.url.toLowerCase().startsWith("http:") ||
            data.url.toLowerCase().startsWith("https:") ||
            data.url.toLowerCase().startsWith("//")
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
    } else if (data.url.toLowerCase().length === 0) {
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

module.exports = profile;
