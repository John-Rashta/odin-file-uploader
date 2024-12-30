const asyncHandler = require('express-async-handler');
const { body, validationResult, param, matchedData } = require("express-validator");
const { isAuth } = require("../middleware/authMiddleware");
const {prisma} = require("../config/client");
const passport = require("passport");
const multer  = require('multer');
const upload = multer({ dest: './uploads' });

const validateId = [
    param("fileid").trim()
        .toInt().isInt().withMessage("File Does Not Exist.")
];

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

exports.deleteFile = [
    validateId,
    isAuth,
    asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).render("index", {
                errors: errors.array(),
              });
        };

        const formData = matchedData(req);

        await prisma.file.delete({
            where: {
                id: formData.fileid
            }
        });

        return res.redirect("/");
    })
];

exports.showFileDetails = [
    validateId,
    isAuth,
    asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).render("index", {
                errors: errors.array(),
              });
        };

        const formData = matchedData(req);

        const fileData = await prisma.file.findFirst({
            where: {
                id: formData.fileid
            }
        });

        return res.render("file", {fileData});
    })
];