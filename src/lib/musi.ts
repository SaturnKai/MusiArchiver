import type { V1 } from './v1.types';

export function convertBackup(backupData: V1.BackupData): BackupData {
	// convert tracks
	const tracks: Track[] = backupData.playlist_items.map((i) => {
		return {
			video_id: i.video_id,
			video_name: i.video_name,
			video_creator: i.video_creator,
			video_duration: i.video_duration,
		};
	});

	// convert playlist tracks
	// convert library tracks
	let playlistTracks: PlaylistTrack[] = backupData.library.items.map((i) => {
		return {
			created_date: i.cd,
			musi_playlist_name: 'library_tracks',
			track_id: i.video_id,
		};
	});

	// convert playlists
	const playlists: Playlist[] = backupData.playlists.map((p, i) => {
		const playlistId = `PLAYLIST-${i}`;

		playlistTracks = playlistTracks.concat(
			p.items.map((i) => {
				return {
					playlist_id: playlistId,
					created_date: i.cd,
					track_id: i.video_id,
					position: i.pos,
				};
			}),
		);

		return {
			id: playlistId,
			date: p.date,
			lp_date: 0,
			ot: p.ot,
			name: p.name,
		};
	});

	let result: BackupData = {
		playlists,
		playlist_tracks: playlistTracks,
		tracks,
		version: 2,
	};

	return result;
}

type BackupResult = {
	data: BackupData;
	raw: string;
};

export async function getBackupData(backupCode: string): Promise<BackupResult> {
	try {
		const response = await fetch(
			`https://feelthemusi.com/api/v4/backups/fetch/${backupCode}`,
		);
		if (!response.ok) {
			throw new Error(`Failed to send request. (${response.status})`);
		}

		const data = await response.json();
		if (data.error) {
			throw new Error(`${data.error}`);
		}

		const raw = data.success;
		const backupData = JSON.parse(raw);
		if (backupData.version === 2) {
			return {
				data: backupData as BackupData,
				raw,
			};
		}

		// version 1 conversion
		const conversion = convertBackup(backupData as V1.BackupData);
		return {
			data: conversion,
			raw,
		};
	} catch (err) {
		throw err;
	}
}

export type BackupData = {
	playlist_tracks: PlaylistTrack[];
	playlists: Playlist[];
	tracks: Track[];
	version: 2;
};

export type Playlist = {
	id: string;
	date: number;
	lp_date: number;
	name: string;
	ot: 'custom';
	share_token?: string;
	share_identifier?: string;
};

export type PlaylistTrack = {
	track_id: string;
	created_date: number;
	musi_playlist_name?: string;
	playlist_id?: string;
	position?: number;
};

export type Track = {
	video_id: string;
	video_name: string;
	video_creator: string;
	video_duration: number;
};
