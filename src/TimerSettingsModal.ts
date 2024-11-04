import { App, Modal, Setting } from 'obsidian';
import { get } from 'svelte/store';
import PomodoroSettings from "Settings"; // Assurez-vous de bien importer vos paramètres ici

export class TimerSettingsModal extends Modal {
    private workLength: number;
    private breakLength: number;

    constructor(
        app: App,
        onSubmit: (workLen: number, breakLen: number) => void
    ) {
        super(app);

        // Récupération des durées actuelles depuis les paramètres
        const currentSettings = get(PomodoroSettings.settings);
        this.workLength = currentSettings.workLen;
        this.breakLength = currentSettings.breakLen;

        // Configuration du champ de durée de travail
        new Setting(this.contentEl)
            .setName("Durée de Travail (minutes)")
            .addText((text) =>
                text
                    .setValue(String(this.workLength))
                    .onChange((value) => {
                        this.workLength = parseInt(value) || 0;
                    })
            );

        // Configuration du champ de durée de pause
        new Setting(this.contentEl)
            .setName("Durée de Pause (minutes)")
            .addText((text) =>
                text
                    .setValue(String(this.breakLength))
                    .onChange((value) => {
                        this.breakLength = parseInt(value) || 0;
                    })
            );

        // Bouton de soumission
        new Setting(this.contentEl)
            .addButton((btn) =>
                btn
                    .setButtonText("Soumettre")
                    .setCta()
                    .onClick(() => {
                        onSubmit(this.workLength, this.breakLength);
                        this.close();
                    })
            );
    }
}
