export declare class BufferMap {
    #private;
    constructor(options: any);
    get size(): number;
    get stats(): Record<string, number>;
    clear(): void;
    delete(key: any): void;
    entries(): IterableIterator<Array<any>>;
    forEach(func: Function): void;
    get(key: any): any;
    has(key: any): boolean;
    keys(): IterableIterator<any>;
    set(key: any, value: any): void;
    toJSON(): Record<string, any>;
    values(): IterableIterator<any>;
}
