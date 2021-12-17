const express = require("express");
const app = express();
const signers = express.Router();
const { getSignatures, getSignaturesByCity } = require("../db");

app.locals.helpers = {
    toLowerCase(text) {
        return text.toLowerCase();
    },
};

/*************************** SIGNERS ***************************/

signers.get("/signers", (req, res) => {
    if (!req.session.userId) {
        res.redirect("/login");
    } else {
        if (!req.session.signatureId) {
            res.redirect("/petition");
        } else {
            getSignatures()
                .then(({ rows }) => {
                    res.render("signers", {
                        rows,
                        signed: true,
                        // url: true,
                    });
                })
                .catch((err) => {
                    console.log("error in getSignatures: ", err);
                });
        }
    }
});

signers.get("/signers/:city", (req, res) => {
    if (!req.session.userId) {
        res.redirect("/login");
    } else {
        if (!req.session.signatureId) {
            res.redirect("/petition");
        } else {
            getSignaturesByCity(req.params.city)
                .then(({ rows }) => {
                    res.render("signers", {
                        rows,
                        helpers: {
                            ...app.locals.helpers,
                        },
                    });
                })
                .catch((err) => {
                    console.log("error in getSignatures: ", err);
                });
        }
    }
});

module.exports = signers;
