// script for testing the madlibs markup decoder

const { textToEmbeds } = require("../helpers/embed-generator.js")

text = "Here's a line.\n\nHere's Another\n\nAnd one more";
console.log(textToEmbeds(text));