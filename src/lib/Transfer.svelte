<script lang="ts">
	import Playlist from './Playlist.svelte';
	import nProgress from 'nprogress';
	import Core from './core';
	import { onMount } from 'svelte';

	let selectedPlaylists: string[] = [];
	let selectedPlaylistCount = 0;
	let importSuccess: boolean | undefined = undefined;
	let backupData = Core.instance.backup!.data;
	let loggedIn: boolean | undefined;

	function addSelectedPlaylist({ detail }: CustomEvent) {
		const { selected, id } = detail;

		if (!selected) {
			if (selectedPlaylists.includes(id)) {
				selectedPlaylists.splice(selectedPlaylists.indexOf(id), 1);
			}
		} else {
			selectedPlaylists.push(id);
		}
		selectedPlaylistCount = selectedPlaylists.length;
	}

	async function importPlaylists() {
		nProgress.start();
		importSuccess = await Core.instance.importPlaylists(selectedPlaylists);
		nProgress.done();
	}

	async function downloadArchive() {
		nProgress.start();
		await Core.instance.downloadArchive();
		nProgress.done();
	}

	onMount(async () => {
		loggedIn = await Core.injectYTAPI();
	});
</script>

<main class="max-w-screen-lg mx-auto p-4 h-[80vh] mt-[40px]">
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

	<h3 class="text-xl font-medium mt-10">Select playlists to import</h3>
	<div class="flex flex-wrap gap-5 mt-10">
		<Playlist
			on:selected={addSelectedPlaylist}
			id={'library_tracks'}
			musiPlaylist={true}
		/>
		{#each backupData.playlists as playlist}
			<Playlist on:selected={addSelectedPlaylist} id={playlist.id} />
		{/each}
	</div>

	<div class="mt-10">
		{#if loggedIn === true}
			{#if selectedPlaylistCount > 0}
				<button
					class="bg-orange-500 hover:bg-orange-600 px-8 py-2 rounded font-medium mr-5"
					on:click={importPlaylists}
					>Import Selected <span class="font-mono"
						>({selectedPlaylistCount})</span
					></button
				>
			{/if}
		{:else if loggedIn === false}
			<p class="text-red-400 font-semibold">
				Please login to YouTube music to import.
			</p>
		{/if}

		<button
			class="bg-none border-2 border-orange-500 hover:border-orange-600 px-8 py-2 rounded font-medium mt-5"
			on:click={downloadArchive}>Download Archive</button
		>
	</div>

	{#if importSuccess === true}
		<p class="text-green-400 font-semibold mt-3">
			Successfully imported selected playlists. <a
				class="text-blue-400 hover:text-blue-500"
				href="https://music.youtube.com/library/playlists"
				target="_blank">View</a
			>
		</p>
	{:else if importSuccess === false}
		<p class="text-red-400 font-semibold mt-3">
			Failed to import selected playlists.
		</p>
	{/if}

	<div class="pb-[80px]"></div>
</main>
