/**
 * @typedef CsvDescriptor
 * @property {string[]} headers
 * @property {*[][]} content
 */

const template = document.createElement("template");
template.innerHTML = `
<main>
	<section part="table-view view inactive"></section>
	<section part="text-view view">
		<textarea part="textarea"></textarea>
	</section>
</main>
<footer part="footer">
	<div part="separator"></div>
	<div part="footer-buttons">
		<a part="text-view-button button inactive"></a>
		<a part="table-view-button button"></a>
		<a part="upload-button button"></a>
		<a part="download-button button"></a>
		<a part="close-button button inactive"></a>
	</div>
</footer>
<input type="file" id="file-input" accept="text/csv" multiple hidden/>
`;

export class CsvEditorElement extends HTMLElement {

	#text;
	#data;
	#mode;
	#closeButton;
	#textViewButton;
	#tableViewButton;
	#textView;
	#tableView;
	#uploadButton;
	#downloadButton;
	#fileInput;
	#viewButtons;
	#views;
	#footerButtonsElement;
	#textarea;

	constructor() {
		super();
		const shadow = this.attachShadow({"mode": "closed"});
		const content = template.content.cloneNode(true);

		this.#text = "";
		this.#data = {"headers":[], "content":[]}
		this.#closeButton = content.querySelector("[part~='close-button' i]");
		this.#textViewButton = content.querySelector("[part~='text-view-button' i]");
		this.#tableViewButton = content.querySelector("[part~='table-view-button' i]");
		this.#downloadButton = content.querySelector("[part~='download-button' i]");
		this.#uploadButton = content.querySelector("[part~='upload-button' i]");
		this.#textView = content.querySelector("[part~='text-view' i]");
		this.#tableView = content.querySelector("[part~='table-view' i]");
		this.#fileInput = content.querySelector("#file-input");
		this.#textarea = content.querySelector("textarea");
		this.#footerButtonsElement = content.querySelector("[part='footer-buttons']")
		this.#viewButtons = [
			this.#textViewButton,
			this.#tableViewButton
		];
		this.#views = [
			this.#textView,
			this.#tableView
		];

		this.#textarea.addEventListener("change", this.#handleTextChange.bind(this));
		this.#footerButtonsElement.addEventListener("click", this.#handleFooterButtonsClick.bind(this));
		this.#fileInput.addEventListener("change", this.#handleFileInputChange.bind(this), false);
		this.#mode = "text";
		shadow.appendChild(content);
	}

	get close() {
		return this.#closeButton.href;
	}

	set close(value) {
		if (typeof value !== "string")
			throw TypeError("close must be a string");
		const button = this.#closeButton;
		if (close.href === value)
			return;
		if (value === "") {
			button.part.add("inactive");
		} else {
			button.part.remove("inactive");
		}
		button.setAttribute("href", value);
	}

	get data() {
		return this.#data;
	}

	set data(value) {
		this.#text = serialize(value);
		this.#data = value;
		this.draw();
		this.dispatchEvent(new CustomEvent("change", {bubbles: true}));
	}

	get text() {
		return this.#text;
	}

	set text(value) {
		this.#data = deserialize(value);
		this.#text = value;
		this.draw();
		this.dispatchEvent(new CustomEvent("change", {bubbles: true}));
	}

	draw() {
		this.drawText();
		this.drawTable();
	}

	drawTable() {
		const {headers, content} = this.data;
		const table = document.createElement("table");
		const thead = document.createElement("thead");
		const tbody = document.createElement("tbody");

		let tr = document.createElement("tr");
		for (let header of headers) {
			let td = document.createElement("th");
			td.part.add("th");
			td.textContent = header;
			tr.appendChild(td);
		}
		thead.appendChild(tr);
		for (let row of content) {
			tr = document.createElement("tr");
			for (let column of row) {
				let td = document.createElement("td");
				td.part.add("td");
				td.textContent = column;
				tr.appendChild(td);
			}
			tbody.appendChild(tr);
		}

		thead.part.add("thead");
		tbody.part.add("tbody");
		table.part.add("table");
		table.append(thead, tbody);
		this.#tableView.innerHTML = "";
		this.#tableView.appendChild(table);
	}

	drawText() {
		this.#textarea.value = this.text;
	}

	get mode() {
		return this.#mode;
	}

	set mode(value) {
		const mode = this.mode;
		if (value === mode)
			return;
		switch(value) {
			case "text":
				this.#tableViewButton.part.remove("inactive");
				this.#textViewButton.part.add("inactive");
				this.#tableView.part.add("inactive");
				this.#textView.part.remove("inactive");
				break;
			case "table":
				this.#tableViewButton.part.add("inactive");
				this.#textViewButton.part.remove("inactive");
				this.#tableView.part.remove("inactive");
				this.#textView.part.add("inactive");
				break;
			case "readonly":
				this.#tableViewButton.part.add("inactive");
				this.#textViewButton.part.add("inactive");
				this.#tableView.part.remove("inactive");
				this.#textView.part.add("inactive");
				this.#uploadButton.part.add("inactive");
				break;
			default:
				console.warn("Requested unknown mode %s, reverting to %s", value, mode);
				value = mode;
		}
		this.#mode = value;
		this.setAttribute("mode", value);
	}

	appendText(value) {
		this.text = `${this.text}\n${value}`;
	}

	attributeChangedCallback(name, oldValue, value) {
		if (oldValue !== value) {
			if (name === "mode")
				this.mode = value;
			if (name === "close")
				this.close = value;
		}
	}

	download(name = "data.csv") {
		const blob = new Blob([this.text], {type: "text/csv"});
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement("a");

		anchor.href = url;
		anchor.download = name;
		anchor.click();
	}

	#handleTextChange() {
		this.text = this.#textarea.value;
	}

	#handleFileInputChange(event) {
		let count = 0;
		const textarea = this.#textarea;
		const files = this.#fileInput.files;
		let text = "";
		const onload = event => {
			text += event.target.result;
			count++;
			if (files.length === count) {
				this.appendText(text);
			}
		}

		for (let file of files) {
			let reader = new FileReader();
			reader.onload = onload;
			reader.readAsText(file);
		}
	};

	#handleFooterButtonsClick(event) {
		switch(event.target) {
			case this.#tableViewButton:
				this.mode = "table";
				break;
			case this.#textViewButton:
				this.mode = "text";
				break;
			case this.#downloadButton:
				this.download();
				break;
			case this.#uploadButton:
				this.#fileInput.click();
				break;
			default:
				return;
		}
		event.preventDefault();
	};
}

CsvEditorElement.observedAttributes = ["mode", "close"];


/**
 * @param {string} text
 * @return {CsvDescriptor}
 */
export function deserialize(text) {
	const data = {"headers": [], "content": []};

	for (let line of text.split("\n")) {
		if (line.charAt(0) === '"') {
			if (data.headers.length === 0)
				data.headers = line
					.split(",")
					.map(item => item.replaceAll('"',''));
		} else {
			let items = line.split(",");
			if (items.length > 1 || items[0] !== "")
				data.content.push(items);
		}
	}
	return data;
}

/**
 * @param {CsvDescriptor} csv
 * @return {string}
 */
export function serialize(csv) {
	let text = csv.headers.map(header => `"${header}"`).join();

	for(let line of csv.content) {
		text += "\n" + line.join();
	}
	return text;
}
