import type { BackupData, Playlist } from './musi';
import JSZip from 'jszip';

function generateCSV(data: BackupData, playlist: Playlist): string {
	// set header
	let content = `video_id,video_name,video_creator,date_added,position\n`;

	// filter playlist tracks
	const playlistTracks = data.playlist_tracks.filter(
		(t) => t.playlist_id === playlist.id,
	);

	// add tracks
	for (const t of playlistTracks) {
		const track = data.tracks.find((tr) => tr.video_id === t.track_id);
		content += `${t.track_id},"${track?.video_name}","${track?.video_creator}",${t.created_date},${t.position}\n`;
	}

	return content;
}

export async function downloadBackup(data: BackupData, playlistIDs: string[]) {
	const zip = new JSZip();

	for (const playlist of data.playlists) {
		if (playlistIDs.includes(playlist.id)) {
			const filename = `${playlist.name}.csv`;
			const content = generateCSV(data, playlist);
			zip.file(filename, content);
		}
	}

	zip.generateAsync({ type: 'blob' }).then((content) => {
		const url = URL.createObjectURL(content);
		chrome.runtime.sendMessage({ action: 'downloadArchive', url });
	});
}
