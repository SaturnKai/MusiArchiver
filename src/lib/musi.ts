export async function getBackupData(backupCode: string): Promise<BackupData> {
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

		const backupData = JSON.parse(data.success) as BackupData;
		return backupData;
	} catch (err) {
		throw err;
	}
}

export type BackupData = {
	playlist_tracks: PlaylistTrack[];
	playlists: Playlist[];
	tracks: Track[];
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
