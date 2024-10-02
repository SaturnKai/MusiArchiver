import App from './App.svelte';

if (
	window.location.pathname.endsWith('musi_archiver') ||
	window.location.pathname.endsWith('musi_archiver/')
) {
	document.documentElement.innerHTML = '';
	new App({ target: document.body });
}
