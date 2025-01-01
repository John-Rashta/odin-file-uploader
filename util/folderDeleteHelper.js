module.exports.removeFolder = function(folderid, storage) {
    const newArr = storage.filter((id) => id !== folderid);
    storage = newArr;
    return;
};