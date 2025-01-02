const folderHelpers = require("./folderMiddlewareHelpers");

module.exports.checkOwner = async (type, id, storage) => {
    switch (type){
        case "folder": {
            const check = folderHelpers.checkIfFolderOwner(id, storage);
            if (!check) {
                return false;
            };
            break;
        }

        case "file": {
            const check = await folderHelpers.checkIfFileOwner(id, storage);
            if (!check) {
                return false;
            };
            break;
        }
    }
    
    return true;
}