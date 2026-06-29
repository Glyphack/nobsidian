import { App, PluginSettingTab, Setting } from 'obsidian';
import type DotsPlugin from './main';

export interface DotsSettings {
	hugoContentPath: string;
}

export const DEFAULT_SETTINGS: DotsSettings = {
	hugoContentPath: '',
};

export class DotsSettingTab extends PluginSettingTab {
	constructor(
		app: App,
		private readonly plugin: DotsPlugin,
	) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('Hugo content path')
			.setDesc(
				'Absolute path to your Hugo content directory. Notes with publish: true are exported here as leaf bundles. Desktop only.',
			)
			.addText((text) =>
				text
					.setPlaceholder('/path/to/site/content')
					.setValue(this.plugin.settings.hugoContentPath)
					.onChange(async (value) => {
						this.plugin.settings.hugoContentPath = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}
