const { BufferMap } = require("../dist/buffermap.js");
const expect = require("chai").expect;

const m = new BufferMap({hasher: "xxhash32"});

const x = [
    22,
    "255",
    [255, 128],
    JSON.stringify([255, 128]),
    "test",
    Buffer.alloc(8),
    "0000000000000000",
    {id: 1},
    JSON.stringify({id: 1}),
    "another test",
    [1, "a"],
    {id: 12, first: "James", last: "BonTempo"},
    {id: 12345, first: "James", last: "BonTempo", aka: ["Good Times"], email: "jbontempo@gmail.com", emoji: "👨‍👦"},
    "An unsuccessful attempt was made to pass an amendment to the Constitution of New Jersey in 1927. The legislature twice passed a proposal, subject to a popular vote, intended to increase the length of the terms of its members and the governor, with the text approved by the state attorney general. Then, it was realized that though the legislature intended that members of its lower house, the General Assembly, be elected biennially (once in two years), the text actually read that they were to be chosen \"biannually\" (twice a year). The press was considerably amused by this. Democrats opposed the amendment as it provided that the governor would be elected at the same time as the U.S. president, something that they felt benefited Republicans. The Democrats' political boss, Jersey City mayor Frank Hague (pictured), spoke against it. On September 20, 1927, the people of New Jersey voted down the proposal, and Assembly members served one-year terms until the state passed a new constitution in 1947. 😄",
    null,
    ["Ack!", undefined]
];

describe ("BufferMap tests", () => {

    it("Inserts multiple key/value pairs", () => {
        for (let i = 0; i < x.length; i++) {
            const key = x[i];
            m.set(key, key);
        }
        const stats = m.stats;
        expect(m.size).to.equal(x.length);
    });

    it("Checks the map stats", () => {
        const stats = m.stats;
        expect(stats.pairs).to.equal(x.length);
        expect(stats.keys + stats.collisions).to.equal(stats.pairs);
        expect(stats.empty).to.equal(stats.buckets - stats.keys);
        expect(stats.efficiency).to.equal(stats.keys / stats.pairs);
        expect(stats.load).to.equal(stats.pairs / stats.keys);
        expect(stats.pairs).to.be.lessThanOrEqual(stats.buckets * 0.75);
        expect(stats.pairs).to.be.greaterThanOrEqual(stats.buckets * 0.25);
    });

    it("Inserts the same key/value pairs again", () => {
        for (let i = 0; i < x.length; i++) {
            const key = x[i];
            m.set(key, key);
        }
        const stats = m.stats;
        expect(m.size).to.equal(x.length);
    });

    it("Retrieves a number-based key", () => {
        expect(m.get(22)).to.equal(22);
    });

    it("Retrieves a string-based key", () => {
        expect(m.get("test")).to.equal("test");
    });

    it("Retrieves an array-based key", () => {
        expect(m.get([255, 128])).to.deep.equal([255, 128]);
    });

    it("Retrieves an object-based key", () => {
        expect(m.get({id: 12, first: "James", last: "BonTempo"})).to.deep.equal({id: 12, first: "James", last: "BonTempo"});
    });

    it("Retrieves a buffer-based key", () => {
        expect(m.get(Buffer.alloc(8))).to.deep.equal(Buffer.alloc(8));
    });

    it("Retrieves a null key", () => {
        expect(m.get(null)).to.deep.equal(null);
    });

    it("Looks for a key that doesn't exist", () => {
        expect(m.has({foo: "bar"})).to.equal(false);
        expect(m.has(Buffer.from(["Scooby dooby doo!", 12]))).to.equal(false);
    });

    it("Considers two equal objects as the same key", () => {
        const o1 = m.get({id: 1});
        const o2 = m.get({id: 1});
        expect(o1).to.deep.equal(o2);
    });

    it("Considers two equal arrays as the same key", () => {
        const a1 = m.get([255, 128]);
        const a2 = m.get([255, 128]);
        expect(a1).to.deep.equal(a2);
    });

    it("Considers two equal buffers as the same key", () => {
        const a1 = m.get(Buffer.alloc(4));
        const a2 = m.get(Buffer.alloc(4));
        expect(a1).to.deep.equal(a2);
    });

    it("Distinguishes between an object-based key and a stringified version of it", () => {
        const o = m.get({id: 1});
        const s = m.get(JSON.stringify({id: 1}));
        expect(o).to.not.equal(s);
    });

    it("Distinguishes between an array-based key and a stringified version of it", () => {
        const a = m.get([255, 128]);
        const s = m.get(JSON.stringify([255, 128]));
        expect(a).to.not.equal(s);
    });

    it("Accesses the keys iterator", () => {
        const keys = Array.from(m.keys());
        for (const key of keys) {
            expect(x).to.include(key);
        }
        expect(keys.length).to.equal(x.length);
    });

    it("Accesses the values iterator", () => {
        const values = Array.from(m.values());
        for (const value of values) {
            expect(x).to.include(value);
        }
        expect(values.length).to.equal(x.length);
    });

    it("Accesses the entries iterator", () => {
        const entries = Array.from(m.entries());
        for (const entry of entries) {
            expect(x).to.include(entry[0]);
            expect(x).to.include(entry[1]);
        }
        expect(entries.length).to.equal(x.length);
    });

    it("Uses the forEach method", () => {
        let count = 0;
        m.forEach((value, key) => {
            expect(x).to.include(key);
            expect(x).to.include(value);
            count++;
        });
        expect(count).to.equal(m.size);
        expect(count).to.equal(x.length);
    });

    it("Deletes half of the keys/value pairs", () => {
        for (let i = 0; i < x.length / 2; i++) {
            m.delete(x[i]);
        }
        expect(m.size).to.equal(x.length / 2);
    });

    it("Checks the map stats again", () => {
        const stats = m.stats;
        expect(stats.pairs).to.equal(x.length / 2);
        expect(stats.keys + stats.collisions).to.equal(stats.pairs);
        expect(stats.empty).to.equal(stats.buckets - stats.keys);
        expect(stats.efficiency).to.equal(stats.keys / stats.pairs);
        expect(stats.load).to.equal(stats.pairs / stats.keys);
        expect(stats.pairs).to.be.lessThanOrEqual(stats.buckets * 0.75);
        expect(stats.pairs).to.be.greaterThanOrEqual(stats.buckets * 0.25);
    });

    it("Inserts many more key/value pairs", () => {
        for (let i = 0; i <512; i++) {
            m.set(i*57, [i, String.fromCharCode(i*713)]);
        }
    });

    it("Checks the map stats a third time", () => {
        const stats = m.stats;
        expect(stats.pairs).to.equal((x.length / 2) + 512);
        expect(stats.keys + stats.collisions).to.equal(stats.pairs);
        expect(stats.empty).to.equal(stats.buckets - stats.keys);
        expect(stats.efficiency).to.equal(stats.keys / stats.pairs);
        expect(stats.load).to.equal(stats.pairs / stats.keys);
        expect(stats.pairs).to.be.lessThanOrEqual(stats.buckets * 0.75);
        expect(stats.pairs).to.be.greaterThanOrEqual(stats.buckets * 0.25);
    });

    it("Clears the map", () => {
        m.clear();
        expect(m.size).to.equal(0);
    });

    it("Checks the map stats one last time", () => {
        const stats = m.stats;
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
