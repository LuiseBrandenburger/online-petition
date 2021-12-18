const express = require("express");
const signPetition = express.Router();
const {
    addUser,
    getUserByID,
    numTotalUser,
    deleteSignature,
} = require("../db");

/*************************** SIGN PETITION ***************************/

signPetition.get("/petition", (req, res) => {
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

signPetition.post("/petition", (req, res) => {
    if (!req.session.signatureId) {
        const data = req.body;

        console.log("data signature:", data.signature);
        console.log("data signature length: ", data.signature.legth);

        if (data.signature === "") {
            res.render("petition", {
                error: true,
                noSignature: true,
            });
        } else {
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
        }
    } else {
        res.redirect("/thanks");
    }
});

signPetition.get("/thanks", (req, res) => {
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

signPetition.post("/thanks/delete", (req, res) => {
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

module.exports = signPetition;
