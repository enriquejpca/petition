//To create an express app.
const express = require("express");
const app = express();
const db = require("./db");
//Middleware.
const {
    requireLoggedOutUser,
    //requireLoggedInUser,
    requireNoSignature,
    requireSignature,
} = require("./middleware");

//Set up express-handlebars.
const { engine } = require("express-handlebars");

//To allow to our express to use Handlebars as the template engine.
app.engine("handlebars", engine());
app.set("view engine", "handlebars");

app.use(express.urlencoded({ extended: false }));

const cookieSession = require("cookie-session");
const { hash, compare } = require("./bcrypt");

app.use(
    cookieSession({
        secret: `I'm always angry.`,
        maxAge: 1000 * 60 * 60 * 24 * 14,
    })
);

//Static.
app.use(express.static("./views"));
app.use(express.static("./public"));

app.use((req, res, next) => {
    // console.log("req.url", req.url);
    next();
});

app.get("/", (req, res) => {
    res.render("register");
});

app.post("/", requireLoggedOutUser, (req, res) => {
    const { first, last, email, password } = req.body;
    // console.log("req.body: ", req.body);
    hash(password)
        .then((hashedPassword) => {
            // console.log("hashed password: ", hashedPassword);
            // console.log("first: ", first);
            // console.log("last: ", last);
            // console.log("email: ", email);
            // Store users first and last names, email and the hashed password in the database.
            db.getRegistration(first, last, email, hashedPassword)
                .then((result) => {
                    // console.log("Console-log", req.body);
                    // If everything goes to plan set a cookie with the user's id
                    // something like req.session.userId, then redirect to /petition.
                    req.session.user_id = result.rows[0].id;
                    res.redirect("/profile");
                })
                .catch((err) => {
                    console.log(err);
                    res.render("register", {
                        err,
                    });
                });
        })
        .catch((err) => {
            console.log("error submitting registration values", err);
            // Re-render the same page with an error message
            res.redirect("/register");
        });
});

app.get("/profile", (req, res) => {
    res.render("profile");
});

app.post("/profile", (req, res) => {
    const { age, city, url } = req.body;
    // console.log("req.body: ", req.body);
    db.getMoreInfo(age, city, url, req.session.user_id)
        .then((results) => {
            // console.log("age: ", age);
            // console.log("city: ", city);
            // console.log("url: ", url);
            //console.log("req.body: ", req.body);

            res.redirect("/petition");
        })
        .catch((err) => {
            console.log(err);
            res.render("profile", {
                err: "User already exists",
            });
        });
});

app.get("/profile/edit", (req, res) => {
    const userId = req.session.user_id;
    console.log("user_id: ", req.session);
    db.getInfoRegistration(userId).then((results) => {
        //console.log("Results: ", results);

        res.render("editprofile", {
            user: results.rows[0],
        });
    });
});

app.post("/profile/edit", (req, res) => {
    const { first, last, email, password, age, city, url } = req.body;
    console.log("req.body: ", req.body);
    const userId = req.session.user_id;
    console.log("user_id: ", userId);

    // db.updateUserProfile(userId, age, city, url).then(() => {
    //     res.redirect("/thanks");
    // });
    if (password.length != 0) {
        console.log("Password path!");
        hash(password).then((hashedPassword) => {
            console.log("hi");
            Promise.all([
                db.updateUsersTableWithPassword(
                    userId,
                    first,
                    last,
                    email,
                    password
                ),
                db.updateUserProfile(userId, age, city, url),
            ]).then(() => {
                res.redirect("/thanks");
            });
        });
    } else {
        console.log("NO Password path!");
        Promise.all([
            db.updateUserWithoutPwChange(userId, first, last, email),
            db.updateUserProfile(userId, age, city, url),
        ])
            .then(() => {
                res.redirect("/thanks");
            })
            .catch((err) => {
                console.log(err);
            });
    }
});

app.get("/login", requireLoggedOutUser, (req, res) => {
    res.render("login");
});

