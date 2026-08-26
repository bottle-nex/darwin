import type { Request, Response } from "express";

import ResponseWriter from "../../services/service.response";
import ReviewService from "../../services/service.review";
import { load_review } from "./review.guard";

export default async function get_review_controller(req: Request, res: Response) {
    try {
        const resolved = await load_review(req, res);
        if (!resolved) return;

        ResponseWriter.success(res, await ReviewService.header(resolved));
    } catch (error) {
        console.error("error in get_review_controller:", error);
        ResponseWriter.system_error(res);
    }
}
