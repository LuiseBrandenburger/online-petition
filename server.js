const express = require("express");
const app = express();
const { engine } = require("express-handlebars");
const cookieSession = require("cookie-session");
let secret =
    process.env.COOKIE_SECRET || require("./secrets.json").COOKIE_SECRET;


/*************************** REQUIRE ROUTERS ***************************/

const authRouter = require("./routers/auth-router");
const editProfile = require("./routers/edit-profile");
const profile = require("./routers/profile");
const signPetition = require("./routers/sign-petition");
const signers = require("./routers/signers");

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

/*************************** ROUTES ***************************/

app.use(authRouter);
app.use(signPetition);
app.use(profile);
app.use(editProfile);
app.use(signers);

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
