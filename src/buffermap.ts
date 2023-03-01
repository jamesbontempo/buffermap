import { Buffer } from "node:buffer";
import { endianness } from "node:os";

import { BSON } from "bson";
import sha256 from "crypto-js/sha256";
const xxhash = require("xxhash");

export class BufferMap {

    // Private properties

    #options: Record<string, any> = {hasher: "xxhash", seed: 0xb4b3f4f3};
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
        if (this.#data[index] !== undefined) {
            const subdata: Array<any> = this.#data[index];
            const subindex: number = subdata.findIndex((pair: Array<any>) => this.#hex(pair[0]) === this.#hex(key));
            if (subindex >= 0) {
                subdata.splice(subindex, 1);
                this.#pairs--;
                if (subdata.length === 0) {
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
            const subdata: Array<any> = this.#data[i];
            if (subdata !== undefined) {
                const sublength: number = subdata.length;
                for (let j = 0; j < sublength; j++) {
                    yield subdata[j];
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
        if (this.#data[index] !== undefined) {
            const subdata: Array<any> = this.#data[index];
            const subindex: number = subdata.findIndex((pair: Array<any>) => this.#hex(pair[0]) === this.#hex(key));
            if (subindex >= 0) {
                return subdata[subindex][1];
            }  
        }
    }

    has(key: any) {
        const index: number = this.#index(key, this.#buckets);
        return this.#data[index] !== undefined;
    }

    *keys(): IterableIterator<any> {
        if (this.#keys === 0) return;
        const length:number = this.#data.length;
        for (let i = 0; i < length; i++) {
            const subdata: Array<any> = this.#data[i];
            if (subdata !== undefined) {
                const sublength: number = subdata.length;
                for (let j = 0; j < sublength; j++) {
                    yield subdata[j][0];
                }
            }
        }
    }

    set(key: any, value: any): void {
        const index: number = this.#index(key, this.#buckets);
        if (this.#data[index] !== undefined) {
            const subdata: Array<any> = this.#data[index];
            const subindex: number = subdata.findIndex((pair: Array<any>) => this.#hex(pair[0]) === this.#hex(key));
            if (subindex >= 0) {
                subdata[subindex][1] = value;
            } else {
                subdata.push([key, value]);
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
            const subdata: Array<any> = this.#data[i];
            if (subdata !== undefined) {
                const sublength: number = subdata.length;
                for (let j = 0; j < sublength; j++) {
                    yield subdata[j][1];
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

    #rehash(newBuckets: number): void {
        let newKeys: number = 0;
        let newCollisions: number = 0;
        const newData: Array<any> = new Array(newBuckets);
        const buckets: number = this.#buckets;
        for (let i = 0; i < buckets; i++) {
            const data: Array<Array<any>> = this.#data[i];
            if (data !== undefined) {
                const length: number = data.length;
                for (let j = 0; j < length; j++) {
                    const pair: Array<any> = data[j];
                    const key: any = pair[0];
                    const index: number = this.#index(key, newBuckets)
                    if (newData[index] !== undefined) {
                        newCollisions++;
                        newData[index].push(pair);
                    } else {
                        newKeys++;
                        newData[index] = [pair];
                    }
                }
            }
        }
        this.#buckets = newBuckets;
        this.#keys = newKeys;
        this.#collisions = newCollisions;
        this.#data = newData;
    }

    #sha256(key: any): string {
        const hex: string = this.#hex(key);
        return sha256(hex).toString().substring(0, 13);
    }

    #type(key: any): string {
        const type: string = typeof key;
        if (type !== "object") {
            return type;
        } else if (type === null) {
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