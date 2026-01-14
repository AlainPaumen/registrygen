type LogFn = (...args: Parameters<typeof console.log>) => void;

let cliLog: LogFn = () => { };

export function log(...args: Parameters<typeof console.log>) {
    cliLog(...args);
}

export function setVerboseLogging(enabled: boolean) {
    cliLog = enabled ? (...args) => console.log(...args) : () => { };
}