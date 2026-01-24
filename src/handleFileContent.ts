import * as ts from "typescript";
import { log } from "./clilog.js";

export type ModuleSpecifierResult = {
    moduleSpecifier: string | null;
    imported: string[];
};

export function getModuleSpecifier(
    node: ts.ImportDeclaration | ts.ImportEqualsDeclaration,
): ModuleSpecifierResult {
    if (ts.isImportDeclaration(node)) {
        const specifier = node.moduleSpecifier;
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

        if (ts.isStringLiteralLike(specifier)) {
            const logSuffix = imported.length ? imported.join(", ") : "(side-effect only)";
            log(`[getModuleSpecifier] import from ${specifier.text}: ${logSuffix}`);
            return {
                moduleSpecifier: specifier.text,
                imported,
            };
        }

        return { moduleSpecifier: null, imported };
    }

    if (
        ts.isImportEqualsDeclaration(node) &&
        node.moduleReference &&
        ts.isExternalModuleReference(node.moduleReference)
    ) {
        const expression = node.moduleReference.expression;
        const imported = [node.name.getText()];
        if (expression && ts.isStringLiteralLike(expression)) {
            log(
                `[getModuleSpecifier] import equals ${node.name.getText()} = require(${expression.text})`,
            );
            return {
                moduleSpecifier: expression.text,
                imported,
            };
        }

        return { moduleSpecifier: null, imported };
    }

    return { moduleSpecifier: null, imported: [] };
}