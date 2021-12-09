const cookieParser = require("cookie-parser");
const express = require("express");
const app = express();
const { getUser, addUser, selectUser, numTotalUser } = require("./db");
const { engine } = require("express-handlebars");

/*
TODO:
    dont forget to start psql service: sudo service postgresql start
*/

/*************************** VIEW ENGINE ***************************/

app.engine("handlebars", engine());
app.set("view engine", "handlebars");

app.locals.helpers = {
    // TODO: incase its needed later
    // functionName() {
    //     return Math.floor(Math.random() * 200);
    //     // return console.log("hello inside highlight Item")
    // },
};

/*************************** MIDDLEWARE ***************************/

// FIXME: Check die Reihenfolge am Ende!

app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(`${__dirname}/public`));

/*************************** ROUTES ***************************/

app.get("/", (req, res) => {
    res.render("welcome", {
        helpers: {
            ...app.locals.helpers,
        },
    });
});

app.get("/petition", (req, res) => {
    /* TODO:
        * IF the user has already signed the petition, it 
        redirects to /thanks (→ check your cookie for this...)
        * IF user has not yet signed, it renders 
        petition.handlebars
    */

    // TODO: als MIDDLEWARE einfügen???
    // if (req.cookies.signature) {
    //     console.log("there are cookies");
    //     res.render("thanks", {});
    // } else {
    //     console.log("there are no cookies");
    //     res.redirect("/petition");
    // }

    res.render("petition", {});
    // console.log("im a GET Request on the petition page!!");
    // res.send("im a GET Request on the petition page!!");
});

app.post("/petition", (req, res) => {
    /*
        * runs when the user submits their signature, i.e. 
            clicks submit - check
        * attempts toINSERT all data to submit into a 
            designated table into your database, you will 
            get this data from req.body - check TODO: (except for signature)
        * IF the db insert fails (i.e. your promise from 
            the db query gets rejected), rerender 
            petition.handlebars and pass an indication that 
            there should be an error message shown to the 
            template
        * IF there is no error
            - TODO: set cookie to remember that the user has signed (do this last → this logic will change in the future)
            - redirect to thank you page
    */

    const data = req.body;
    // console.log("here is the data", data);

    addUser(data.first, data.last, "data.signature")
        .then(() => {
            // TODO: set signature cookies
            res.cookie("first", data.first);
            res.cookie("last", data.last);
            res.cookie("signature", true);
            res.redirect("/thanks");
        })
        .catch((err) => {
            console.log("error adding user: ", err);
            res.render("petition", {
                // wenn error true ist, render eine error message
                error: true,
            });
        });
});

app.get("/thanks", (req, res) => {
    /*
        * renders the thanks.handlebars template
        * However this should only be visible to those that have signed, so:
            - IF there is a cookie that the user has signed, 
            render the template
            - redirect users to /petition if there is no cookie 
            (this means they haven't signed yet & should not see this page!)
    */

    // console.log("request cookies: ", req.cookies);

    if (req.cookies.signature) {
        console.log("there are cookies");
        res.render("thanks", {});
    } else {
        console.log("there are no cookies");
        res.redirect("/petition");
    }
});

app.get("/signers", (req, res) => {
    /* TODO:
        * redirect users to /petition if there is no cookie 
        (this means they haven't signed yet & should not see 
        this page!)
        * SELECT first and last values of every person that 
        has signed from the database and pass them to 
        signers.handlebars
        * SELECT the number of people that have signed the 
        petition from the db → I recommend looking into what 
        COUNT can do for you here ;)
    */

    // hole mir die Daten aus der Datenbank

    getUser()
        .then(({ rows }) => {
            // console.log("results.rows", rows);

            numTotalUser()
                .then(({ rows }) => {
                    const count = rows[0].count;
                    console.log("data from COUNT: ", rows[0].count);
                    console.log(count);
                })
                .catch((err) => {
                    console.log(err);
                });

            res.render("signers", {
                rows,
                // totalCount,
                // count: count
            });
        })
        .catch((err) => {
            console.log("error in getUser: ", err);
        });

    // console.log("im a GET Request on the signers page!!");
    // res.send("im a GET Request on the signers page!!");
});

// TODO: add a * route

/*************************** ROUTES FOR TESTING ***************************/

app.get("/users", (req, res) => {
    getUser()
        // you can also desturcture it with then(({rows}) => { clg(rows )});
        .then((results) => {
            console.log("results.rows", results.rows);
        })
        .catch((err) => {
            console.log("error in getUser: ", err);
        });
    res.send("im a GET Request on the users page!!");
});

app.post("/add-user", (req, res) => {
    addUser("Karl", "Marx", "string for signature picture karl")
        .then(() => {
            console.log("yay user added");
        })
        .catch((err) => {
            console.log("error adding user: ", err);
        });
    res.send("im a POST Request on the /add-users page!!");
});

/*************************** SERVER LISTENING ***************************/

app.listen(8080, () => console.log("petition app listening..."));
