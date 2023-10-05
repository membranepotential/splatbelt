// Inspired by https://dev.to/theether0/making-a-toast-component-in-svelte-and-sveltekit-4gpj
import { writable } from 'svelte/store';

type Notification = string;

export const notifications = writable<Notification[]>([]);

export function toast(message: string) {
	notifications.update((state) => [message, ...state]);
	setTimeout(removeToast, 5000);
}

function removeToast() {
	notifications.update((state) => {
		return [...state.slice(0, state.length - 1)];
	});
}
