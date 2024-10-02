import { getBackupData } from './lib/musi';

async function handleBackupRequest(code: string, sendResponse: Function) {
	try {
		const backupResult = await getBackupData(code);
		sendResponse({ success: true, backupResult });
	} catch (error) {
		sendResponse({ success: false, error });
	}
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action === 'getBackup') {
		handleBackupRequest(request.code, sendResponse);
		return true;
	} else if (request.action === 'downloadArchive') {
		chrome.downloads.download({
			url: request.url,
			filename: `Musi Backup Archive [${new Date().toDateString()}].zip`,
			saveAs: false,
		});
		return true;
	}

	return false;
});

chrome.action.onClicked.addListener((tab) => {
	const url = 'https://music.youtube.com/music_premium/musi_archiver';
	chrome.tabs.create({ url: url });
});
