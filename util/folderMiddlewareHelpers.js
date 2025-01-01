const {prisma} = require("../config/client");

module.exports.removeFolder = function(folderid, storage) {
    const newArr = storage.filter((id) => id !== folderid);
    storage = newArr;
    return;
};

module.exports.checkIfFolderOwner = function(folderid, storage) {
    const isOwner = storage.includes(folderid);
    return isOwner;
};

module.exports.checkIfFileOwner = async function(fileid, storage) {
    const fileInQuestion = await prisma.file.findFirst({
        select: {
            folderid: true
        },
        where: {
            id: fileid
        }
    });

    const isOwner = this.checkIfFolderOwner(fileInQuestion.folderid, storage);
    return isOwner;
}