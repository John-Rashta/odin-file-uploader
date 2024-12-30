const asyncHandler = require('express-async-handler');
const { body, validationResult, param, matchedData } = require("express-validator");
const { isAuth } = require("../middleware/authMiddleware");
const {prisma} = require("../config/client");
const passport = require("passport");
const multer  = require('multer');
const upload = multer({ dest: './uploads' });

exports.showUpload = [
    isAuth,
    asyncHandler(async (req, res) => {
        return res.render("upload");
    })
];


exports.makeUpload = [
    isAuth,
    upload.single('uploaded_file'),
    asyncHandler(async (req, res) => {
        return res.redirect("/");
    })
];