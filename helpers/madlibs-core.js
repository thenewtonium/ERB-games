const { MessageEmbed, MessageActionRow, MessageButton, TextInputComponent, Modal } = require('discord.js');
const { inlineCode, SlashCommandBuilder, underscore } = require('@discordjs/builders');
const {randint} = require('../helpers/utils.js');
const { textToEmbeds } = require('../helpers/embed-generator.js');

// madlibs markup parser
const { parser } = require('../helpers/mlm-parser.js');

// for fetching texts
const fs = require('node:fs');
const path = require('node:path');

// data storage
const Keyv = require('keyv');

// madlibs core functions
module.exports = {
	// gamestate data
	keyvs: {
		gameData : new Keyv(),
		//gameStati : new Keyv(),
		blanksSets : new Keyv(),
		responses : new Keyv(),
		currentPrompts : new Keyv()
	},

	// function to send a word prompt, or finish the game otherwise
	prompt: async (channel) => {
		const cid = channel.id
		const keyvs = module.exports.keyvs;

		// reduce clashing responses
		await keyvs.currentPrompts.set(cid,null);

		// fetch game data
		let blankSet = await keyvs.blanksSets.get(cid);
		let gameData = await keyvs.gameData.get(cid);

		if (blankSet.length > 0) {

			const nextFill = blankSet.pop();
			const lexClass = gameData.parsed[nextFill].lexClass;

			// create embed
			const embed = new MessageEmbed()
				.setTitle('Mad Libs')
				.setDescription(`Give me a ${inlineCode(lexClass)}.` )
				.setFooter('(↩️ this message)');

			await keyvs.currentPrompts.set(cid, (await channel.send({embeds : [embed]} )).id);
		} else {
			// game finished state
			await channel.sendTyping()

			// parse responses
			let finalText = "";
			const response = await keyvs.responses.get(cid);
			for (var i =0; i < gameData.parsed.length; i++) {
				let token = gameData.parsed[i];
				switch (token.type) {
					case "[]":
						finalText += underscore(response[i]);
						break;
					case "[|]":
						finalText += underscore(response[i]);
						break;
					case "{}":
						finalText += underscore( response[ gameData.varSources[ token.variable ] ] );
						break;
					case "":
						finalText += token.text;
						break;
				}
			}
			
			// create embeds
			let embeds = textToEmbeds ( finalText.trim() );
			if (gameData.title) {
				embeds[0].setTitle(gameData.title);
				await channel.edit ({name:gameData.title}, "madlibs end");
			}

			//await keyvs.gameStati.set(cid, true);

			// send result in thread
			let c = "And the result is...";
			for (emb of embeds) {
				await channel.send({embeds: [emb], content: c});
				c = "";
			}

			// send result in parent channel
			try {
				const startMsg = await channel.fetchStarterMessage();
				await startMsg.send ( {content:"And the result is...", embeds:[embeds[0]]});
				for (var i=1; i < embeds.length; i++) {
					await startMsg.channel.send({embeds: [embeds[i]]});
				}
			} catch (err) {
				console.log(err);
			}


		}
	},
	
	// code for when the bot is replied to
	onreply : async (message, reference) => {
		const cid = reference.channel.id
		const keyvs = module.exports.keyvs;

		// check that response to correct prompt...
		if ((await keyvs.currentPrompts.get(cid)) == reference.id) {

			// reject multiline messages
			if (message.content.split("\n").length > 1) {
				await message.reply({content:"Single lines only!"});
				return;
			}

			// fetch game data
			let blankSet = await keyvs.blanksSets.get(cid);
			let response = await keyvs.responses.get(cid);

			const fill = blankSet.pop();
			response [fill] = message.content;

			// save game data
			await keyvs.blanksSets.set(cid, blankSet);
			await keyvs.responses.set(cid, response);

			await module.exports.prompt(reference.channel);
		}
	},

	// code for when the /madlibs command is called
	_madlibs : async (interaction) => {
		const textsPath = path.join(__dirname, '..', 'texts');
		
		switch (await interaction.options.getSubcommand(false)) {
			// command for starting a game
			case "start":
				await interaction.deferReply()
				
				let title = await interaction.options.getString('title', false);
				var file;
				if (title) {
					// sanitised path name (escape ../ to avoid revealing possible sensitive data!
					file = path.join(__dirname, '..', 'texts', title.replace("../","..\\/")+".txt");
					if (!fs.existsSync(file)) {
						await interaction.followUp({content: "No such text availabe!"});
						return;
					}
				} else {
					// randomise text option
					const textFiles= fs.readdirSync(textsPath).filter(file => file.endsWith('.txt'));
					file = textFiles[randint(0, textFiles.length)];
					title = (/[^\/]+(?=(.txt$))/.exec(file))[0];
					file = path.join(__dirname, '..', 'texts',file);
				}
				
				const rep = await interaction.followUp({content:`Starting MadLibs from ${inlineCode(title)}...`});

				// parse the file
				const parsed = parser(fs.readFileSync(file,'utf8'));
				
				/*if (parsed.title) {
					title = parsed.title;
				}*/
				
				// create madlibs thread
				const chan = await rep.startThread({
					name: title,
					reason: "mad libs",
				});

				// store data in keyvs
				const keyvs = module.exports.keyvs;
				const cid = chan.id;
				await keyvs.gameData.set (cid, parsed);
				await keyvs.blanksSets.set (cid, parsed.blanks);
				await keyvs.responses.set (cid, {});

				// begin game...
				await module.exports.prompt (chan);
				break;
				
			// command for browsing available texts
			case "list":
				
				const TITLES_PER_PAGE = 10;
				
				// fetch text files
				const textFiles= fs.readdirSync(textsPath).filter(file => file.endsWith('.txt'));
				const lastPage = Math.ceil(textFiles.length / TITLES_PER_PAGE);
				
				let page = await interaction.options.getInteger('page', false);
				if (!page || page < 1) {
					page = 1;
				}
				if (page > lastPage) {
					page = lastPage;
				}
				
				// list this page of titles
				let c = "";
				for (var i = ((page-1)*TITLES_PER_PAGE); i < ((page)*TITLES_PER_PAGE) && i < textFiles.length; i++) {
					c += `${i+1}. ${inlineCode(textFiles[i].replace(/\.txt$/,'') )}\n`;
				}
				
				// create embed
				const embed = new MessageEmbed()
					.setTitle('Available Texts for MadLibs')
					.setDescription(c)
					.setFooter(`Page ${page}/${lastPage}`);
					
				await interaction.reply({embeds: [embed], ephemeral:true});
				
		}
	}, 

};