import { Notice, Plugin, TFile, TFolder, normalizePath } from 'obsidian';
import { LogEntry, LogInput, WeeklyLog } from './log';
import { LogModal } from './log-modal';

// For using the internal templater plugin by obsidian
declare module 'obsidian' {
	interface TemplatesPluginInstance {
		insertTemplate(file: TFile): Promise<void>;
	}

	interface InternalPlugin {
		enabled: boolean;
		instance?: TemplatesPluginInstance;
	}

	interface App {
		internalPlugins: {
			getPluginById(id: string): InternalPlugin | null;
		};
	}
}

const DAILY_FOLDER = 'Daily';
const WEEKLY_FOLDER = 'Weekly';
const WEEKLY_TEMPLATE = 'Templates/Weekly Note Template.md';

export default class DotsPlugin extends Plugin {
	async onload() {
		this.addCommand({
			id: 'open-weekly-note',
			name: 'Open weekly note',
			callback: () => this.openWeeklyNote(),
		});
		this.addCommand({
			id: 'log',
			name: 'Log',
			callback: () => {
				new LogModal(this.app, (input) => {
					this.log(input).catch((error) => {
						new Notice(
							`Failed to log: ${error instanceof Error ? error.message : String(error)}`,
						);
					});
				}).open();
			},
		});
		this.app.workspace.onLayoutReady(async () => {
			try {
				await this.createTodayNote();
			} catch (error) {
				new Notice(
					`Failed to create today's note: ${error instanceof Error ? error.message : String(error)}`,
				);
			}
		});
	}

	onunload() {}

	async openWeeklyNote() {
		await this.ensureWeeklyNote();
	}

	async log(input: LogInput) {
		const entry = LogEntry.fromInput(input, new Date());
		const file = await this.ensureWeeklyNote();
		const dateHeader = `# ${todayStamp()}`;
		await this.app.vault.process(file, (data) => {
			const note = new WeeklyLog(data);
			note.insert(dateHeader, entry);
			return note.toString();
		});
		new Notice('Logged to weekly note.');
	}

	async ensureWeeklyNote(): Promise<TFile> {
		await this.ensureFolder(WEEKLY_FOLDER);
		const path = normalizePath(`${WEEKLY_FOLDER}/${weeklyStamp()}.md`);
		const existing = this.app.vault.getAbstractFileByPath(path);
		if (existing instanceof TFile) {
			await this.app.workspace.getLeaf().openFile(existing);
			return existing;
		}

		const note = await this.app.vault.create(path, '');
		await this.app.workspace.getLeaf().openFile(note);
		await this.insertTemplate(WEEKLY_TEMPLATE);
		return note;
	}

	async insertTemplate(templatePath: string) {
		const template = this.app.vault.getAbstractFileByPath(
			normalizePath(templatePath),
		);
		if (!(template instanceof TFile)) {
			new Notice(`Template not found: ${templatePath}`);
			return;
		}

		const templates = this.app.internalPlugins.getPluginById('templates');
		if (!templates?.enabled || !templates.instance) {
			new Notice('Core templates plugin is not enabled.');
			return;
		}

		await templates.instance.insertTemplate(template);
	}

	async createTodayNote() {
		await this.ensureFolder(DAILY_FOLDER);
		await this.ensureNote(`${DAILY_FOLDER}/${todayStamp()}.md`);
	}

	async ensureNote(notePath: string): Promise<TFile> {
		const path = normalizePath(notePath);
		const existing = this.app.vault.getAbstractFileByPath(path);
		if (existing instanceof TFile) {
			return existing;
		}

		return await this.app.vault.create(path, '');
	}

	async ensureFolder(folder: string) {
		const path = normalizePath(folder);
		const existing = this.app.vault.getAbstractFileByPath(path);
		if (existing instanceof TFolder) {
			return;
		}

		await this.app.vault.createFolder(path);
	}
}

function todayStamp(): string {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const day = String(now.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

function weeklyStamp(): string {
	const { year, week } = isoYearWeek(new Date());
	return `${year}-W${String(week).padStart(2, '0')}`;
}

function isoYearWeek(date: Date): { year: number; week: number } {
	const thursday = new Date(
		date.getFullYear(),
		date.getMonth(),
		date.getDate(),
	);
	const mondayOffset = (thursday.getDay() + 6) % 7;
	thursday.setDate(thursday.getDate() - mondayOffset + 3);

	const year = thursday.getFullYear();
	const firstThursday = new Date(year, 0, 4);
	firstThursday.setDate(
		firstThursday.getDate() - ((firstThursday.getDay() + 6) % 7) + 3,
	);

	const week =
		1 +
		Math.round(
			(thursday.getTime() - firstThursday.getTime()) /
				(7 * 24 * 60 * 60 * 1000),
		);
	return { year, week };
}
