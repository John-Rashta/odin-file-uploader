const asyncHandler = require('express-async-handler');
const {prisma} = require("../config/client");

module.exports.foldersGetWare = asyncHandler(async (req, res, next) => {
    if (req.user.folders) {
        next();
    }

    const folderIds = await prisma.folder.findMany({
        select: {
            id: true
        },
        where : {
            authorid: req.user.id
        }
    });

    const folderArr = [];
    folderIds.forEach((folder) => {
        folderArr.push(folder.id);
    });

    req.user.folders = folderArr;
    next();
})