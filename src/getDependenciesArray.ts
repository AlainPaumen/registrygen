
export type PackageInfo = {
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
};

export function getDependenciesArray(packageInfo: PackageInfo): string[] {
    const dependencies = Object.keys(packageInfo.dependencies);
    const devDependencies = Object.keys(packageInfo.devDependencies);
    return [...dependencies, ...devDependencies];
}