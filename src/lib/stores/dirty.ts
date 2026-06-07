import { writable } from 'svelte/store';

/**
 * Global dirty-state tracker for admin forms.
 * Components call `dirty.mark(id)` when their form changes,
 * `dirty.clear(id)` after successful submit/discard.
 */
function createDirty() {
	const ids = new Set<string>();
	const { subscribe, set } = writable<Set<string>>(new Set());

	function emit() {
		set(new Set(ids));
	}

	return {
		subscribe,
		mark(id: string) {
			ids.add(id);
			emit();
		},
		clear(id: string) {
			ids.delete(id);
			emit();
		},
		clearAll() {
			ids.clear();
			emit();
		}
	};
}

export const dirty = createDirty();
