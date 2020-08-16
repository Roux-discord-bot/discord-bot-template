import _ from "lodash";
import { Client } from "discord.js";
import logger from "../utils/logger";

export default class DiscordClientService {
	private static _instance: DiscordClientService;

	private _client: Client | undefined = undefined;

	public static getInstance(): DiscordClientService {
		if (_.isNil(DiscordClientService._instance))
			DiscordClientService._instance = new DiscordClientService();

		return DiscordClientService._instance;
	}

	public createClient(): Client {
		this._client = new Client().on(`ready`, () => {
			logger.logEvent(`Ready`, `Client is logged in and ready!`);
		});

		return this._client;
	}

	public getClient(): Client {
		if (_.isNil(this._client)) return this.createClient();
		return this._client;
	}
}