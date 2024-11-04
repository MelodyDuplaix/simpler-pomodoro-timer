import type PomodoroTimerPlugin from 'main';
import { PluginSettingTab, Setting } from 'obsidian';
import type { Unsubscriber } from 'svelte/motion';
import { writable, type Writable } from 'svelte/store';

export interface Settings {
    workLen: number;
    breakLen: number;
    autostart: boolean;
    useStatusBarTimer: boolean;
    notificationSound: boolean;
    customSound: string;
    useSystemNotification: boolean;
    lowFps: boolean;
    presetDurations: { work: number; break: number }[];
}

export default class PomodoroSettings extends PluginSettingTab {
    static readonly DEFAULT_SETTINGS: Settings = {
        workLen: 25,
        breakLen: 5,
        autostart: false,
        useStatusBarTimer: true,
        notificationSound: true,
        customSound: '',
        useSystemNotification: false,
        lowFps: false,
        presetDurations: [
            { work: 60, break: 10 },
            { work: 45, break: 5 },
            { work: 25, break: 5 },
            { work: 15, break: 3 },
            { work: 10, break: 2 },
        ],
    };

    static settings: Writable<Settings> = writable(
        PomodoroSettings.DEFAULT_SETTINGS,
    );

    private _settings: Settings;
    private plugin: PomodoroTimerPlugin;
    private unsubscribe: Unsubscriber;

    constructor(plugin: PomodoroTimerPlugin, settings: Settings) {
        super(plugin.app, plugin);
        this.plugin = plugin;
        this._settings = { ...PomodoroSettings.DEFAULT_SETTINGS, ...settings };
        PomodoroSettings.settings.set(this._settings);
        this.unsubscribe = PomodoroSettings.settings.subscribe((settings) => {
            this.plugin.saveData(settings);
            this._settings = settings;
            this.plugin.timer?.setupTimer();
        });
    }

    public getSettings(): Settings {
        return this._settings;
    }

    public updateSettings = (
        newSettings: Partial<Settings>,
        refreshUI: boolean = false,
    ) => {
        PomodoroSettings.settings.update((settings) => {
            this._settings = { ...settings, ...newSettings };
            if (refreshUI) {
                this.display();
            }
            return this._settings;
        });
    };

    public unload() {
        this.unsubscribe();
    }

    public display() {
        const { containerEl } = this;
        containerEl.empty();

        new Setting(containerEl)
            .setName('Low Animation FPS')
            .setDesc(
                "If you encounter high CPU usage, you can enable this option to lower the animation FPS to save CPU resources"
            )
            .addToggle((toggle) => {
                toggle.setValue(this._settings.lowFps);
                toggle.onChange((value: boolean) => {
                    this.updateSettings({ lowFps: value });
                });
            });

        new Setting(containerEl).setHeading().setName('Notification');

        new Setting(containerEl)
            .setName('Use System Notification')
            .addToggle((toggle) => {
                toggle.setValue(this._settings.useSystemNotification);
                toggle.onChange((value) => {
                    this.updateSettings({ useSystemNotification: value });
                });
            });
        new Setting(containerEl)
            .setName('Sound Notification')
            .addToggle((toggle) => {
                toggle.setValue(this._settings.notificationSound);
                toggle.onChange((value) => {
                    this.updateSettings({ notificationSound: value }, true);
                });
            });

        if (this._settings.notificationSound) {
            new Setting(containerEl)
                .setName('Custom Notification Audio')
                .addText((text) => {
                    text.inputEl.style.width = '100%';
                    text.setPlaceholder('path/to/sound.mp3');
                    text.setValue(this._settings.customSound);
                    text.onChange((value) => {
                        this.updateSettings({ customSound: value });
                    });
                })
                .addExtraButton((button) => {
                    button.setIcon('play');
                    button.setTooltip('Play');
                    button.onClick(() => {
                        this.plugin.timer?.playAudio();
                    });
                });
        }

        // Section for defining the preset pairs of work/break durations to display in the status bar
        new Setting(containerEl)
            .setName('Preset Work/Break Durations')
            .setDesc('Define the preset pairs of work/break durations to display in the status bar.')
            .addButton((button) => {
                button.setButtonText('Add Preset').onClick(() => {
                    const newWorkLen = 0; // Default value or retrieve from inputs
                    const newBreakLen = 0;  // Default value or retrieve from inputs
                    this._settings.presetDurations.push({ work: newWorkLen, break: newBreakLen });
                    this.updateSettings({ presetDurations: this._settings.presetDurations }, true);
                });
            });

        // Display existing preset durations with inputs to modify them
        this._settings.presetDurations.forEach(({ work, break: breakTime }, index) => {
            new Setting(containerEl)
                .addText((text) => {
                    text.setValue(work.toString());
                    text.setPlaceholder('Work Duration (min)');
                    text.onChange((value) => {
                        const workDuration = parseInt(value);
                        if (!isNaN(workDuration)) {
                            text.setValue(workDuration.toString());
                            this._settings.presetDurations[index].work = workDuration;
                            this.updateSettings({ presetDurations: this._settings.presetDurations }, true);
                        }
                    });
                })
                .addText((text) => {
                    text.setValue(breakTime.toString());
                    text.setPlaceholder('Break Duration (min)');
                    text.onChange(async (value) => {
                        const breakDuration = parseInt(value);
                        if (!isNaN(breakDuration)) {
                            this._settings.presetDurations[index].break = breakDuration;
                            this.updateSettings({ presetDurations: this._settings.presetDurations }, true);
                        }
                    });
                })
                .addButton((button) => {
                    button.setButtonText('Remove').onClick(() => {
                        this._settings.presetDurations = this._settings.presetDurations.filter(
                            (_, i) => i !== index
                        );
                        this.updateSettings({ presetDurations: this._settings.presetDurations }, true);
                    });
                });
        });
    }
}

