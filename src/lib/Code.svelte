<script lang="ts">
	import Core from './core';
	import { createEventDispatcher } from 'svelte';
	import nProgress from 'nprogress';

	const dispatch = createEventDispatcher();
	let fileElement: HTMLInputElement;
	let backupCode: string;
	let error: string;

	async function confirmCode() {
		nProgress.start();

		try {
			const result = await Core.instance.setBackupCode(backupCode);
			if (result) {
				dispatch('backup-set');
			} else {
				error = 'Failed to get backup from code.';
			}
		} catch (err) {
			console.log(err);
			error = 'Failed to get backup from code.';
		} finally {
			nProgress.done();
		}
	}

	async function uploadFile(_event: Event) {
		const file = fileElement.files![0];
		const reader = new FileReader();
		reader.onload = () => {
			try {
				const content = reader.result as string;
				const result = Core.instance.setBackup(content);
				if (result) {
					dispatch('backup-set');
					return;
				}

				error = 'Invalid backup archive.';
			} catch {
				error = 'Invalid backup archive.';
			}
		};

		reader.readAsText(file);
	}
</script>

<main class="max-w-screen-lg mx-auto p-4 h-[80vh] mt-[40px] mb-[80px]">
	<h1 class="text-3xl font-bold">
		Musi Archiver <span class="text-gray-400 font-semibold text-lg">v1.0</span>
	</h1>
	<h2 class="text-gray-400 font-semibold text-lg">
		Developed by <a
			class="text-blue-400 hover:text-blue-500"
			target="_blank"
			href="https://github.com/SaturnKai/MusiArchiver">SaturnKai</a
		>
	</h2>

	<p class="mt-8">
		This extension allows you to import your Musi playlists into YouTube music
		or download them as an archive. To get started, enter your Musi backup code
		found in the app's settings, and enter it below.
	</p>

	<div class="group mt-8">
		<label class="font-medium" for="backup-code">Backup code</label>
		<input
			class="block border border-gray-400 bg-none rounded px-2 py-1 mt-2 focus:outline-cyan-300 font-mono"
			id="backup-code"
			type="text"
			bind:value={backupCode}
		/>
	</div>

	<div class="">
		<button
			class="bg-orange-500 hover:bg-orange-600 px-8 py-2 rounded font-medium mt-5 mr-5"
			on:click={confirmCode}>Confirm</button
		>
		<button
			class="bg-none border-2 border-orange-500 hover:border-orange-600 px-8 py-2 rounded font-medium mt-5"
			on:click={() => fileElement.click()}
			>Upload Archive <span class="font-mono">(_archive.json)</span></button
		>
		<input
			bind:this={fileElement}
			on:change={uploadFile}
			class="hidden"
			type="file"
		/>
	</div>

	{#if error != undefined}
		<p class="text-red-400 font-semibold mt-3">{error}</p>
	{/if}
</main>
