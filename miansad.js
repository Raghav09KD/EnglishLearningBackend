// import { diffWords } from 'diff';
const {diffWords} = require('diff');

const expected = "The power of papers is defined in the language of the pen and its writer.";
const spoken = "The power of the people is define in language the pen and of writer";

const diff = diffWords(expected, spoken);
console.log("🚀 ~ diff:", diff)

