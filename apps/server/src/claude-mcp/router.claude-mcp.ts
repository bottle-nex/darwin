import { Router, Request, Response } from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { require_api_key } from "../middlewares/middleware.api_key";
import { build_claude_mcp_server } from "./mcp_server";

const claude_mcp_router: Router = Router();

async function handle_mcp_request(req: Request, res: Response) {
    const mcp_server = build_claude_mcp_server(req.user);
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

    res.on("close", () => {
        transport.close();
        mcp_server.close();
    });

    try {
        await mcp_server.connect(transport);
        await transport.handleRequest(req, res, req.body);
    } catch (err) {
        console.log("[claude-mcp] error while handling mcp request", err);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    }
}

claude_mcp_router.all("/", require_api_key, handle_mcp_request);
claude_mcp_router.all("/:key", require_api_key, handle_mcp_request);

export default claude_mcp_router;
