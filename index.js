/* this is mostly just boilerplate code from discordjs.guide for setting up the modular structure of the bot */


const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Intents } = require('discord.js');
const { token } = require('./config.json');

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// Set a new item in the Collection
	// With the key as the command name and the value as the exported module
	client.commands.set(command.data.name, command);
}
const ml = require("./helpers/madlibs-core.js");
client.commands.set("madlibs", {execute: ml._madlibs});

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}


client.on("interactionCreate", async (interaction) => {
		if (interaction.isCommand()) {
			const command = interaction.client.commands.get(interaction.commandName);

			if (!command) { return }

			try {
				await command.execute(interaction);
			} catch (error) {
				console.error(error);
				await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
			}

		}	

		if (interaction.isButton()) {
			const id = interaction.component.customId;
			// when button is a madlibs response button
			if ( id.substr(0,3) == "ML:") {
				await ml.buttonResponse(new Number(id.substr(3)), interaction);
			}
		}
		
		if (interaction.isModal()) {
			const id = interaction.component.customId;
			// when button is a madlibs response button
			if ( id.substr(0,3) == "ML:") {
				await ml.modalResponse(new Number(id.substr(3)), interaction);
			}
		}
});

client.login(token);
