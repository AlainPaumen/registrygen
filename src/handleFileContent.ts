import * as ts from "typescript";

export function getModuleSpecifier(
    node: ts.ImportDeclaration | ts.ImportEqualsDeclaration
): string | null {
    if (ts.isImportDeclaration(node)) {
        const specifier = node.moduleSpecifier;
        if (ts.isStringLiteralLike(specifier)) {
            const imported: string[] = [];
            const clause = node.importClause;
            if (clause) {
                if (clause.name) {
                    imported.push(`default as ${clause.name.getText()}`);
                }
                if (clause.namedBindings) {
                    if (ts.isNamespaceImport(clause.namedBindings)) {
                        imported.push(`* as ${clause.namedBindings.name.getText()}`);
                    } else if (ts.isNamedImports(clause.namedBindings)) {
                        clause.namedBindings.elements.forEach((element) => {
                            imported.push(
                                element.propertyName
                                    ? `${element.propertyName.getText()} as ${element.name.getText()}`
                                    : element.name.getText(),
                            );
                        });
                    }
                }
            }
            const logSuffix = imported.length ? imported.join(", ") : "(side-effect only)";
            console.log(`[getModuleSpecifier] import from ${specifier.text}: ${logSuffix}`);
        }
        return ts.isStringLiteralLike(specifier) ? specifier.text : null;
    }

    if (
        ts.isImportEqualsDeclaration(node) &&
        node.moduleReference &&
        ts.isExternalModuleReference(node.moduleReference)
    ) {
        const expression = node.moduleReference.expression;
        if (expression && ts.isStringLiteralLike(expression)) {
            console.log(
                `[getModuleSpecifier] import equals ${node.name.getText()} = require(${expression.text})`,
            );
        }
        return expression && ts.isStringLiteralLike(expression)
            ? expression.text
            : null;
    }

    return null;
}