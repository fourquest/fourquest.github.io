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
		<a part="close-button button inactive"></a>
	</div>
</footer>
<input type="file" id="file-input" accept="text/csv" multiple hidden/>
`;

export class CsvEditorElement extends HTMLElement {

	_text;
	_data;
	_mode;
	_closeButton;
	_textViewButton;
	_tableViewButton;
	_textView;
	_tableView;
	_uploadButton;
	_fileInput;
	_viewButtons;
	_views;
	_footerButtonsElement;
	_textarea;

	constructor() {
		super();
		const shadow = this.attachShadow({"mode": "closed"});
		const content = template.content.cloneNode(true);

		this._text = "";
		this._data = {"headers":[], "content":[]}
		this._closeButton = content.querySelector("[part~='close-button' i]");
		this._textViewButton = content.querySelector("[part~='text-view-button' i]");
		this._tableViewButton = content.querySelector("[part~='table-view-button' i]");
		this._uploadButton = content.querySelector("[part~='upload-button' i]");
		this._textView = content.querySelector("[part~='text-view' i]");
		this._tableView = content.querySelector("[part~='table-view' i]");
		this._fileInput = content.querySelector("#file-input");
		this._textarea = content.querySelector("textarea");
		this._footerButtonsElement = content.querySelector("[part='footer-buttons']")
		this._viewButtons = [
			this._textViewButton,
			this._tableViewButton
		];
		this._views = [
			this._textView,
			this._tableView
		];

		this._textarea.addEventListener("change", this._handleTextChange.bind(this));
		this._footerButtonsElement.addEventListener("click", this._handleFooterButtonsClick.bind(this));
		this._fileInput.addEventListener("change", this._handleFileInputChange.bind(this), false);
		this._mode = "text";
		shadow.appendChild(content);
	}

	get close() {
		return this._closeButton.href;
	}

	set close(value) {
		if (typeof value !== "string")
			throw TypeError("close must be a string");
		const button = this._closeButton;
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
		return this._data;
	}

	set data(value) {
		this._text = serialize(value);
		this._data = value;
		this.draw();
		this.dispatchEvent(new CustomEvent("change", {bubbles: true}));
	}

	get text() {
		return this._text;
	}

	set text(value) {
		this._data = deserialize(value);
		this._text = value;
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
		this._tableView.innerHTML = "";
		this._tableView.appendChild(table);
	}

	drawText() {
		this._textarea.value = this.text;
	}

	get mode() {
		return this._mode;
	}

	set mode(value) {
		const mode = this.mode;
		if (value === mode)
			return;
		switch(value) {
			case "text":
				this._tableViewButton.part.remove("inactive");
				this._textViewButton.part.add("inactive");
				this._tableView.part.add("inactive");
				this._textView.part.remove("inactive");
				break;
			case "table":
				this._tableViewButton.part.add("inactive");
				this._textViewButton.part.remove("inactive");
				this._tableView.part.remove("inactive");
				this._textView.part.add("inactive");
				break;
			case "readonly":
				this._tableViewButton.part.add("inactive");
				this._textViewButton.part.add("inactive");
				this._tableView.part.remove("inactive");
				this._textView.part.add("inactive");
				this._uploadButton.part.add("inactive");
				break;
			default:
				console.warn("Requested unknown mode %s, reverting to %s", value, mode);
				value = mode;
		}
		this._mode = value;
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


	_handleTextChange() {
		this.text = this._textarea.value;
	}

	_handleFileInputChange(event) {
		let count = 0;
		const textarea = this._textarea;
		const files = this._fileInput.files;
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

	_handleFooterButtonsClick(event) {
		switch(event.target) {
			case this._tableViewButton:
				this.mode = "table";
				break;
			case this._textViewButton:
				this.mode = "text";
				break;
			case this._uploadButton:
				this._fileInput.click();
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
	let i = 0;
	let largeNumber = false; 

	for (let line of text.split("\n")) {
		if (line.charAt(0) === '"' && parseFloat(line.charAt(1)) == NaN && i == 0) {
			i++;
			if (data.headers.length === 0)
				data.headers = line
					.split(",")
					.map(item => item.replaceAll('"',''));
		} else {
			i++; 
			largeNumber = false;
			// Detect if the record contains a number larger than 1000 represented as a string
			// with a comma in it. 
			for(let m = 0; m < line.length; m++){
				if(line.charAt(m) === '"'){
					largeNumber = true; 
					break;
				}
			}
			console.log("new1 ");
			if(largeNumber == true){
				let holder = [];
				let largeNumberHolder = "";
				let quoteSwitch = false;
				for(let n = 0; n < line.length - 1; n++){
					if(line.charAt(n) === '"'){
						if(quoteSwitch == false){
							quoteSwitch = true; 
							continue;
						}
					}


					if(line.charAt(n) != '"' && quoteSwitch == true && line.charAt(n) != ','){
						console.log("charAt: "); 
						console.log(line.charAt(n));
						largeNumberHolder.concat(line.charAt(n));
						 console.log("large number holder is: ");
						 console.log(largeNumberHolder);
					}

					if(line.charAt(n) === '"'){
						quoteSwitch = false;
					}

					if(line.charAt(n) != '"' && quoteSwitch == false){
						largeNumberHolder.concat(line.charAt(n));
						//console.log(largeNumberHolder);
					}

					if(line.charAt(n) === ',' && quoteSwitch == false){
						holder.push(largeNumberHolder);
					}
					
				} 
				data.content.push(holder); 
			} else {
				let items = line.split(",");
				if (items.length > 1 || items[0] !== ""){
					data.content.push(items);
				}
			}	
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
