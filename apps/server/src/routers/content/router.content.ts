import { Router } from "express";
import ListContentController from "../../controllers/content/controller.list-content";
import GetContentController from "../../controllers/content/controller.get-content";

const content_router: Router = Router();

content_router.get("/blog", ListContentController.handler("Blog"));
content_router.get("/blog/:slug", GetContentController.handler("Blog"));
content_router.get("/changelog", ListContentController.handler("Changelog"));
content_router.get("/changelog/:slug", GetContentController.handler("Changelog"));

export default content_router;
