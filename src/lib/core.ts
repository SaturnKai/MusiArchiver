import { convertBackup, type BackupData, type Playlist } from './musi';
import YouTubeAPI from './youtube';
import JSZip from 'jszip';

type Backup = {
	code: string;
	data: BackupData;
	raw: string;
};

class Core {
	readonly UPLOAD_SIZE = 50;
	static #instance: Core;
	static #YTAPI: YouTubeAPI;
	backup: Backup | undefined;

	private constructor() {}

	public static get instance(): Core {
		if (!Core.#instance) {
			Core.#instance = new Core();
			this.#YTAPI = new YouTubeAPI();
		}

		return Core.#instance;
	}

	public static async injectYTAPI(): Promise<boolean> {
		const loggedIn = await Core.#YTAPI.inject();
		return loggedIn;
	}

	public setBackupCode(backupCode: string): Promise<boolean> {
		return new Promise((res, rej) => {
			chrome.runtime.sendMessage(
				{ action: 'getBackup', code: backupCode },
				(response) => {
					if (response.success) {
						this.backup = {
							code: backupCode,
							data: response.backupResult.data,
							raw: response.backupResult.raw,
						};
						res(true);
					}

					rej(new Error('100'));
				},
			);
		});
	}

	public setBackup(raw: string): boolean {
		// parse backup data
		let backupData: any;
		try {
			backupData = JSON.parse(raw);
		} catch {
			return false;
		}

		if (backupData.version === 2) {
			this.backup = {
				code: '',
				data: backupData as BackupData,
				raw,
			};
		} else if (backupData.library) {
			const conversion = convertBackup(backupData);
			this.backup = {
				code: '',
				data: conversion,
				raw,
			};
		} else {
			return false; // invalid
		}

		return true;
	}

	private generateCSV(
		playlistId: string,
		musiPlaylist: boolean = false,
	): string {
		const escapeCSV = (str: string): string => {
			if (typeof str !== 'string') return str;
			return '"' + str.replace(/"/g, '""') + '"';
		};

		// set header
		let content = `video_id,video_name,video_creator,duration,date_added,position\n`;

		// filter playlist tracks
		const playlistTracks = this.backup!.data.playlist_tracks.filter(
			(t) =>
				(!musiPlaylist ? t.playlist_id : t.musi_playlist_name) === playlistId,
		);

		// add tracks
		for (const t of playlistTracks) {
			const track = this.backup!.data.tracks.find(
				(tr) => tr.video_id === t.track_id,
			);
			content += `${t.track_id},${escapeCSV(track!.video_name)},${escapeCSV(track!.video_creator)},${track!.video_duration},${t.created_date},${t.position ?? ''}\n`;
		}

		return content;
	}

	public async downloadArchive(): Promise<boolean> {
		if (this.backup === undefined) {
			return false;
		}

		const zip = new JSZip();
		zip.file('_archive.json', this.backup.raw);

		let playlistCSV = 'id,name,date,lp_date,share_token,share_identifier\n';
		for (const playlist of this.backup.data.playlists) {
			playlistCSV += `${playlist.id},${playlist.name},${playlist.date},${playlist.lp_date ?? ''},${playlist.share_token ?? ''},${playlist.share_identifier ?? ''}\n`;

			const filename = `${playlist.name}.csv`;
			const content = this.generateCSV(playlist.id);
			zip.file(filename, content);
		}

		zip.file('_playlists.csv', playlistCSV);
		zip.file('_library.csv', this.generateCSV('library_tracks', true));

		const content = await zip.generateAsync({ type: 'blob' });
		const url = URL.createObjectURL(content);
		chrome.runtime.sendMessage({ action: 'downloadArchive', url });
		return true;
	}

	private async importTracks(playlistId: string, videoIds: string[]) {
		const filter = async () => {
			console.warn('warning: filtering deleted tracks.');
			for (let i = videoIds.length - 1; i >= 0; i--) {
				const id = videoIds[i];
				if (!(await YouTubeAPI.videoExists(id))) {
					videoIds.splice(i, 1);
					console.warn('warning: removed deleted track: ' + id);
				}
			}

			await Core.#YTAPI.addTracksToPlaylist(playlistId, videoIds);
		};

		try {
			const result = await Core.#YTAPI.addTracksToPlaylist(
				playlistId,
				videoIds,
			);
			if (!result) {
				await filter();
			}
		} catch {
			await filter();
		}
	}

	private getPlaylistDate(date: number): string {
		if (date === 0) {
			return 'Unknown';
		}
		return new Date(date * 1000).toLocaleString();
	}

	public async importPlaylists(playlistIds: string[]): Promise<boolean> {
		if (this.backup === undefined) {
			return false;
		}

		for (const id of playlistIds) {
			// check musi playlist
			let musiPlaylist = id === 'library_tracks' ? true : false;

			// get playlist name
			let playlistName = 'Main Library';
			let playlistDC = 0;
			if (!musiPlaylist) {
				const playlist = this.backup.data.playlists.find((p) => p.id === id)!;
				playlistName = playlist.name;
				playlistDC = playlist.date;
			}

			// create playlist
			const playlistDescriptionDate =
				playlistDC === 0
					? ''
					: ` | Original Date Created: ${this.getPlaylistDate(playlistDC)}`;
			const playlistId = await Core.#YTAPI.createPlaylist(
				playlistName,
				`Auto-generated by Musi Archiver${playlistDescriptionDate}`,
			);
			if (playlistId === null) {
				continue;
			}

			// add each track
			const playlistTracks = this.backup.data.playlist_tracks.filter((t) =>
				!musiPlaylist ? t.playlist_id === id : t.musi_playlist_name === id,
			);

			for (let i = 0; i < playlistTracks.length; i += this.UPLOAD_SIZE) {
				// get video ids
				const videoIds = playlistTracks
					.slice(i, i + this.UPLOAD_SIZE)
					.map((t) => t.track_id);
				await this.importTracks(playlistId, videoIds);
			}
		}

		return true;
	}
}

export default Core;
