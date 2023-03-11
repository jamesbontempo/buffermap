const { BufferMap } = require("../dist/buffermap.js");

const expect = require("chai").expect;

const map = new BufferMap({hasher: "xxhash32"});

const data = {
    array: [255, "128", null, undefined],
    bigint: 9007199254740993n,
    bigint64array: new BigInt64Array([9007199254740993n, 90071992547409934n]),
    biguint64array: new BigUint64Array([9007199254740993n, 90071992547409934n, 90071992547409935n]),
    boolean: true,
    date: new Date("1991-05-15T17:30:00"),
    error: new Error("test"),
    function: () => {},
    infinity: Infinity,
    map: new Map([[1, "one"],[2, "two"],[3, "three"]]),
    number: 12.3456789,
    object: {id: 1, first: "James", last: "BonTempo", nicknames: ["Good Times"], emoji: "😀"},
    regexp: /^$/,
    set: new Set([1, 2, 3, 4, 5]),
    string: "255",
    symbol: Symbol("foo"),
    uint8array: new Uint8Array(2),
    uint16array: new Uint16Array(3),
    uint32array: new Uint32Array(4),
}

const types = Object.keys(data);

describe ("BufferMap tests", () => {

    it("Inserts multiple key/value pairs", () => {
        for (const type of types) {
            const key = data[type];
            map.set(key, key);
        }
        const stats = map.stats;
        expect(map.size).to.equal(types.length);
    });

    it("Retrieves the values for the different key types", () => {
        for (const type of types) {
            expect(map.get(data[type])).to.equal(data[type]);
        }
    });
    
    it("Checks the map stats", () => {
        const stats = map.stats;
        expect(stats.pairs).to.equal(types.length);
        expect(stats.keys + stats.collisions).to.equal(stats.pairs);
        expect(stats.empty).to.equal(stats.buckets - stats.keys);
        expect(stats.efficiency).to.equal(stats.keys / stats.pairs);
        expect(stats.load).to.equal(stats.pairs / stats.keys);
        expect(stats.pairs).to.be.lessThanOrEqual(stats.buckets * 0.75);
        expect(stats.pairs).to.be.greaterThanOrEqual(stats.buckets * 0.25);
    });    

    it("Inserts the same key/value pairs again", () => {
        for (const type of types) {
            const key = data[type];
            map.set(key, key);
        }
        const stats = map.stats;
        expect(map.size).to.equal(types.length);
    });

    it("Considers two equal objects as the same key", () => {
        for (const type of types) {
            const o1 = map.get(data[type]);
            const o2 = map.get(data[type]);
            expect(o1).to.deep.equal(o2);
        }
    });

    it("Looks for a key that doesn't exist", () => {
        expect(map.has({foo: "bar"})).to.equal(false);
        expect(map.has(Buffer.from(["Scooby dooby doo!", 12]))).to.equal(false);
    });

    it("Distinguishes between an object-based key and a stringified version of it", () => {
        const o = map.get(data["object"]);
        const s = map.get(JSON.stringify(data["object"]));
        expect(o).to.not.equal(s);
    });

    it("Distinguishes between an array-based key and a stringified version of it", () => {
        const a = map.get(data["array"]);
        const s = map.get(JSON.stringify(data["array"]));
        expect(a).to.not.equal(s);
    });

    it("Accesses the keys iterator", () => {
        const keys = Array.from(map.keys());
        for (const key of keys) {
            expect(Object.values(data)).to.include(key);
        }
        expect(keys.length).to.equal(types.length);
    });

    it("Accesses the values iterator", () => {
        const values = Array.from(map.values());
        for (const value of values) {
            expect(Object.values(data)).to.include(value);
        }
        expect(values.length).to.equal(types.length);
    });

    it("Accesses the entries iterator", () => {
        const entries = Array.from(map.entries());
        for (const entry of entries) {
            expect(Object.values(data)).to.include(entry[0]);
            expect(Object.values(data)).to.include(entry[1]);
        }
        expect(entries.length).to.equal(types.length);
    });

    it("Uses the forEach method", () => {
        let count = 0;
        map.forEach((value, key) => {
            expect(Object.values(data)).to.include(key);
            expect(Object.values(data)).to.include(value);
            count++;
        });
        expect(count).to.equal(map.size);
        expect(count).to.equal(types.length);
    });

    it("Deletes half of the keys/value pairs", () => {
        for (let i = 0; i < types.length / 2; i++) {
            map.delete(data[types[i]]);
        }
        expect(map.size).to.be.lessThanOrEqual(types.length / 2);
    });

    it("Checks the map stats again", () => {
        const stats = map.stats;
        expect(stats.pairs).to.be.lessThanOrEqual(types.length / 2);
        expect(stats.keys + stats.collisions).to.equal(stats.pairs);
        expect(stats.empty).to.equal(stats.buckets - stats.keys);
        expect(stats.efficiency).to.equal(stats.keys / stats.pairs);
        expect(stats.load).to.equal(stats.pairs / stats.keys);
        expect(stats.pairs).to.be.lessThanOrEqual(stats.buckets * 0.75);
        expect(stats.pairs).to.be.greaterThanOrEqual(stats.buckets * 0.25);
    });

    it("Inserts many more key/value pairs", () => {
        for (let i = 0; i < 1024; i++) {
            map.set(i*57, [i, String.fromCharCode(i*713)]);
        }
        expect(map.get(512*57)).to.deep.equal([512, String.fromCharCode(512*713)])
    });

    it("Checks the map stats a third time", () => {
        const stats = map.stats;
        expect(stats.pairs).to.equal(Math.floor(types.length / 2) + 1024);
        expect(stats.keys + stats.collisions).to.equal(stats.pairs);
        expect(stats.empty).to.equal(stats.buckets - stats.keys);
        expect(stats.efficiency).to.equal(stats.keys / stats.pairs);
        expect(stats.load).to.equal(stats.pairs / stats.keys);
        expect(stats.pairs).to.be.lessThanOrEqual(stats.buckets * 0.75);
        expect(stats.pairs).to.be.greaterThanOrEqual(stats.buckets * 0.25);
    });

    it("Clears the map", () => {
        map.clear();
        expect(map.size).to.equal(0);
    });

    it("Checks the map stats one last time", () => {
        const stats = map.stats;
        expect(stats.buckets).to.equal(2);
        expect(stats.pairs).to.equal(0);
        expect(stats.keys).to.equal(0);
        expect(stats.collisions).to.equal(0);
        expect(stats.empty).to.equal(2);
        expect(stats.efficiency).to.be.NaN;
        expect(stats.load).to.be.NaN;
    });

    it("Creates a map using the SHA256 hasher", () => {
        const msha = new BufferMap({hasher: "sha256"});
        msha.set(1, 1);
        expect(msha.toJSON().hasher).to.equal("sha256");
    });

    it("Creates a map using the XXHASH64 hasher by default", () => {
        const mxx64 = new BufferMap();
        mxx64.set(1, 1);
        expect(mxx64.toJSON().hasher).to.equal("xxhash64");
    });

});
