import { oneLine } from "common-tags";
import { Collection, Message } from "discord.js";
import { Repository } from "../../classes/repository";
import { getInstancesFromFolder } from "../../functions/recursive-get-classes-dir";
import { LoggerService } from "../../utils/logger/logger-service";
import { DiscordCommand } from "../classes/discord-command";
import { IDiscordCommandData } from "../interfaces/discord-command-data-interface";

export class DiscordCommandRepository extends Repository<DiscordCommand> {
	private _isBuilt = false;

	public async build(commandsPath: string): Promise<void> {
		if (this._isBuilt) throw new Error(`A Repository can only be built once !`);
		const commandHandlers = await getInstancesFromFolder<DiscordCommand>(
			commandsPath
		);
		this._registerCommandHandlers(commandHandlers);
		this._isBuilt = true;
	}

	private _cooldowns = new Collection<string, Collection<string, number>>();

	public commandCalled(command: DiscordCommand, message: Message): void {
		if (!this._cooldowns.has(command.getName())) {
			this._cooldowns.set(command.getName(), new Collection());
		}
		const timestamps = this._cooldowns.get(command.getName());
		if (timestamps) timestamps.set(message.author.id, Date.now());
	}

	public isCommandOnCooldown(
		command: DiscordCommand,
		message: Message
	): boolean {
		const timestamps = this._cooldowns.get(command.getName());
		if (!timestamps) return false;

		const timestamp = timestamps.get(message.author.id);
		if (!timestamp) return false;

		const now = Date.now();
		const cooldownAmount = command.getData().cooldown * 1000;
		const expirationTime = timestamp + cooldownAmount;
		return now < expirationTime;
	}

	public getCommand(callname: string): DiscordCommand | undefined {
		return this.all().find(value => {
			return value.getCallnames().includes(callname);
		});
	}

	public getCommandsData(): Readonly<IDiscordCommandData[]> {
		return this.all().map(command => {
			return command.getData();
		});
	}

	private _registerCommandHandlers(commandHandlers: DiscordCommand[]) {
		commandHandlers.forEach(commandHandler => {
			this._registerCommand(commandHandler);
		});
	}

	private _registerCommand(commandHandler: DiscordCommand): void {
		const callnames = commandHandler.getCallnames();
		if (this._checkCallnamesAreAvailables(callnames)) {
			this.add(commandHandler);
			LoggerService.getInstance().info({
				context: commandHandler.constructor.name,
				message: oneLine`Registered command '${commandHandler.getName()}'
						with callnames [${callnames.join(`, `)}]`,
			});
		}
	}

	private _checkCallnamesAreAvailables(callnames: string[]): boolean {
		const assigned = this._useTakenCallname(callnames);
		if (!assigned) return true;
		const callname = assigned
			.getCallnames()
			.find(cname => callnames.includes(cname));
		throw new Error(
			oneLine`The registry already contains the command
				[${assigned.getName()}] using the same callname '${callname}'`
		);
	}

	private _useTakenCallname(callnames: string[]): DiscordCommand | undefined {
		return this.all().find(value => {
			return value
				.getCallnames()
				.some(callname => callnames.includes(callname));
		});
	}
}
