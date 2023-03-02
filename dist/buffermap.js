"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _BufferMap_instances, _BufferMap_options, _BufferMap_buckets, _BufferMap_pairs, _BufferMap_keys, _BufferMap_collisions, _BufferMap_data, _BufferMap_buffer, _BufferMap_hash, _BufferMap_hex, _BufferMap_index, _BufferMap_rehash, _BufferMap_sha256, _BufferMap_xxhash32, _BufferMap_xxhash64;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BufferMap = void 0;
const node_buffer_1 = require("node:buffer");
const bson_1 = require("bson");
const sha256_1 = __importDefault(require("crypto-js/sha256"));
const xxhash = require("xxhash");
Array.prototype.toBuffer = function () {
    return node_buffer_1.Buffer.from(this);
};
BigInt.prototype.toBuffer = function () {
    return node_buffer_1.Buffer.from(this.toString());
};
BigInt64Array.prototype.toBuffer = function () {
    return node_buffer_1.Buffer.from(this.toString());
};
BigUint64Array.prototype.toBuffer = function () {
    return node_buffer_1.Buffer.from(this.toString());
};
Boolean.prototype.toBuffer = function () {
    return node_buffer_1.Buffer.from(this.toString());
};
Date.prototype.toBuffer = function () {
    return node_buffer_1.Buffer.from(this);
};
Function.prototype.toBuffer = function () {
    return node_buffer_1.Buffer.from(this.toString());
    ;
};
Map.prototype.toBuffer = function () {
    return node_buffer_1.Buffer.from(bson_1.BSON.serialize(Object.fromEntries(this.entries())));
};
Number.prototype.toBuffer = function () {
    return node_buffer_1.Buffer.from(this.toString());
};
Object.prototype.toBuffer = function () {
    return node_buffer_1.Buffer.from(bson_1.BSON.serialize(this));
};
RegExp.prototype.toBuffer = function () {
    return node_buffer_1.Buffer.from(this.toString());
};
Set.prototype.toBuffer = function () {
    return node_buffer_1.Buffer.from(Array.from(this.values()));
};
String.prototype.toBuffer = function () {
    return node_buffer_1.Buffer.from(this);
};
Symbol.prototype.toBuffer = function () {
    return node_buffer_1.Buffer.from(this.toString());
};
Uint8Array.prototype.toBuffer = function () {
    return node_buffer_1.Buffer.from(this);
};
Uint16Array.prototype.toBuffer = function () {
    return node_buffer_1.Buffer.from(this);
};
Uint32Array.prototype.toBuffer = function () {
    return node_buffer_1.Buffer.from(this);
};
class BufferMap {
    // Constructor
    constructor(options) {
        _BufferMap_instances.add(this);
        // Private properties
        _BufferMap_options.set(this, { hasher: "xxhash64", seed: 0xb4b3f4f3 });
        _BufferMap_buckets.set(this, 2);
        _BufferMap_pairs.set(this, 0);
        _BufferMap_keys.set(this, 0);
        _BufferMap_collisions.set(this, 0);
        _BufferMap_data.set(this, new Array(2));
        __classPrivateFieldSet(this, _BufferMap_options, Object.assign(__classPrivateFieldGet(this, _BufferMap_options, "f"), options), "f");
    }
    // Public properties
    get size() {
        return __classPrivateFieldGet(this, _BufferMap_pairs, "f");
    }
    get stats() {
        return {
            buckets: __classPrivateFieldGet(this, _BufferMap_buckets, "f"),
            pairs: __classPrivateFieldGet(this, _BufferMap_pairs, "f"),
            keys: __classPrivateFieldGet(this, _BufferMap_keys, "f"),
            collisions: __classPrivateFieldGet(this, _BufferMap_collisions, "f"),
            empty: __classPrivateFieldGet(this, _BufferMap_buckets, "f") - __classPrivateFieldGet(this, _BufferMap_keys, "f"),
            efficiency: __classPrivateFieldGet(this, _BufferMap_keys, "f") / __classPrivateFieldGet(this, _BufferMap_pairs, "f"),
            load: __classPrivateFieldGet(this, _BufferMap_pairs, "f") / __classPrivateFieldGet(this, _BufferMap_keys, "f")
        };
    }
    // Public methods
    clear() {
        __classPrivateFieldSet(this, _BufferMap_buckets, 2, "f");
        __classPrivateFieldSet(this, _BufferMap_pairs, 0, "f");
        __classPrivateFieldSet(this, _BufferMap_keys, 0, "f");
        __classPrivateFieldSet(this, _BufferMap_collisions, 0, "f");
        __classPrivateFieldSet(this, _BufferMap_data, new Array(2), "f");
    }
    delete(key) {
        var _a, _b, _c;
        const index = __classPrivateFieldGet(this, _BufferMap_instances, "m", _BufferMap_index).call(this, key, __classPrivateFieldGet(this, _BufferMap_buckets, "f"));
        const keydata = __classPrivateFieldGet(this, _BufferMap_data, "f")[index];
        if (keydata !== undefined) {
            const keyindex = keydata.findIndex((pair) => __classPrivateFieldGet(this, _BufferMap_instances, "m", _BufferMap_hex).call(this, pair[0]) === __classPrivateFieldGet(this, _BufferMap_instances, "m", _BufferMap_hex).call(this, key));
            if (keyindex >= 0) {
                keydata.splice(keyindex, 1);
                __classPrivateFieldSet(this, _BufferMap_pairs, (_a = __classPrivateFieldGet(this, _BufferMap_pairs, "f"), _a--, _a), "f");
                if (keydata.length === 0) {
                    __classPrivateFieldSet(this, _BufferMap_keys, (_b = __classPrivateFieldGet(this, _BufferMap_keys, "f"), _b--, _b), "f");
                }
                else {
                    __classPrivateFieldSet(this, _BufferMap_collisions, (_c = __classPrivateFieldGet(this, _BufferMap_collisions, "f"), _c--, _c), "f");
                }
                if (__classPrivateFieldGet(this, _BufferMap_pairs, "f") <= __classPrivateFieldGet(this, _BufferMap_buckets, "f") * 0.25) {
                    __classPrivateFieldGet(this, _BufferMap_instances, "m", _BufferMap_rehash).call(this, __classPrivateFieldGet(this, _BufferMap_buckets, "f") / 2);
                }
            }
        }
    }
    *entries() {
        if (__classPrivateFieldGet(this, _BufferMap_keys, "f") === 0)
            return;
        const length = __classPrivateFieldGet(this, _BufferMap_data, "f").length;
        for (let i = 0; i < length; i++) {
            const keydata = __classPrivateFieldGet(this, _BufferMap_data, "f")[i];
            if (keydata !== undefined) {
                const keydatalength = keydata.length;
                for (let j = 0; j < keydatalength; j++) {
                    yield keydata[j];
                }
            }
        }
    }
    forEach(func) {
        if (__classPrivateFieldGet(this, _BufferMap_keys, "f") === 0)
            return;
        const iterator = this.entries();
        let next = iterator.next();
        while (!next.done) {
            const pair = next.value;
            const key = pair[0];
            const value = pair[1];
            func(value, key, this);
            next = iterator.next();
        }
    }
    get(key) {
        const index = __classPrivateFieldGet(this, _BufferMap_instances, "m", _BufferMap_index).call(this, key, __classPrivateFieldGet(this, _BufferMap_buckets, "f"));
        const keydata = __classPrivateFieldGet(this, _BufferMap_data, "f")[index];
        if (keydata !== undefined) {
            const keyindex = keydata.findIndex((pair) => __classPrivateFieldGet(this, _BufferMap_instances, "m", _BufferMap_hex).call(this, pair[0]) === __classPrivateFieldGet(this, _BufferMap_instances, "m", _BufferMap_hex).call(this, key));
            if (keyindex >= 0)
                return keydata[keyindex][1];
        }
    }
    has(key) {
        const index = __classPrivateFieldGet(this, _BufferMap_instances, "m", _BufferMap_index).call(this, key, __classPrivateFieldGet(this, _BufferMap_buckets, "f"));
        const keydata = __classPrivateFieldGet(this, _BufferMap_data, "f")[index];
        if (keydata !== undefined) {
            const keyindex = keydata.findIndex((pair) => __classPrivateFieldGet(this, _BufferMap_instances, "m", _BufferMap_hex).call(this, pair[0]) === __classPrivateFieldGet(this, _BufferMap_instances, "m", _BufferMap_hex).call(this, key));
            return (keyindex >= 0) ? true : false;
        }
        else {
            return false;
        }
    }
    *keys() {
        if (__classPrivateFieldGet(this, _BufferMap_keys, "f") === 0)
            return;
        const length = __classPrivateFieldGet(this, _BufferMap_data, "f").length;
        for (let i = 0; i < length; i++) {
            const keydata = __classPrivateFieldGet(this, _BufferMap_data, "f")[i];
            if (keydata !== undefined) {
                const keydatalength = keydata.length;
                for (let j = 0; j < keydatalength; j++) {
                    yield keydata[j][0];
                }
            }
        }
    }
    set(key, value) {
        var _a, _b, _c, _d;
        const index = __classPrivateFieldGet(this, _BufferMap_instances, "m", _BufferMap_index).call(this, key, __classPrivateFieldGet(this, _BufferMap_buckets, "f"));
        const keydata = __classPrivateFieldGet(this, _BufferMap_data, "f")[index];
        if (keydata !== undefined) {
            const keyindex = keydata.findIndex((pair) => __classPrivateFieldGet(this, _BufferMap_instances, "m", _BufferMap_hex).call(this, pair[0]) === __classPrivateFieldGet(this, _BufferMap_instances, "m", _BufferMap_hex).call(this, key));
            if (keyindex >= 0) {
                keydata[keyindex][1] = value;
            }
            else {
                keydata.push([key, value]);
                __classPrivateFieldSet(this, _BufferMap_pairs, (_a = __classPrivateFieldGet(this, _BufferMap_pairs, "f"), _a++, _a), "f");
                __classPrivateFieldSet(this, _BufferMap_collisions, (_b = __classPrivateFieldGet(this, _BufferMap_collisions, "f"), _b++, _b), "f");
            }
        }
        else {
            __classPrivateFieldGet(this, _BufferMap_data, "f")[index] = [[key, value]];
            __classPrivateFieldSet(this, _BufferMap_pairs, (_c = __classPrivateFieldGet(this, _BufferMap_pairs, "f"), _c++, _c), "f");
            __classPrivateFieldSet(this, _BufferMap_keys, (_d = __classPrivateFieldGet(this, _BufferMap_keys, "f"), _d++, _d), "f");
        }
        if (__classPrivateFieldGet(this, _BufferMap_pairs, "f") >= __classPrivateFieldGet(this, _BufferMap_buckets, "f") * 0.75) {
            __classPrivateFieldGet(this, _BufferMap_instances, "m", _BufferMap_rehash).call(this, __classPrivateFieldGet(this, _BufferMap_buckets, "f") * 2);
        }
    }
    toJSON() {
        return Object.assign(this.stats, {
            hasher: __classPrivateFieldGet(this, _BufferMap_options, "f").hasher,
            data: __classPrivateFieldGet(this, _BufferMap_data, "f")
        });
    }
    *values() {
        if (__classPrivateFieldGet(this, _BufferMap_keys, "f") === 0)
            return;
        const length = __classPrivateFieldGet(this, _BufferMap_data, "f").length;
        for (let i = 0; i < length; i++) {
            const keydata = __classPrivateFieldGet(this, _BufferMap_data, "f")[i];
            if (keydata !== undefined) {
                const keydatalength = keydata.length;
                for (let j = 0; j < keydatalength; j++) {
                    yield keydata[j][1];
                }
            }
        }
    }
}
exports.BufferMap = BufferMap;
_BufferMap_options = new WeakMap(), _BufferMap_buckets = new WeakMap(), _BufferMap_pairs = new WeakMap(), _BufferMap_keys = new WeakMap(), _BufferMap_collisions = new WeakMap(), _BufferMap_data = new WeakMap(), _BufferMap_instances = new WeakSet(), _BufferMap_buffer = function _BufferMap_buffer(key) {
    return key.toBuffer();
}, _BufferMap_hash = function _BufferMap_hash(key) {
    const hasher = __classPrivateFieldGet(this, _BufferMap_options, "f").hasher;
    switch (hasher) {
        case "sha256":
            return __classPrivateFieldGet(this, _BufferMap_instances, "m", _BufferMap_sha256).call(this, key);
        case "xxhash32":
            return __classPrivateFieldGet(this, _BufferMap_instances, "m", _BufferMap_xxhash32).call(this, key);
        default:
            return __classPrivateFieldGet(this, _BufferMap_instances, "m", _BufferMap_xxhash64).call(this, key);
    }
}, _BufferMap_hex = function _BufferMap_hex(key) {
    const buffer = __classPrivateFieldGet(this, _BufferMap_instances, "m", _BufferMap_buffer).call(this, key);
    return buffer.toString("hex");
}, _BufferMap_index = function _BufferMap_index(key, size) {
    const hash = __classPrivateFieldGet(this, _BufferMap_instances, "m", _BufferMap_hash).call(this, key);
    const int = parseInt(hash, 16);
    return int & (size - 1);
}, _BufferMap_rehash = function _BufferMap_rehash(newbuckets) {
    let newkeys = 0;
    let newcollisions = 0;
    const newdata = new Array(newbuckets);
    const buckets = __classPrivateFieldGet(this, _BufferMap_buckets, "f");
    for (let i = 0; i < buckets; i++) {
        const data = __classPrivateFieldGet(this, _BufferMap_data, "f")[i];
        if (data !== undefined) {
            const length = data.length;
            for (let j = 0; j < length; j++) {
                const pair = data[j];
                const key = pair[0];
                const index = __classPrivateFieldGet(this, _BufferMap_instances, "m", _BufferMap_index).call(this, key, newbuckets);
                if (newdata[index] !== undefined) {
                    newcollisions++;
                    newdata[index].push(pair);
                }
                else {
                    newkeys++;
                    newdata[index] = [pair];
                }
            }
        }
    }
    __classPrivateFieldSet(this, _BufferMap_buckets, newbuckets, "f");
    __classPrivateFieldSet(this, _BufferMap_keys, newkeys, "f");
    __classPrivateFieldSet(this, _BufferMap_collisions, newcollisions, "f");
    __classPrivateFieldSet(this, _BufferMap_data, newdata, "f");
}, _BufferMap_sha256 = function _BufferMap_sha256(key) {
    const hex = __classPrivateFieldGet(this, _BufferMap_instances, "m", _BufferMap_hex).call(this, key);
    return (0, sha256_1.default)(hex).toString().substring(0, 13);
}, _BufferMap_xxhash32 = function _BufferMap_xxhash32(key) {
    const buffer = __classPrivateFieldGet(this, _BufferMap_instances, "m", _BufferMap_buffer).call(this, key);
    return xxhash.hash(buffer, __classPrivateFieldGet(this, _BufferMap_options, "f").seed, "hex");
}, _BufferMap_xxhash64 = function _BufferMap_xxhash64(key) {
    const buffer = __classPrivateFieldGet(this, _BufferMap_instances, "m", _BufferMap_buffer).call(this, key);
    return xxhash.hash64(buffer, __classPrivateFieldGet(this, _BufferMap_options, "f").seed, "hex").substring(0, 13);
};
//# sourceMappingURL=buffermap.js.map