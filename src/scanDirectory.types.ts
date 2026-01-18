// Types for the registry generator
export type FileEntry = {
    name: string;
    path: string;
    rootPath: string;
    shadcn?: ShadcnMeta;
    imports?: string[];
};

const SHADCN_TYPES = [
    "registry:block",        // Complex components with multiple files
    "registry:component",    // Simple components
    "registry:lib",          // lib and utils
    "registry:hook",         // Custom hooks
    "registry:ui",           // Ui components and single-file primitives
    "registry:page",         // Page or file-based routes
    "registry:file",         // Miscellaneous files
    "registry:style",        // Registry styles eg. new-york
    "registry:theme",        // Themes
    "registry:item"          // universal registry items
] as const;

export type ShadcnMeta = {
    isRoot: boolean;
    name: string;
    title: string;
    description: string;
    type: (typeof SHADCN_TYPES)[number];
    category: string[];
    resources: string[];
};