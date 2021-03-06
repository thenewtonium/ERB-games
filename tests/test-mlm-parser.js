// script for testing the madlibs markup decoder

const { parser } = require("../helpers/mlm-parser.js")

testData = [

	"It's called a [ proper noun | college name ] [ noun | channel ] for a reason. We all [ verb ] each other really well on the { channel }, and we use it on the trust and assumption that the [ plural noun ] we're talking to will be the same as those we'll be [ verb ending in -ing ] with, making friends with and [ transitive verb ending -ing ] at [ place ]. Entering the { channel } as a college member other than { college name } breaks the [noun] and makes it [adjective] and [adjective] to understand what's going on.\
	If you'd like to [ transitive verb ] someone from { college name }, I'm sure sending them a [ singular noun ] wouldn't hurt. Some people are open to [verb ending in -ing] (those people were [state of being] yesterday)."

];

for (text of testData) {
	console.log (parser(text));
}