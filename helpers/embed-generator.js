const { MessageEmbed } = require("discord.js");

module.exports = {
	
	// const for use in the below function
	rateLimits : {
		DESC : 4096,
	},
	
	// function that splits long messages into several embeds in a smart way, for getting around the discord char limits
	// this is adapted from the code I used for the same purpose in CUHoMS-email-bot
	textToEmbeds : (text) => {
		const lines = text.split(/(\r)?\n/);
		const RL = module.exports.rateLimits;
       	let embeds = [];
       	let ct = "";
       	for (l of lines) {
       		let ln = l + "\r\n";
             // if can add the line then do
       		if ( (ct.length + ln.length) < (RL.DESC) ) {
       			ct += ln;
       		} else {
       			//console.log(ln);
                // if couldn't add the line due to the new line being too long, then we seek to split it up at the last whitespace character before the length limit
                if (ln.length >= RL.DESC) {
                  // push current text if it isn't trivial
                  if (ct.length > 0) {
                    embeds.push( new MessageEmbed().setDescription(ct) );
                  }
                  ct = ln;

                  // in case we split up quoted text...
                  // (note: for my use this isn't really necessary, but it's nice to have this as a module to use in future projects!)
                  q = (  (ln.substr(0,2) == "> ") ? 2 : 0);
                  Qu = ( q == 2 ? "> " : "");

                  // keep going until we trim 
                  while (ct.length >= RL.DESC) {
                    let ptr = RL.DESC;
                    // move pointer to hit a whitespace char, or brute-force it if necessary
                    while (ct[ptr].match(/\S/)) {
                    	console.log(ptr);
                      ptr--;
                      if (ptr < 0) {
                        ptr = RL.DESC;
                        break;
                      }
                    }
                    embeds.push( new MessageEmbed().setDescription(ct.substr(0,ptr)) );
                    ct = Qu + ct.substr(ptr, ct.length);
                  }
                  // when we have got the line down to an acceptable length, we can let it continue as the current text
                } else {
                  // if no issue just push the text and set current text to the line
                  embeds.push( new MessageEmbed().setDescription(ct) );
                  ct = ln;
                }
       		}
       	}
       	// put rest of text into final embed
       	embeds.push( new MessageEmbed().setDescription(ct) );

		return embeds;
	}
}