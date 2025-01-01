const { Router } = require("express");
const folderController = require("../controllers/folderController");
const folderRouter = Router();

folderRouter.get("/create", folderController.showCreateFolder);
folderRouter.post("/create", folderController.createFolder);
folderRouter.get("/index", folderController.showAllFolders);
folderRouter.get("/:folderid", folderController.showFolder);
folderRouter.post("/delete/:folderid", folderController.deleteFolder);
folderRouter.get("/update/:folderid", folderController.showUpdateFolder);
folderRouter.post("/update/:folderid", folderController.updateFolder);



module.exports = folderRouter;