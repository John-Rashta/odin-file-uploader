const asyncHandler = require('express-async-handler');
const { body, validationResult, param, matchedData } = require("express-validator");
const {prisma} = require("../config/client");
const passport = require("passport");
const {basicErrorMiddleware} = require("../middleware/errorMiddleware");
const { isAfter} = require("date-fns");

const validateCode = [
    param("code").trim()
        .isUUID().withMessage("Invalid Code Format.")

];

const validateId = [
    param("fileid").trim()
        .toInt().isInt().withMessage("File Does Not Exist.")
];

exports.showSharedFolder = [
    validateCode,
    basicErrorMiddleware("index"),
    asyncHandler(async (req, res) => {
        const formData = matchedData(req);
        const sharedFolder = await prisma.shareCode.findFirst({
            where: {
                code: formData.code
            },
            include: {
                folder: {
                    include: {
                        files: true
                    }
                }
            }
        });

        if (isAfter(new Date(), sharedFolder.expiry_date)) {
            await prisma.shareCode.delete({
                where: {
                    code: sharedFolder.code,
                }
            });

            return res.redirect("/");
        };
        return res.render("folder", {sharedCode: sharedFolder.code, folder: sharedFolder.folder } )
    })
];

exports.showSharedFile = [
    validateCode.concat(validateId),
    basicErrorMiddleware("index"),
    asyncHandler(async (req, res) => {
        const formData = matchedData(req);
        const sharedData = await prisma.shareCode.findFirst({
            where: {
                code: formData.code
            }
        });

        if (!sharedData) {
            return res.status(400).render("index");
        }
        const fileData = await prisma.file.findFirst({
            where: {
                id: formData.fileid
            }
        });
        if (!fileData) {
            return res.status(400).render("index");
        }
        if (sharedData.folderid !== fileData.folderid) {
            return res.status(401).render("index");
        }
        
        return res.render("file", {file: fileData});
    })
];