const asyncHandler = require('express-async-handler');
const { body, validationResult, param, matchedData } = require("express-validator");
const { isAuth } = require("../middleware/authMiddleware");
const {prisma} = require("../config/client");
const passport = require("passport");
const {basicErrorMiddleware} = require("../middleware/errorMiddleware");
const cloudinary = require("../config/cloudinary");
const {foldersGetWare} = require("../middleware/folderMiddleware");
const {removeFolder} = require("../util/folderDeleteHelper");
const {checkOwner} = require("../util/checkHelper");
const crypto = require("node:crypto");
const { add } = require("date-fns");

const validateName = [
    body("name").trim()
        .isAlpha().withMessage("Must only contain letters.")
        .isLength({min: 1, max: 50}).withMessage("Max 50 characters."),
];

const validateId = [
    param("folderid").trim()
        .toInt().isInt().withMessage("Folder Does Not Exist.")
];

const validateShare = [
    body("folderid").trim()
        .toInt().isInt().withMessage("Folder Does Not Exist."),
    body("days").trim()
        .toInt().isInt().withMessage("Must be a number of days."),
];

exports.showCreateFolder = [
    isAuth,
    foldersGetWare,
    asyncHandler(async (req, res) => {
        console.log(req.user.folders)
        return res.render("create");
    })
];


exports.createFolder = [
    isAuth,
    foldersGetWare,
    validateName,
    basicErrorMiddleware("create"),
    asyncHandler(async (req, res) => {
        const formData = matchedData(req);
        const newFolder = await prisma.folder.create({
            data: {
                name: formData.name,
                author : {
                    connect: {id: req.user.id}
                }
            }
        });
        req.user.folders.push(newFolder.id);
        console.log(req.user.folders)
        return res.redirect("/");
    })
];

exports.showFolder = [
    isAuth,
    foldersGetWare,
    validateId,
    basicErrorMiddleware("index", true),
    asyncHandler(async (req, res) => {
        const formData = matchedData(req);
        if (!checkOwner("folder", formData.folderid, req.user.folders)) {
            return res.redirect("/");
        };
        const folderToShow = await prisma.folder.findFirst({
            where: {
                id: formData.folderid
                },
            include: {
                files: true,
            }
        });
        return res.render("folder", {folder: folderToShow, owner: true});
    })
];

exports.deleteFolder = [
    isAuth,
    foldersGetWare,
    validateId,
    asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.redirect("/folder/index");
        };

        const formData = matchedData(req);
        if (!checkOwner("folder", formData.folderid, req.user.folders)) {
            return res.redirect("/");
        };
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
        });

        removeFolder(formData.folderid, req.user.folders);

        return res.redirect("/");
    })
];

exports.showUpdateFolder = [
    isAuth,
    foldersGetWare,
    validateId,
    basicErrorMiddleware("index", true),
    asyncHandler(async (req, res) => {
        const formData = matchedData(req);
        if (!checkOwner("folder", formData.folderid, req.user.folders)) {
            return res.redirect("/");
        };

        const folder = await prisma.folder.findFirst({
            where: {
                id: formData.folderid
                }
        });
        return res.render("updateFolder", {folder});
    })
]

exports.updateFolder = [
    isAuth,
    foldersGetWare,
    validateName.concat(validateId),
    asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        const formData = matchedData(req);
        if (!errors.isEmpty()) {
            if (Object.hasOwn(formData, "folderid") && Number.isInteger(formData.folderid)) {
                if (!checkOwner("folder", formData.folderid, req.user.folders)) {
                    return res.redirect("/");
                };
                const folder = await prisma.folder.findFirst({
                    where: {
                        id: formData.folderid
                        }
                });
                return res.render("updateFolder", {
                    errors: errors.array(),
                    folder});
            }
            return res.status(400).render("index", {
                errors: errors.array(),
                user: req.user
              });
        };

        
        if (!checkOwner("folder", formData.folderid, req.user.folders)) {
            return res.redirect("/");
        };
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
    foldersGetWare,
    asyncHandler(async (req, res) => {
        const folders = await prisma.folder.findMany({
            where: {
                authorid: req.user.id
                }
        });
        return res.render("allFolders", {folders});
    })
];

exports.showShareForm = [
    isAuth,
    foldersGetWare,
    asyncHandler(async (req, res) => {
        return res.render("shareForm", {folders: req.user.folders});
    })
];

exports.showAllCodes = [
    isAuth,
    foldersGetWare,
    asyncHandler(async (req, res) => {
        const allCodes = prisma.sharecode.findMany({
            where: {
                userid: req.user.id
            }
        })
        return res.render("sharedFolders", {allCodes, linkStart: `${req.protocol}://${req.host}/share/` });
    })
]

exports.makeShareCode = [
    isAuth,
    foldersGetWare,
    validateShare,
    asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.render("shareForm", {
                errors: errors.array(),
                folders: req.user.folders
            });
        };
        const formData = matchedData(req);
        if (!checkOwner("folder", formData.folderid, req.user.folders)) {
            return res.redirect("/");
        };

        const newCode = crypto.randomUUID();

        await prisma.sharecode.create({
            data: {
                code: newCode,
                expiry_date: add(new Date(), {days: formData.days}),
                user: {
                    connect: {
                        id: req.user.id
                    }
                },
                folder: {
                    connect: {
                        id: formData.folderid
                    }
                }

            }
        });

        return res.render("sharedCode", {link: `${req.protocol}://${req.host}/share/${newCode}`});
    })
]