// if a logged-in user tries to access our register or login pages, they should be redirected away from those pages!
module.exports.requireLoggedOutUser = (req, res, next) => {
    // the 1st thing we have to do is check whether a user is LOGGED IN.
    // if so, take them away!
    if (req.session.userId) {
        return res.redirect("/petition");
    }

    // only if user is NOT logged in do you proceed to the rest of the code
    next();
};

// module.exports.requireLoggedInUser = (req, res, next) => {
//     // check for the opposite scenario first!!! so that we can redirect them elsewhere
//     if (!req.session.userId && req.url != "/register" && req.url != "/login") {
//         return res.redirect("/register");
//     }

//     // only if user IS logged in do you proceed to the rest of the code
//     next();
// };

module.exports.requireNoSignature = (req, res, next) => {
    // we need to check for the opposite scenario first!
    // does the user have a signature?? if so, we want to redirect away!!
    if (req.session.sigId) {
        return res.redirect("/thanks");
    }
    // only if they DON'T have a signature do you proceed to the rest of the code
    next();
};

module.exports.requireSignature = (req, res, next) => {
    // check for the opposite scneario first!!!
    if (!req.session.signatureId) {
        return res.redirect("/petition");
    }

    // only if they HAVE a signature do you proceed to the rest of the code
    next();
};
