/**
 * Custom Editor.js Callout Block Tool.
 * Renders colored boxes with icons for info/warning/tip/danger callouts.
 */

export interface CalloutData {
	text: string;
	variant: 'info' | 'warning' | 'tip' | 'danger';
}

export interface CalloutConfig {
	placeholder?: string;
}

export default class CalloutTool {
	static get toolbox() {
		return {
			title: 'Callout',
			icon: '<svg width="17" height="15" viewBox="0 0 336 276" xmlns="http://www.w3.org/2000/svg"><path d="M291 150V79c0-19-15-34-34-34H79c-19 0-34 15-34 34v42l67-44 81 72 56-29 42 30zm0 52l-43-30-56 30-81-67-66 39v23c0 19 15 34 34 34h178c17 0 31-13 34-29zM79 0h178c44 0 79 35 79 79v118c0 44-35 79-79 79H79c-44 0-79-35-79-79V79C0 35 35 0 79 0z"/></svg>'
		};
	}

	static get isReadOnlySupported() {
		return true;
	}

	private api: any;
	private readOnly: boolean;
	private data: CalloutData;
	private wrapper: HTMLElement | null = null;

	constructor({ data, api, readOnly }: { data?: Partial<CalloutData>; config?: CalloutConfig; api: any; readOnly: boolean }) {
		this.api = api;
		this.readOnly = readOnly;
		this.data = {
			text: data?.text || '',
			variant: data?.variant || 'info'
		};
	}

	render() {
		this.wrapper = document.createElement('div');
		this.wrapper.classList.add('cdx-callout-wrapper');

		const variantSelect = document.createElement('select');
		variantSelect.classList.add('cdx-callout-variant');
		['info', 'warning', 'tip', 'danger'].forEach((variant) => {
			const option = document.createElement('option');
			option.value = variant;
			option.textContent = variant.charAt(0).toUpperCase() + variant.slice(1);
			if (variant === this.data.variant) option.selected = true;
			variantSelect.appendChild(option);
		});
		variantSelect.addEventListener('change', () => {
			this.data.variant = variantSelect.value as CalloutData['variant'];
			this.updatePreview();
		});

		const textArea = document.createElement('textarea');
		textArea.classList.add('cdx-callout-text');
		textArea.placeholder = 'Callout text...';
		textArea.value = this.data.text;
		textArea.addEventListener('input', () => {
			this.data.text = textArea.value;
		});

		this.wrapper.appendChild(variantSelect);
		this.wrapper.appendChild(textArea);

		this.updatePreview();

		return this.wrapper;
	}

	private updatePreview() {
		if (!this.wrapper) return;
		this.wrapper.className = `cdx-callout-wrapper cdx-callout-${this.data.variant}`;
	}

	save() {
		return this.data;
	}

	validate(savedData: CalloutData) {
		return !!savedData.text?.trim();
	}
}
