/*

Tool to parse "Madlibs Markup" into objects that the bot can use.

The syntax of "Madlibs Markup" is 
- [ noun ] for a blank,
- [ noun | var_name ] for a blank whose value will be stored in the variable `var_name`
- { var_name } to place in the value of `var_name` as defined in another blank.

The output is an object containing
- "parsed", an array consisting of four types of objects which represent:
	- raw text (type "")
	- missing words not assigned to a variable (type "[]")
	- missing words assigned to a variable (type "[|]")
	- inserted text from variables (type "{}")
- "varSources", a lookup object mapping variable names to the index in "parsed" at which they were assigned
- "varTargets", a set of indices in "parsed" that are of the form {}
- "blanks", a set of indices in "parsed" that are of the form [] or [|]

*/

function MMLparser (MMLtext) {
	// output parsing
	let parsed = [];
	let varSources = {};
	let blanks = new Set();
	let varTargets = new Set();

	// stores parsing state, either "", "[", "|", or "{".
	let state = "";

	// chars at which to end "raw text mode"
	let textEnders = new Set(["[","{"]);

	// various buffers for parsing purposes
	let lexClassBuffer = "";
	let varNameBuffer = "";
	let textBuffer = "";

	for (c of MMLtext) {
		switch (state) {
			// case when we are "inside" a set of []
			case "[":
				switch (c) {
					// if this [] specifies a variable, move on to determining the variable
					case "|":
						// clear variable name buffer & go into variable name finding state
						varNameBuffer = "";
						state = "|";
						break;

					// if the [] ends without a var
					case "]":
						blanks.add( parsed.push ( {
							"type" : "[]",
							"lexClass" : lexClassBuffer.trim()
						}) -1);
						state = "";
						textBuffer = "";
						break;

					// if not a special char, add to buffer
					default:
						lexClassBuffer += c;
						break;
				}
				break;

			// case when we're setting a variable
			case "|":
				switch (c) {
					// for end of [], objectise this [] & record its index in the variable tracker object
					case "]":
						let vn = varNameBuffer.trim();
						let ind = parsed.push ( {
							"type" : "[|]",
							"lexClass" : lexClassBuffer.trim(),
							"variable" : vn
						}) - 1 ;
						varSources[vn] = ind;
						blanks.add(ind);
						state = "";
						textBuffer = "";
						break;

					// otherwise just add to the let name buffer
					default:
						varNameBuffer += c;
						break;
				}
				break;

			// case when we're inserting some variable
			case "{":
				switch (c) {
					// for end of {}, objectise
					case "}":
						varTargets.add (parsed.push ( {
							"type" : "{}",
							"variable" : varNameBuffer.trim()
						}) -1 );
						state = "";
						textBuffer = "";
						break;
					// otherwise just add to buffer
					default:
						varNameBuffer += c;
						break;
				}
				break;
			
			// case where we're in "raw text mode"
			default:
				if (textEnders.has(c)) {
					state = c;
					parsed.push ( {
						"type" : "",
						"text" : textBuffer
					});
					textBuffer = "";
					varNameBuffer = "";
					lexClassBuffer = "";
				} else {
					textBuffer += c;
				}
				break;
		}
	}

	// end of text action: append remaining text
	parsed.push ( {
		"type" : "",
		"text" : textBuffer
	});


	return {"parsed" : parsed, "varSources" : varSources, "blanks" : [...blanks]};//, "varTargets": varTargets};
}

module.exports = {"parser" : MMLparser};
