import { Buffer } from "node:buffer";
import { endianness } from "node:os";

import { BSON } from "bson";
import sha256 from "crypto-js/sha256";
const xxhash = require("xxhash");

export class BufferMap {

    // Private properties

    #options: Record<string, any> = {hasher: "xxhash64", seed: 0xb4b3f4f3};
    #buckets: number = 2;
    #pairs: number = 0;
    #keys: number = 0;
    #collisions: number = 0;
    #data: Array<Array<any>> = new Array(2);

    // Constructor

    constructor(options: any) {
        this.#options = Object.assign(this.#options, options);
    }

    // Public properties

    get size(): number {
        return this.#pairs;
    }

    get stats(): Record<string, number> {
        return {
            buckets: this.#buckets,
            pairs: this.#pairs,
            keys: this.#keys,
            collisions: this.#collisions,
            empty: this.#buckets - this.#keys,
            efficiency: this.#keys / this.#pairs,
            load: this.#pairs / this.#keys
        }
    }

    // Public methods

    clear(): void {
        this.#buckets = 2;
        this.#pairs = 0;
        this.#keys = 0;
        this.#collisions = 0;
        this.#data = new Array(2);
    }
    
    delete(key: any): void {
        const index: number = this.#index(key, this.#buckets);
        const keydata: Array<any> = this.#data[index];
        if (keydata !== undefined) {
            const keyindex: number = keydata.findIndex((pair: Array<any>) => this.#hex(pair[0]) === this.#hex(key));
            if (keyindex >= 0) {
                keydata.splice(keyindex, 1);
                this.#pairs--;
                if (keydata.length === 0) {
                    this.#keys--;
                } else {
                    this.#collisions--;
                }
                if (this.#pairs <= this.#buckets * 0.25) {
                    this.#rehash(this.#buckets / 2);
                }
            }
        }
    }

    *entries(): IterableIterator<Array<any>> {
        if (this.#keys === 0) return;
        const length: number = this.#data.length;
        for (let i = 0; i < length; i++) {
            const keydata: Array<any> = this.#data[i];
            if (keydata !== undefined) {
                const keydatalength: number = keydata.length;
                for (let j = 0; j < keydatalength; j++) {
                    yield keydata[j];
                }
            }
        }
    }

    forEach(func: Function): void {
		if (this.#keys === 0) return;
		const iterator: IterableIterator<Array<any>> = this.entries();
		let next: IteratorResult<Array<any>> = iterator.next();
		while (!next.done) {
            const pair: Array<any> = next.value;
            const key: any = pair[0];
            const value: any = pair[1];
			func(value, key, this);
			next = iterator.next();
		}
    }

    get(key: any): any {
        const index: number = this.#index(key, this.#buckets);
        const keydata: Array<any> = this.#data[index];
        if (keydata !== undefined) {
            const keyindex: number = keydata.findIndex((pair: Array<any>) => this.#hex(pair[0]) === this.#hex(key));
            if (keyindex >= 0) return keydata[keyindex][1];
        }
    }

    has(key: any) {
        const index: number = this.#index(key, this.#buckets);
        const keydata: Array<any> = this.#data[index];
        if (keydata !== undefined) {
            const keyindex: number = keydata.findIndex((pair: Array<any>) => this.#hex(pair[0]) === this.#hex(key));
            return (keyindex >= 0) ? true : false;
        } else {
            return false;
        }
    }

    *keys(): IterableIterator<any> {
        if (this.#keys === 0) return;
        const length:number = this.#data.length;
        for (let i = 0; i < length; i++) {
            const keydata: Array<any> = this.#data[i];
            if (keydata !== undefined) {
                const keydatalength: number = keydata.length;
                for (let j = 0; j < keydatalength; j++) {
                    yield keydata[j][0];
                }
            }
        }
    }

    set(key: any, value: any): void {
        const index: number = this.#index(key, this.#buckets);
        const keydata: Array<any> = this.#data[index];
        if (keydata !== undefined) {
            const keyindex: number = keydata.findIndex((pair: Array<any>) => this.#hex(pair[0]) === this.#hex(key));
            if (keyindex >= 0) {
                keydata[keyindex][1] = value;
            } else {
                keydata.push([key, value]);
                this.#pairs++;
                this.#collisions++;
            }
        } else {
            this.#data[index] = [[key, value]];
            this.#pairs++;
            this.#keys++;
        }
        if (this.#pairs >= this.#buckets * 0.75) {
            this.#rehash(this.#buckets * 2);
        }
    }

    toJSON(): Record<string, any> {
        return Object.assign(this.stats, {
            hasher: this.#options.hasher,
            data: this.#data
        });
    }

    *values(): IterableIterator<any> {
        if (this.#keys === 0) return;
        const length: number = this.#data.length;
        for (let i = 0; i < length; i++) {
            const keydata: Array<any> = this.#data[i];
            if (keydata !== undefined) {
                const keydatalength: number = keydata.length;
                for (let j = 0; j < keydatalength; j++) {
                    yield keydata[j][1];
                }
            }
        }
    }

    #buffer(key: any): Buffer {
        const type: string = this.#type(key);
        let buffer: Buffer;
        if (type === "object") {
            buffer = Buffer.from(BSON.serialize(key));
        } else if (type === "number") {
            buffer = Buffer.alloc(32);
            if (endianness() === "LE") {
                buffer.writeInt32LE(key);
            } else {
                buffer.writeInt32BE(key)
            }
        } else if (type === "null" || type === "undefined") {
            buffer = Buffer.from("\0", "binary");
        } else {
            buffer = Buffer.from(key);
        }
        return buffer;
    }

    // Private methods

    #hash(key: any): string {
        const hasher: string = this.#options.hasher;
        switch (hasher) {
            case "sha256":
                return this.#sha256(key);
            case "xxhash32":
                return this.#xxhash32(key);
            default:
                return this.#xxhash64(key);
        }
    }

    #hex(key: any): string {
        const buffer: Buffer = this.#buffer(key);
        return buffer.toString("hex");
    }

    #index(key: any, size: number): number {
        const hash: string = this.#hash(key);
        const int: number = parseInt(hash, 16);
        return int & (size - 1);
    }

    #rehash(newbuckets: number): void {
        let newkeys: number = 0;
        let newcollisions: number = 0;
        const newdata: Array<any> = new Array(newbuckets);
        const buckets: number = this.#buckets;
        for (let i = 0; i < buckets; i++) {
            const data: Array<Array<any>> = this.#data[i];
            if (data !== undefined) {
                const length: number = data.length;
                for (let j = 0; j < length; j++) {
                    const pair: Array<any> = data[j];
                    const key: any = pair[0];
                    const index: number = this.#index(key, newbuckets)
                    if (newdata[index] !== undefined) {
                        newcollisions++;
                        newdata[index].push(pair);
                    } else {
                        newkeys++;
                        newdata[index] = [pair];
                    }
                }
            }
        }
        this.#buckets = newbuckets;
        this.#keys = newkeys;
        this.#collisions = newcollisions;
        this.#data = newdata;
    }

    #sha256(key: any): string {
        const hex: string = this.#hex(key);
        return sha256(hex).toString().substring(0, 13);
    }

    #type(key: any): string {
        const type: string = typeof key;
        if (type !== "object") {
            return type;
        } else if (key === null) {
            return "null";
        } else {
            return Object.prototype.toString.call(key).slice(8,-1).toLowerCase();
        }
    }

    #xxhash32(key: any): string {
        const buffer: Buffer = this.#buffer(key);
        return xxhash.hash(buffer, this.#options.seed, "hex");
    }

    #xxhash64(key: any): string {
        const buffer: Buffer = this.#buffer(key);
        return xxhash.hash64(buffer, this.#options.seed, "hex").substring(0, 13);
    }

}