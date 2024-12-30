const { Router } = require("express");
const folderController = require("../controllers/folderController");
const folderRouter = Router();

folderRouter.get("/create", folderController.showCreateFolder);
folderRouter.post("/create", folderController.createFolder);
folderRouter.get("/:folderid", folderController.showFolder);
folderRouter.post("/delete/:folderid", folderController.deleteFolder);


module.exports = folderRouter;