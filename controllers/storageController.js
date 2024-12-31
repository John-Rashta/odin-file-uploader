const asyncHandler = require('express-async-handler');
const { body, validationResult, param, matchedData } = require("express-validator");
const { isAuth } = require("../middleware/authMiddleware");
const {prisma} = require("../config/client");
const passport = require("passport");
const upload = require("../middleware/uploadMulter");
const cloudinary = require("../config/cloudinary");

const validateId = [
    param("fileid").trim()
        .toInt().isInt().withMessage("File Does Not Exist.")
];
const validateFolderId = [
    param("folderid").trim()
        .toInt().isInt().withMessage("File Does Not Exist.")
];

const validateForm = [
    body("folders").trim()
        .toInt().isInt()
]

exports.showUpload = [
    isAuth,
    asyncHandler(async (req, res) => {
        const userFolders = await prisma.user.findFirst({
            where: {
                id: req.user.id,
            },
            include: {
                folders: true

            }
        });
        return res.render("upload", {folders: userFolders.folders});
    })
];


exports.makeUpload = [
    isAuth,
    upload.single('uploaded_file'),
    validateForm,
    asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).render("index", {
                errors: errors.array(),
              });
        };
        
        const formData = matchedData(req);
        const newFile = await cloudinary.uploader.upload(req.file.path, {
            resource_type: "auto"
        });
        await prisma.file.create({
            data: {
                url: newFile.public_id,
                name: req.file.filename,
                size: req.file.size,
                upload_time: new Date(),
                folder: {
                    connect: {
                        id: Number(req.body.folders)
                    }
                }
            }
        })

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

exports.showUploadToFolder = [
    validateFolderId,
    isAuth,
    asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).render("index", {
                errors: errors.array(),
              });
        };

        const formData = matchedData(req);
        return res.render("upload", {folderid: formData.folderid});
    })
];

exports.makeUploadToFolder = [
    validateFolderId,
    isAuth,
    upload.single('uploaded_file'),
    asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).render("index", {
                errors: errors.array(),
              });
        };

        const formData = matchedData(req);
        const newFile = cloudinary.uploader.upload(req.file.path, function (err, result) {
            if (err) {
                console.log(err);
                return res.status(500).json({
                    success: false,
                    message: "Error uploading"
                });
            }

            return result;
        });

        await prisma.file.create({
            data: {
                URL: newFile.public_id,
                name: req.file.filename,
                size: req.file.size,
                upload_time: new Date(),
                folder: {
                    connect: formData.folderid
                }
            }
        })

        return res.redirect("/");
    })
]