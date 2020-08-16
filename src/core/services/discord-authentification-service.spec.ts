import { Client } from "discord.js";
import { createMock } from "ts-auto-mock";
import logger from "../utils/logger";
import DiscordAuthenticationService from "./discord-authentification-service";
import DiscordClientService from "./discord-client-service";
import DiscordConfigService from "./discord-config-service";

describe(`Discord Authentification Service`, (): void => {
	let service: DiscordAuthenticationService;
	let discordClientService: DiscordClientService;
	let discordConfigService: DiscordConfigService;

	beforeEach((): void => {
		discordClientService = DiscordClientService.getInstance();
		discordConfigService = DiscordConfigService.getInstance();
	});

	describe(`::getInstance()`, () => {
		it(`should create a DiscordAuthentication service`, (): void => {
			expect.assertions(1);

			service = DiscordAuthenticationService.getInstance();

			expect(service).toStrictEqual(expect.any(DiscordAuthenticationService));
		});

		it(`should return the created DiscordAuthentication service`, (): void => {
			expect.assertions(1);

			const result = DiscordAuthenticationService.getInstance();

			expect(result).toStrictEqual(service);
		});
	});

	describe(`:login()`, () => {
		let client: Client;

		let discordClientServiceGetClientSpy: jest.SpyInstance;
		let discordConfigServiceGetDiscordTokenSpy: jest.SpyInstance;
		let loggerLogSpy: jest.SpyInstance;
		let loggerErrorSpy: jest.SpyInstance;
		let loginMock: jest.Mock;

		beforeEach((): void => {
			service = new DiscordAuthenticationService();
			loginMock = jest.fn().mockResolvedValue(`login`);
			client = createMock<Client>({
				login: loginMock,
			});

			loggerLogSpy = jest.spyOn(logger, `log`).mockImplementation();
			loggerErrorSpy = jest.spyOn(logger, `error`).mockImplementation();
			discordClientServiceGetClientSpy = jest
				.spyOn(discordClientService, `getClient`)
				.mockReturnValue(client);
			discordConfigServiceGetDiscordTokenSpy = jest
				.spyOn(discordConfigService, `getDiscordToken`)
				.mockImplementation();
		});

		it(`should NOT be authenticated without login in`, async (): Promise<
			void
		> => {
			expect.assertions(1);

			expect(service.isAuthenticated()).toBeFalsy();
		});

		it(`should get the Discord client`, async (): Promise<void> => {
			expect.assertions(2);

			await service.login();

			expect(discordClientServiceGetClientSpy).toHaveBeenCalledTimes(1);
			expect(discordClientServiceGetClientSpy).toHaveBeenCalledWith();
		});

		it(`should get the Discord config`, async (): Promise<void> => {
			expect.assertions(2);

			await service.login();

			expect(discordConfigServiceGetDiscordTokenSpy).toHaveBeenCalledTimes(1);
			expect(discordConfigServiceGetDiscordTokenSpy).toHaveBeenCalledWith();
		});

		it(`should login`, async (): Promise<void> => {
			expect.assertions(1);

			await service.login();

			expect(loginMock).toHaveBeenCalledTimes(1);
		});

		describe(`- login was successful`, () => {
			beforeEach(() => {
				loginMock = jest.fn().mockResolvedValue(`success`);
				client = createMock<Client>({
					login: loginMock,
				});
				discordClientServiceGetClientSpy.mockReturnValue(client);
			});

			it(`should be authenticated`, async (): Promise<void> => {
				expect.assertions(1);

				await service.login();

				expect(service.isAuthenticated()).toBeTruthy();
			});

			it(`should call a success log`, async (): Promise<void> => {
				expect.assertions(1);

				await service.login();

				expect(loggerLogSpy).toHaveBeenCalledTimes(1);
			});
		});

		describe(`- login was a failure`, () => {
			beforeEach(() => {
				loginMock = jest.fn().mockRejectedValue(`error`);
				client = createMock<Client>({
					login: loginMock,
				});
				discordClientServiceGetClientSpy.mockReturnValue(client);
			});

			it(`should NOT be authenticated`, async (): Promise<void> => {
				expect.assertions(2);

				expect(service.isAuthenticated()).toBeFalsy();
				await service.login();
				expect(service.isAuthenticated()).toBeFalsy();
			});

			it(`should call an error log`, async (): Promise<void> => {
				expect.assertions(1);

				await service.login();

				expect(loggerErrorSpy).toHaveBeenCalledTimes(1);
			});
		});
	});
});