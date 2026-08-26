import { prisma } from "@trymatcha/database";
import Logger from "@trymatcha/logger";
import type { ProductDiffStatus } from "@trymatcha/types";

const log = Logger.scope("product-diff");

export default class ProductDiffRunner {
    public static async run(product_diff_id: string): Promise<ProductDiffStatus> {
        log.warn("capsule pipeline is not built yet", { productDiff: product_diff_id });
        await prisma.productDiff.updateMany({
            where: { id: product_diff_id, status: { in: ["Pending", "Generating"] } },
            data: { status: "Unsupported", error: null },
        });
        return "Unsupported";
    }
}
