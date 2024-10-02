<script lang="ts">
	import Favicon from './assets/favicon.svg';
	import Code from './lib/Code.svelte';
	import Transfer from './lib/Transfer.svelte';
	import nProgress from 'nprogress';
	import 'nprogress/nprogress.css';
	import './app.css';

	let transferPage: boolean = false;

	function startTransferPage() {
		transferPage = true;
	}

	nProgress.configure({ showSpinner: false });

	// DEBUG
	// import type { BackupData } from './lib/musi';
	// import Core from './lib/core';
	// import backupSampleData from '../_backup.json';
	// Core.instance.backup = {
	// 	code: '',
	// 	data: backupSampleData as BackupData,
	// };
	// transferPage = true;
</script>

<svelte:head>
	<title>Musi Archiver</title>
	<link rel="icon" type="image/svg+xml" href={Favicon} />
</svelte:head>

{#if transferPage === false}
	<Code on:backup-set={startTransferPage} />
{:else}
	<Transfer />
{/if}
