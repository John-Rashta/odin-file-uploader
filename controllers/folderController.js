const asyncHandler = require('express-async-handler');
const { body, validationResult, param, matchedData } = require("express-validator");
const { isAuth } = require("../middleware/authMiddleware");
const {prisma} = require("../config/client");
const passport = require("passport");

const validateName = [
    body("name").trim()
        .isAlpha().withMessage("Must only contain letters.")
        .isLength({min: 1, max: 50}).withMessage("Max 50 characters."),
];

const validateId = [
    param("folderid").trim()
        .toInt().isInt().withMessage("Folder Does Not Exist.")
];

exports.showCreateFolder = [
    isAuth,
    asyncHandler(async (req, res) => {
        return res.render("create");
    })
];


exports.createFolder = [
    isAuth,
    asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).render("create", {
                errors: errors.array(),
              });
        };

        const formData = matchedData(req);
        await prisma.folder.create({
            data: {
                name: formData.name,
                user : {
                    connect: {id: req.user.id}
                }
            }
        });
        return res.redirect("/");
    })
];

exports.showFolder = [
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
        const folderToShow = prisma.folder.findFirst({
            where: {
                id: formData.folderid
                },
            include: {
                files: true,
            }
        });
        return res.render("folder", {folderToShow});
    })
];

exports.deleteFolder = [
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
        await prisma.folder.delete({
            where: {
                id: formData.folderid
            }
        })
        return res.redirect("/"); ///TODO REGARDING DELETING FILES- ONLY DO IT AFTER FIGURING OUT HOW TO UPLOAD TO CLOUDI
    })
];