import {Chart, registerables} from "./chart.js/chart.esm.js";

export class PipelineChartElement extends HTMLElement {
	#shadowRoot;
	chart;

	constructor() {
		super();
		this.#shadowRoot = this.attachShadow({"mode": "closed"});
		this.chart = null;
	}

	buildChartOptions(labels, data) {
		return {
			"type": "line",
			"responsive": true,
			"maintainAspectRatio": false,
			"data": {
				labels: labels,
				datasets: [{
					label: this.label,
					backgroundColor: this.lineColor,
					borderColor: this.lineColor,
					data: data,
				}]
			},
			"options": {
			}
		};
	}

	get label() {
		return this.getAttribute("label") ?? "Label Not Set";
	}

	get lineColor() {
		return this.getAttribute("line-color") ?? "#0053a3";
	}

	update(labels, data) {
		const canvas = document.createElement("canvas");
		this.#shadowRoot.innerHTML = "";
		this.#shadowRoot.appendChild(canvas);
		this.chart = new Chart(
			canvas,
			this.buildChartOptions(labels, data));
	}
}

Chart.register(...registerables);
