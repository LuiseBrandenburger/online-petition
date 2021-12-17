const express = require("express");
const profile = express.Router();
const {
    // addUser,
    // getUserByID,
    // numTotalUser,
    // signUpUser,
    // getUserByEmail,
    // getSignatureById,
    signUpUserProfile,
    // getSignatures,
    // getSignaturesByCity,
    // getProfileUserByID,
    // getProfileById,
    // updateUser,
    // updateUserAndPW,
    // deleteSignature,
    // getUserFromUsersByID,
    // upsertUserProfile,
} = require("../db");
// const { compare, hash } = require("../bc");


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

module.exports = profile;
