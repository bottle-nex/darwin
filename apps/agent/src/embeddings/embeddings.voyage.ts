import chalk from "chalk";
import { ENV } from "../configs/env";

export enum InputType {
    Document = "document",
    Query = "query",
}

export default class Voyage {
    private API_URL = "https://api.voyageai.com/v1/embeddings";
    private MODEL = "voyage-code-2";
    private BATCH_SIZE = 64;

    public async embed_batch(texts: string[], inputType: InputType): Promise<number[][]> {
        try {
            const res = await fetch(`${this.API_URL}`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${ENV.AGENT_VOYAGE_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ model: this.MODEL, input: texts, input_type: inputType }),
            });

            if (!res.ok) {
                throw new Error(`Voyage API ${res.status}: ${await res.text()}`);
            }

            const data = (await res.json()) as { data: Array<{ embeddings: number[] }> };
            return data.data.map((d) => d.embeddings);
        } catch (err) {
            console.log(chalk.red("Embed batch error: "), err);
            return [[]];
        }
    }
}
