<script lang="ts">
	import Core from './core';
	import { createEventDispatcher } from 'svelte';

	// playlist id
	export let id: string;
	export let musiPlaylist: boolean = false;

	// globals
	const dispatch = createEventDispatcher();
	const backupData = Core.instance.backup!.data;
	const playlist = musiPlaylist
		? {
				name: 'Library',
			}
		: backupData.playlists.find((p) => p.id === id)!;
	const playlistTracks = backupData.playlist_tracks.filter((t) =>
		musiPlaylist ? t.musi_playlist_name === id : t.playlist_id === id,
	);

	let selected = false;

	// playlist thumbnail
	const svgPlaceholder = `
        <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" fill="#222">
        <rect width="200" height="200"/>
        </svg>
        `;
	const getThumbnail = (index: number): string => {
		const track = playlistTracks[index];
		if (track !== undefined)
			return `https://i.ytimg.com/vi/${track.track_id}/hqdefault.jpg`;
		else
			return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgPlaceholder)}`;
	};

	const onSelected = () => {
		selected = !selected;
		dispatch('selected', { id, selected });
	};
</script>

<div class:selected>
	<div class="w-[200px]">
		<div class="relative pb-[100%] rounded-lg overflow-hidden">
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<!-- svelte-ignore a11y-no-static-element-interactions -->
			<div
				class="cover absolute inset-0 grid grid-cols-2 cursor-pointer"
				on:click={onSelected}
			>
				<img
					class="w-full h-full object-cover"
					src={getThumbnail(0)}
					alt="thumbnail 1"
				/>
				<img
					class="w-full h-full object-cover"
					src={getThumbnail(1)}
					alt="thumbnail 2"
				/>
				<img
					class="w-full h-full object-cover"
					src={getThumbnail(2)}
					alt="thumbnail 3"
				/>
				<img
					class="w-full h-full object-cover"
					src={getThumbnail(3)}
					alt="thumbnail 4"
				/>
			</div>
		</div>
	</div>
	<p class="playlist-name text-base font-semibold mt-4">{playlist.name}</p>
	<p class="text-sm text-gray-500 font-medium">
		{playlistTracks.length} tracks
	</p>
</div>

<style>
	.selected .cover {
		filter: brightness(80%);
	}

	img {
		-webkit-user-drag: none;
		-khtml-user-drag: none;
		-moz-user-drag: none;
		-o-user-drag: none;
		user-drag: none;
	}

	.selected .playlist-name {
		@apply text-orange-300;
	}

	.cover:hover:not(.selected) {
		filter: brightness(85%);
	}
</style>
