import * as ts from "typescript";
import type { ShadcnMeta } from "./scanDirectory.types.js";

export function getShadcnMeta(filePath: string, fileContent: string) {
    const shadcnMeta: ShadcnMeta = {
        isRoot: false,
        type: "registry:file",
        name: "",
        title: "",
        description: "",
        category: []
    };

    ts.forEachLeadingCommentRange(fileContent, 0, (pos, end, kind) => {
        let currLine = fileContent.substring(pos, end);

        if (kind === ts.SyntaxKind.SingleLineCommentTrivia) {
            if (currLine.startsWith("//@root")) {
                shadcnMeta.isRoot = true;
            };
            if (currLine.startsWith("//@type")) {
                shadcnMeta.type = currLine.replace("//@type:", "").trim() as ShadcnMeta["type"];
            }
            if (currLine.startsWith("//@name")) {
                shadcnMeta.name = currLine.replace("//@name:", "").trim();
            }
            if (currLine.startsWith("//@title")) {
                shadcnMeta.title = currLine.replace("//@title:", "").trim();
            }
            if (currLine.startsWith("//@description")) {
                shadcnMeta.description = currLine.replace("//@description:", "").trim();
            }
            if (currLine.startsWith("//@category")) {
                shadcnMeta.category = currLine.replace("//@category:", "").trim().split(",").map(c => c.trim());
            }
            if (currLine.startsWith("//-")) {
                shadcnMeta.description += "\n" + currLine.replace("//-", "").trim();
            }
        }
    });

    return shadcnMeta;
}

