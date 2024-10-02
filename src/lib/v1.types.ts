export namespace V1 {
	export type BackupData = {
		library: Library;
		playlists: Playlist[];
		playlist_items: PlaylistItem[];
	};

	export type Library = {
		items: TrackItem[];
		ot: 'custom';
		name: 'My Library';
		date: number;
	};

	export type Playlist = {
		items: TrackItem[];
		ot: 'custom';
		name: string;
		type: 'user';
		date: number;
	};

	export type TrackItem = {
		cd: number;
		pos: number;
		video_id: string;
	};

	export type PlaylistItem = {
		video_id: string;
		video_name: string;
		video_creator: string;
		video_duration: number;
		created_date: number;
	};
}
