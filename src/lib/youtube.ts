class YouTubeAPI {
	private ORIGIN: string = 'https://music.youtube.com';

	private SESSION_ID: string = '';
	private CLIENT_NAME: string = '';
	private CLIENT_VERSION: string = '';
	private SESSION_INDEX: string = '0';

	private async generateHeaders(): Promise<HeadersInit> {
		const sha1 = async (str: string) => {
			const buf = await window.crypto.subtle.digest(
				'SHA-1',
				new TextEncoder().encode(str),
			);
			return Array.prototype.map
				.call(new Uint8Array(buf), (x) => ('00' + x.toString(16)).slice(-2))
				.join('');
		};

		// credit: https://gist.github.com/eyecatchup/2d700122e24154fdc985b7071ec7764a
		const SAPISID = document.cookie.split('SAPISID=')[1].split('; ')[0];
		const TIMESTAMP_MS = Date.now();
		const digest = await sha1(`${TIMESTAMP_MS} ${SAPISID} ${this.ORIGIN}`);
		const SAPISIDHASH = `${TIMESTAMP_MS}_${digest}`;

		return {
			Authorization: `SAPISIDHASH ${SAPISIDHASH}`,
			'x-goog-authuser': this.SESSION_INDEX,
			...(this.SESSION_ID !== undefined && {
				'x-goog-pageid': this.SESSION_ID,
			}),
			'x-origin': this.ORIGIN,
			'x-youtube-bootstrap-logged-in': 'true',
		};
	}

	private async getSessionIndex() {
		const response = await fetch('https://music.youtube.com/library');
		const text = await response.text();
		const match = text.match(/"SESSION_INDEX":\s*"(\d+)"/);
		if (match) {
			this.SESSION_INDEX = match[1];
		}

		console.log(
			`[ytapi init] ${this.SESSION_INDEX} ${this.SESSION_ID} ${this.CLIENT_NAME} ${this.CLIENT_VERSION}`,
		);
	}

	constructor() {}

	public inject(): Promise<boolean> {
		return new Promise((res) => {
			document.addEventListener('YT', (event) => {
				const {
					DELEGATED_SESSION_ID,
					INNERTUBE_CLIENT_NAME,
					INNERTUBE_CLIENT_VERSION,
					LOGGED_IN,
				} = (event as CustomEvent).detail;

				this.SESSION_ID = DELEGATED_SESSION_ID;
				this.CLIENT_NAME = INNERTUBE_CLIENT_NAME;
				this.CLIENT_VERSION = INNERTUBE_CLIENT_VERSION;
				this.getSessionIndex();
				res(LOGGED_IN);
			});

			const script = document.createElement('script');
			script.src = chrome.runtime.getURL('injection.js');
			document.documentElement.appendChild(script);
			script.onload = () => {
				script.remove();
			};
		});
	}

	static async videoExists(id: string): Promise<boolean> {
		const response = await fetch(
			`https://img.youtube.com/vi/${id}/mqdefault.jpg`,
			{
				method: 'HEAD',
			},
		);
		return response.status === 200;
	}

	async createPlaylist(
		title: string,
		description: string,
	): Promise<string | null> {
		const payload = {
			context: {
				client: {
					clientName: this.CLIENT_NAME,
					clientVersion: this.CLIENT_VERSION,
				},
			},
			title,
			description,
		};

		const headers = await this.generateHeaders();

		try {
			const response = await fetch(
				'https://music.youtube.com/youtubei/v1/playlist/create?prettyPrint=false',
				{
					method: 'POST',
					headers,
					body: JSON.stringify(payload),
					credentials: 'include',
				},
			);

			if (!response.ok) {
				return null;
			}

			const data = await response.json();
			return data.playlistId as string;
		} catch {
			return null;
		}
	}

	async addTracksToPlaylist(
		playlistId: string,
		videoIds: string[],
	): Promise<boolean> {
		const actions = videoIds.map((id) => ({
			addedVideoId: id,
			action: 'ACTION_ADD_VIDEO',
			dedupeOption: 'DEDUPE_OPTION_CHECK',
		}));

		const payload = {
			context: {
				client: {
					clientName: this.CLIENT_NAME,
					clientVersion: this.CLIENT_VERSION,
				},
			},
			actions: actions,
			playlistId: playlistId,
		};

		const headers = await this.generateHeaders();

		try {
			const response = await fetch(
				'https://music.youtube.com/youtubei/v1/browse/edit_playlist?prettyPrint=false',
				{
					method: 'POST',
					headers,
					body: JSON.stringify(payload),
					credentials: 'include',
				},
			);

			return response.ok;
		} catch {
			return false;
		}
	}
}

export default YouTubeAPI;
