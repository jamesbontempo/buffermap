const { BufferMap } = require("../dist/buffermap.js");

const m = new BufferMap({hasher: "xxhash32"});

const x = [
    22,
    "255",
    [255],
    "[255]",
    "test",
    Buffer.alloc(8),
    "0000000000000000",
    {id: 1},
    JSON.stringify({id: 1}),
    "another test",
    [1, "a"],
    Buffer.alloc(4),
    {id: 12, first: "James", last: "BonTempo"},
    "foo",
    {id: 12345, first: "James", last: "BonTempo", aka: ["Good Times"], email: "jbontempo@gmail.com", emoji: "👨‍👦"},
    "An unsuccessful attempt was made to pass an amendment to the Constitution of New Jersey in 1927. The legislature twice passed a proposal, subject to a popular vote, intended to increase the length of the terms of its members and the governor, with the text approved by the state attorney general. Then, it was realized that though the legislature intended that members of its lower house, the General Assembly, be elected biennially (once in two years), the text actually read that they were to be chosen \"biannually\" (twice a year). The press was considerably amused by this. Democrats opposed the amendment as it provided that the governor would be elected at the same time as the U.S. president, something that they felt benefited Republicans. The Democrats' political boss, Jersey City mayor Frank Hague (pictured), spoke against it. On September 20, 1927, the people of New Jersey voted down the proposal, and Assembly members served one-year terms until the state passed a new constitution in 1947. 😄"
];

for (let i = 0; i < x.length; i++) {
    const key = x[i];
    m.set(key, key);
}
console.log(m.toJSON());

for (let i = 0; i < x.length; i++) {
    const key = x[i];
    m.set(key, key);
}

for (let i = 0; i < x.length / 2; i++) {
    m.delete(x[i]);
}

console.log(m.toJSON());


for (let i = 0; i < 32; i++) {
    m.set(i*713, [i, i*713]);
}

console.log(m.stats);

/*
console.log(m.get([255]));
console.log(m.get("test"));
console.log(m.get({id: 1}));
console.log(m.get(JSON.stringify({id: 1})));
console.log(m.get(29));
console.log(m.get({id: 12, first: "James", last: "BonTempo"}));
console.log(m.get({id: 12}));
console.log(m.get("foo"));
console.log(m.get(Buffer.alloc(2)));
console.log(m.get(Buffer.alloc(8)));
console.log(m.get(212*713));
console.log(m.get(255 .toString()));

console.log(Array.from(m.keys()));
console.log(Array.from(m.values()));
console.log(Array.from(m.entries()));

m.forEach((value, key) => console.log({key: key, value: value}));

m.clear();
console.log(m.toJSON());
*/