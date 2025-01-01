const asyncHandler = require('express-async-handler');
const { body, validationResult, param, matchedData } = require("express-validator");
const { isAuth } = require("../middleware/authMiddleware");
const {prisma} = require("../config/client");
const passport = require("passport");
const cloudinary = require("../config/cloudinary");

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
    validateName,
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
                author : {
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
        const folderToShow = await prisma.folder.findFirst({
            where: {
                id: formData.folderid
                },
            include: {
                files: true,
            }
        });
        return res.render("folder", {folder: folderToShow});
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
        const fileStash = await prisma.file.findMany({
            select: {
                public_id: true,
                type: true,
            },
            where: {
                folderid: formData.folderid
            }
        });

        const allIds =  {raw: [[]], image: [[]], video: [[]]};
        fileStash.forEach((file) => {
            if (allIds[file.type].at(-1).length === 100) {
                allIds[file.type].push([]);
            }
            allIds[file.type].at(-1).push(file.public_id);

        });
        
        Object.keys(allIds).forEach(async (key) => {
            if (allIds[key][0].length < 1) {
                return;
            }
            await allIds[key].forEach(async (idCollection) => {
                await cloudinary.api.delete_resources(idCollection, {resource_type: key});
            });
        }); 

        await prisma.folder.delete({
            where: {
                id: formData.folderid
            }
        }) 
        return res.redirect("/"); ///TODO REGARDING DELETING FILES- ONLY DO IT AFTER FIGURING OUT HOW TO UPLOAD TO CLOUDI
    })
];

exports.showUpdateFolder = [
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

        const folder = await prisma.folder.findFirst({
            where: {
                id: formData.folderid
                }
        });
        return res.render("updateFolder", {folder});
    })
]

exports.updateFolder = [
    validateName.concat(validateId),
    isAuth,
    asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).render("updateFolder", {
                errors: errors.array(),
              });
        };

        const formData = matchedData(req);
        await prisma.folder.update({
            where :  {
                id: formData.folderid,
            },
            data: {
                name: formData.name
            }
        });
        return res.redirect("/");
    })
];

exports.showAllFolders = [
    isAuth,
    asyncHandler(async (req, res) => {
        const folders = await prisma.folder.findMany({
            where: {
                authorid: req.user.id
                }
        });
        return res.render("allFolders", {folders});
    })
];