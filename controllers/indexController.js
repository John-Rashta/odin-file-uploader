const asyncHandler = require('express-async-handler');
const { body, validationResult, param, matchedData } = require("express-validator");
const { isAuth } = require("../middleware/authMiddleware");
const {prisma} = require("../config/client");
const passport = require("passport");
const bcrypt = require('bcryptjs');
const {basicErrorMiddleware} = require("../middleware/errorMiddleware");

const validateSignUp = [
    body("username").trim()
        .isAlphanumeric().withMessage("Must only contain letters and/or numbers.")
        .isLength({min: 1, max: 255}).withMessage("Max 255 characters."),
    body("password").trim()
        .notEmpty().withMessage("Password is required.")
        .isAscii().withMessage("Must be only Ascii characters."),
    body("confirm_password").trim()
        .custom((value, {req}) => {
            return value === req.body.password;
        }).withMessage("Passwords do not match.")
  ];

const validateLogin = [
body("username").trim()
    .isAlphanumeric().withMessage("Must only contain letters and/or numbers.")
    .isLength({min: 1, max: 255}).withMessage("Max 255 characters."),
body("password").trim()
    .notEmpty().withMessage("Password is required.")
    .isAscii().withMessage("Must be only Ascii characters.")
];

exports.showIndex = asyncHandler(async (req, res) => {
    return res.render("index", {user: req.user});
});


exports.showSignupUser = asyncHandler(async (req, res) => {
    return res.render("signup");
});

exports.makeSignupUser = [
    validateSignUp,
    basicErrorMiddleware("signup"),
    asyncHandler(async (req, res) => {
        const formData = matchedData(req);
        const invalidUser = await prisma.user.findFirst({where: {username: formData.username}});
        if (invalidUser) {
            return res.status(400).render("signup", {
                errors: [{msg: "Username already exists."}],
            });
        }

        bcrypt.hash(formData.password, 10, async (err, hashedPassword) => {
            // if err, do something
            if (err) {
                console.log(err);
                return res.status(400).send("Internal Error");
            }
            // otherwise, store hashedPassword in DB
            await prisma.user.create({
                data: {
                    username: formData.username,
                    password: hashedPassword
                }
            })
        });

        res.redirect("/");
    })
];

exports.showLoginUser = asyncHandler(async (req, res) => {
    if (req.user) {
        return res.redirect("/");
    }
    return res.render("login");
});

exports.makeLoginUser = [
    validateLogin,
    basicErrorMiddleware("login"),
    passport.authenticate("local", {
        successRedirect: "/",
        failureRedirect: "/"
      }),
];

exports.logoutUser = asyncHandler(async (req, res, next) => {
    req.logout((err) => {
        if (err) {
          return next(err);
        }
        res.redirect("/");
    });
});
