import * as ts from "typescript";

export function getModuleSpecifier(
    node: ts.ImportDeclaration | ts.ImportEqualsDeclaration
): string | null {
    if (ts.isImportDeclaration(node)) {
        const specifier = node.moduleSpecifier;
        return ts.isStringLiteralLike(specifier) ? specifier.text : null;
    }

    if (
        ts.isImportEqualsDeclaration(node) &&
        node.moduleReference &&
        ts.isExternalModuleReference(node.moduleReference)
    ) {
        const expression = node.moduleReference.expression;
        return expression && ts.isStringLiteralLike(expression)
            ? expression.text
            : null;
    }

    return null;
}