app.post("/login", requireLoggedOutUser, (req, res) => {
    // Get user's stored password hash from the database, do this using their email address.
    const { email, password: passwordInserted } = req.body;
    // console.log("req.body: ", req.body);
    db.getUserByMail(email)
        .then((results) => {
            const { user_id, password: passwordDb } = results.rows[0];
            //console.log("results from the database: ", results.rows[0]);
            compare(passwordInserted, passwordDb)
                .then((match) => {
                    // console.log(
                    // "Does the password match the one stored?",
                    // match
                    // );
                    // If this value is true then set a cookie with the user's id
                    // something like req.session.userId.
                    req.session.user_id = results.rows[0].id;
                    // THEN: you will want to check if they have SIGNED
                    // If so, set another cookie to remember this and redirect them
                    // to the /thanks page, otherwise redirect them to then /petition page.
                    // If an error occurs, re-render the page with an appropriate message.
                    if (match) {
                        db.checkTheSignature(user_id)
                            .then((result) => {
                                // console.log("result: ", result);
                                if (req.body && results.rows[0]) {
                                    res.redirect("/thanks");
                                }
                            })
                            .catch((err) => {
                                console.log(err);
                                res.render("login");
                            });
                    } else {
                        res.render("login", {
                            err: "Something went wrong",
                        });
                    }
                })
                .catch((err) => {
                    console.log(
                        "error comparing user password with hash:",
                        err
                    );
                    res.render("login");

                    // Re-render the page with an error
                });
        })
        .catch((err) => {
            console.log(err);
            res.render("login", {
                err: "User not found",
            });
        });
});

//GET /petition
app.get("/petition", requireNoSignature, (req, res) => {
    res.render("petition", {
        layout: "main",
    });
});

app.post("/petition", requireNoSignature, function (req, res) {
    const user_id = req.session.user_id;
    // console.log("Req.body: ", req.body);
    // console.log("req.session.user_id: ", req.session.user_id);
    db.signPetition(user_id, req.body.sig)
        .then((result) => {
            //console.log("req.body.sig: ", req.body);
            req.session.signatureId = result.rows[0].id;
            // console.log("results from INSERT: ", result.rows);
            // redirect to /thanks
            res.redirect("/thanks");
        })
        .catch((err) => {
            console.log("error in POST request: ", err);
            // Render the petition.handlebars,
            // But pass it a flag indicating that an error message should be shown.
            res.render("petition", {
                layout: "main",
                err: "Already signed",
            });
        });
});

app.get("/thanks", requireSignature, (req, res) => {
    db.getSignature(req.session.signatureId).then((results) => {
        //console.log("new string: ", req.session.id);
        // console.log("results from getSignature: ", results);

        res.render("thanks", {
            views: "thanks",
            signature: results.rows[0].signature,
        });
        console.log("new string", results.rows[0].signature);
    });
});

app.get("/signers", requireSignature, (req, res) => {
    db.getSigners()
        .then((results) => {
            //console.log("results from getSigners: ", results);
            let signedUsers = results.rows;
            //console.log("signedUsers: ", signedUsers);
            res.render("signers", {
                signers: signedUsers,
                results,
            });
        })
        .catch((err) => {
            console.log("error: ", err);
            res.redirect("/signers");
        });
});

app.get("/signers/:city", requireSignature, (req, res) => {
    db.getSignersByCity(req.params.city)
        .then((results) => {
            //console.log("results", req.params.city);
            //console.log(results);
            let signedUsers = results.rows;
            res.render("signers_by_city", {
                signers: signedUsers,
                city: req.params.city,
            });
        })
        .catch((err) => {
            console.log("error: ", err);
            res.redirect("signers", {
                err,
            });
        });
});

app.post("/signature/delete", requireSignature, (req, res) => {
    const user_id = req.session.user_id;
    db.deleteSignature(user_id)
        .then((results) => {
            console.log("Results: ", results);
            res.redirect("/petition");
        })
        .catch((err) => {
            console.log(err);
            res.redirect("/signature/delete");
        });
});

app.listen(process.env.PORT || 8080, console.log("8080 is listening"));
