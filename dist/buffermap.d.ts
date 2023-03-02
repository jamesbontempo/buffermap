/// <reference types="node" />
import { Buffer } from "node:buffer";
declare global {
    interface Array<T> {
        toBuffer(): Buffer;
    }
    interface BigInt {
        toBuffer(): Buffer;
    }
    interface BigInt64Array {
        toBuffer(): Buffer;
    }
    interface BigUint64Array {
        toBuffer(): Buffer;
    }
    interface Boolean {
        toBuffer(): Buffer;
    }
    interface Date {
        toBuffer(): Buffer;
    }
    interface Function {
        toBuffer(): Buffer;
    }
    interface Map<K, V> {
        toBuffer(): Buffer;
    }
    interface Number {
        toBuffer(): Buffer;
    }
    interface Object {
        toBuffer(): Buffer;
    }
    interface RegExp {
        toBuffer(): Buffer;
    }
    interface Set<T> {
        toBuffer(): Buffer;
    }
    interface String {
        toBuffer(): Buffer;
    }
    interface Symbol {
        toBuffer(): Buffer;
    }
    interface Uint8Array {
        toBuffer(): Buffer;
    }
    interface Uint16Array {
        toBuffer(): Buffer;
    }
    interface Uint32Array {
        toBuffer(): Buffer;
    }
}
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
