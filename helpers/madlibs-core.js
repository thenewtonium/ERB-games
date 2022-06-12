const { MessageEmbed, MessageActionRow, MessageButton, TextInputComponent, Modal } = require('discord.js');
const { inlineCode } = require('@discordjs/builders');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { parser } = require('../helpers/mml-parser.js');

// data storage
const Keyv = require('keyv');

// madlibs core functions


module.exports = {
	keyvs: {
		gameData : new Keyv(),
		gameStati : new Keyv(),
		blanksSets : new Keyv(),
		responses : new Keyv(),
		currentPrompts : new Keyv()
	},

	prompt: async (channel) => {
		const cid = channel.id
		const keyvs = module.exports.keyvs;

		// fetch game data
		let gameData = await keyvs.gameData.get(cid);
		let blankSet = await keyvs.blanksSets.get(cid);


		console.log(gameData);
		console.log(blankSet);

		const nextFill = blankSet.pop();
		const lexClass = gameData.parsed[nextFill].lexClass;

		// create embed
		const embed = new MessageEmbed()
		.setTitle('Mad Libs')
		.setDescription('Give me a word of the type ' + inlineCode(lexClass) + "." );

		// create text field
		const row = new MessageActionRow()
			.addComponents(
				new MessageButton ()
					.setCustomId("ML:"+nextFill)
					.setLabel("↩️")
					.setStyle("PRIMARY")
			);

		await channel.send({embeds : [embed], components: [row]});
	},

	clearPrompt: async (channel) => {
		let cpId = await currentPrompts.get(channel.id);
		(await channel.messages.fetch(cpId)).delete();
	},
	
	// code for when button pressed, to produce the modal.
	buttonResponse: async (nextFill, interaction) => {
		const keyvs = module.exports.keyvs;
		let gd =  await keyvs.gameData.get(interaction.channelId);
		
		// fetch the lexical class required
		const lexClass = gd.parsed[nextFill].lexClass;
		
		// create modal popup
		const modal = new Modal()
			.setCustomId("ML:"+nextFill)
			.setTitle('Mad Libs');
		const wordInput = new TextInputComponent()
			.setCustomId('word')
			.setLabel("Give me a \"" + lexClass + "\"")
			.setStyle('SHORT');
		const actionRow = new MessageActionRow().addComponents(wordInput);
		modal.addComponents(actionRow);
		await interaction.showModal(modal);
	},
	
	// code for when modal submitted, to move on...
	modalResponse: async (nextFill, interaction) => {
		const keyvs = module.exports.keyvs;
		const cid = interaction.channelId;
		let gd =  await keyvs.gameData.get(cid);
		let responses = await keyvs.responses.get(cid);
		
		if (responses.hasOwnProperty(nextFill)) {
			interaction.reply("Sorry, someone beat you to it...");
		}
		
		
	}

	_madlibs : async (interaction) => {
			const keyvs = module.exports.keyvs;
			const cid = interaction.channelId;
			console.log (keyvs.gameStati.get(cid));
			if (await keyvs.gameStati.get(cid)) {
				await interaction.reply('A game is already in progress in this channel!');
			} else {
				await interaction.reply('Starting a game of MadLibs...');
				await keyvs.gameStati.set(cid, true);

				// TO-DO: get text data
				// for now just hard code something...
				source = "It's called a [ proper noun | college name ] [ noun | channel ] for a reason. We all [ verb ] each other really well on the { channel }, and we use it on the trust and assumption that the [ plural noun ] we're talking to will be the same as those we'll be [ verb ending in -ing ] with, making friends with and [ transitive verb ending -ing ] at [ place ]. Entering the { channel } as a college member other than { college name } breaks the [noun] and makes it [adjective] and [adjective] to understand what's going on.\
	If you'd like to [ transitive verb ] someone from { college name }, I'm sure sending them a [ singular noun ] wouldn't hurt. Some people are open to [verb ending in -ing] (those people were [state of being] yesterday).";

				// parse the source, then store the components in keyvs
				parsed = parser(source);
				await keyvs.gameData.set (cid, parsed);
				await keyvs.blanksSets.set (cid, parsed.blanks);
				await keyvs.responses.set (cid, {});

				// begin game...
				await module.exports.prompt (interaction.channel);

			}
		},

};