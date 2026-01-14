import { readNearestFileJson } from "./readNearestFileJson.js";

const TSCONFIG_CANDIDATES = ["tsconfig.json", "tsconfig.node.json", "tsconfig.app.json"];

export type TsConfig = {
    compilerOptions: {
        paths: Record<string, string[]>;
    };
};

export async function getPathMappings(startDir: string): Promise<Record<string, string>[]> {
    let mappings: Record<string, string>[] = []

    for (const fileName of TSCONFIG_CANDIDATES) {
        const tsconfig = await readNearestFileJson<TsConfig>(startDir, fileName);

        if (tsconfig?.compilerOptions?.paths) {
            mappings = [...mappings, ...Object.entries(tsconfig.compilerOptions.paths).map(([key, value]) => ({ [key]: value[0] }))]
        }
    }

    // remove '*' from the key and from the value
    const strippedMappings = mappings.map(mapping => {
        let key = Object.keys(mapping)[0];
        let value = mapping[key];

        // remove all '*' characters and trim trailing '/' characters
        if (key === '@/*') {
            key = '@/';
            value = `${value.replace(/\*/g, '').replace(/\/+$/, '')}/`;
        } else {
            key = key.replace(/\*/g, '').replace(/\/+$/, '');
            value = value.replace(/\*/g, '').replace(/\/+$/, '');
        }
        return { [key]: value };
    });

    // return only unique objects
    const uniqueMappings = strippedMappings.filter((value, index) => {
        const _value = JSON.stringify(value);
        return index === strippedMappings.findIndex(obj => {
            return JSON.stringify(obj) === _value;
        })
    });

    //sort mappings on key length (longest first)
    return uniqueMappings.sort((a, b) => Object.keys(b)[0].length - Object.keys(a)[0].length);
}