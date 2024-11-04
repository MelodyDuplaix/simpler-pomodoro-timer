<script lang="ts">
    import { settings } from 'stores';
    import { setTooltip, Menu } from 'obsidian';
    import Timer, { type Mode } from 'Timer';
    import { TimerSettingsModal } from 'TimerSettingsModal';
    
    export let store: Timer;
    let statusbar: HTMLElement;
    let mode: Mode | undefined;

    // Fonction pour basculer le timer
    const toggleTimer = () => {
        store.toggleTimer();
    };
    
    // Bloc réactif pour mettre à jour l'info-bulle
    $: {
        if (statusbar && mode !== $store.mode) {
            mode = $store.mode;
            const tooltip = mode === 'WORK' ? 'Work' : 'Break';
            setTooltip(statusbar, tooltip, { delay: 300, placement: 'top' });
        }
    };
    
    // Fonction pour le menu contextuel
    const ctxMenu = (e: MouseEvent) => {
        const menu = new Menu();

        // Options de démarrage, pause et reprise
        menu.addItem((item) => {
            const p = $store.running ? 'Pause' : $store.inSession ? 'Resume' : 'Start';
            item.setTitle(p).onClick(() => {
                store.toggleTimer();
            });
        });


        // Option pour réinitialiser le timer
        menu.addItem((item) => {
            item.setTitle('Reset').onClick(() => {
                store.reset();
            });
        });

        // Option pour changer de mode
        menu.addItem((item) => {
            const mode = $store.mode === 'WORK' ? 'Switch Break' : 'Switch Work'; // Correction ici
            item.setTitle(mode).onClick(() => {
                store.toggleMode();
            });
        });

        
        menu.addSeparator();

        // Couples prédéfinis de durées de travail/pause
        $settings.presetDurations.forEach(({ work, break: breakTime }) => {
            menu.addItem((item) => {
                item
                    .setTitle(`${work} / ${breakTime} min.`)
                    .onClick(() => {
                        settings.update((s) => {
                            s.workLen = work;
                            s.breakLen = breakTime;
                            return s;
                        });
                    });
            });
        });

        menu.addSeparator();

        // Option pour ouvrir le modal de personnalisation des durées
        menu.addItem((item) => {
            item.setTitle(`Duration (${$settings.workLen} / ${$settings.breakLen})`).onClick(() => {
                const modal = new TimerSettingsModal(app, (workLen, breakLen) => {
                    settings.update((s) => {
                        s.workLen = workLen;
                        s.breakLen = breakLen;
                        return s;
                    });
                });
                modal.open();
            });
        });

        // Autres options comme auto-start et notifications...
        menu.addItem((item) => {
            item.setTitle('Auto-start')
                .setChecked($settings.autostart)
                .onClick(() => {
                    settings.update((s) => {
                        s.autostart = !s.autostart;
                        return s;
                    });
                });
        });

        menu.addItem((item) => {
            item.setTitle('Sound')
                .setChecked($settings.notificationSound)
                .onClick(() => {
                    settings.update((s) => {
                        s.notificationSound = !s.notificationSound;
                        return s;
                    });
                });
        });

        menu.showAtMouseEvent(e); // Assurez-vous que l'événement est passé correctement
    };
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
{#if $settings.useStatusBarTimer}
    <span
        on:click={toggleTimer}
        class="st-timer"
        bind:this={statusbar}
        on:contextmenu={ctxMenu}
    >
        <span style="margin-right:3px" class="item-icon">
            {#if $store.running}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-timer">
                    <line x1="10" x2="14" y1="2" y2="2" /><line x1="12" x2="15" y1="14" y2="11" /><circle cx="12" cy="14" r="8" />
                </svg>
            {:else}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-timer-off">
                    <path d="M10 2h4" /><path d="M4.6 11a8 8 0 0 0 1.7 8.7 8 8 0 0 0 8.7 1.7" /><path d="M7.4 7.4a8 8 0 0 1 10.3 1 8 8 0 0 1 .9 10.2" /><path d="m2 2 20 20" /><path d="M12 12v-2" />
                </svg>
            {/if}
        </span>
        {$store.remained.human}
    </span>
{/if}

<style>
.item-icon {
    padding-top: 0;
}
.st-timer {
    display: inline-flex;
    align-items: center;
}
</style>
