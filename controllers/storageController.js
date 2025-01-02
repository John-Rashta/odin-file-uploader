const asyncHandler = require('express-async-handler');
const { body, validationResult, param, matchedData } = require("express-validator");
const { isAuth } = require("../middleware/authMiddleware");
const {prisma} = require("../config/client");
const {basicErrorMiddleware} = require("../middleware/errorMiddleware");
const passport = require("passport");
const upload = require("../middleware/uploadMulter");
const cloudinary = require("../config/cloudinary");
const fs = require('fs');
const { promisify } = require('util');
const unlinkWithAsync = promisify(fs.unlink);
const {foldersGetWare} = require("../middleware/folderMiddleware");
const {checkOwner} = require("../util/checkHelper");

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
    foldersGetWare,
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
    foldersGetWare,
    upload.single('uploaded_file'),
    validateForm,
    asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const userFolders = await prisma.folder.findMany({
                where: {
                    authorid: req.user.id,
                }
            });
            return res.status(400).render("upload", {
                errors: errors.array(),
                folders: userFolders,
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
    isAuth,
    foldersGetWare,
    validateId,
    basicErrorMiddleware("index", true),
    asyncHandler(async (req, res) => {
        const formData = matchedData(req);
        const fileCheck = await checkOwner("file", formData.fileid, req.user.folders);
        if (!fileCheck) {
            return res.redirect("/");
        };

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
    isAuth,
    foldersGetWare,
    validateId,
    basicErrorMiddleware("index", true),
    asyncHandler(async (req, res) => {
        const formData = matchedData(req);

        const fileCheck = await checkOwner("file", formData.fileid, req.user.folders);
        if (!fileCheck) {
            return res.redirect("/");
        };

        const fileData = await prisma.file.findFirst({
            where: {
                id: formData.fileid
            }
        });

        return res.render("file", {file:fileData, owner: true});
    })
];

exports.showUploadToFolder = [
    isAuth,
    foldersGetWare,
    validateFolderId,
    basicErrorMiddleware("index", true),
    asyncHandler(async (req, res) => {
        const formData = matchedData(req);
        if (!checkOwner("folder", formData.folderid, req.user.folders)) {
            return res.redirect("/");
        };
        return res.render("uploadToFolder", {folderid: formData.folderid});
    })
];

exports.makeUploadToFolder = [
    isAuth,
    foldersGetWare,
    validateFolderId,
    upload.single('uploaded_file'),
    basicErrorMiddleware("index", true),
    asyncHandler(async (req, res) => {
        const formData = matchedData(req);
        if (!checkOwner("folder", formData.folderid, req.user.folders)) {
            return res.redirect("/");
        };
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