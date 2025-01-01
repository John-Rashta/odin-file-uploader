const asyncHandler = require('express-async-handler');
const { body, validationResult, param, matchedData } = require("express-validator");
const { isAuth } = require("../middleware/authMiddleware");
const {prisma} = require("../config/client");
const passport = require("passport");
const upload = require("../middleware/uploadMulter");
const cloudinary = require("../config/cloudinary");
const fs = require('fs');
const { promisify } = require('util');
const unlinkWithAsync = promisify(fs.unlink);

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
        const userFolders = await prisma.folder.findMany({
            where: {
                authorid: req.user.id,
            }
        });
        return res.render("upload", {folders: userFolders});
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
                url: newFile.secure_url,
                public_id: newFile.public_id,
                name: req.file.filename,
                size: req.file.size,
                upload_time: new Date(),
                type:newFile.resource_type,
                folder: {
                    connect: {
                        id: formData.folders
                    }
                }
            }
        })

        await unlinkWithAsync(req.file.path);

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
        const fileInfo = await prisma.file.findFirst({
            where: {
                id: formData.fileid
            }
        });
        
        await cloudinary.uploader.destroy(fileInfo.public_id, {resource_type: fileInfo.type});
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

        return res.render("file", {file:fileData});
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
        return res.render("uploadToFolder", {folderid: formData.folderid});
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
        const newFile = await cloudinary.uploader.upload(req.file.path, {
            resource_type: "auto"
        });

        await prisma.file.create({
            data: {
                url: newFile.secure_url,
                public_id: newFile.public_id,
                name: req.file.filename,
                size: req.file.size,
                upload_time: new Date(),
                type:newFile.resource_type,
                folder: {
                    connect: {
                        id: formData.folderid
                    } 
                }
            }
        })

        await unlinkWithAsync(req.file.path);

        return res.redirect("/");
    })
]