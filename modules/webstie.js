import {PipelineChartElement} from "./pipeline-chart-element.js";
import {CsvEditorElement} from "./csv.js";
import {injectionProfile} from "./pipeline-calculator.js";

const injectionProfileEditor = document.querySelector("#injection-profile csv-editor");
const elevationProfileEditor = document.querySelector(".elevation-profile csv-editor");
const downloadButton = document.getElementById("quick-download");
const velocitiesChart = document.getElementById("velocities-chart");
const elevationsChart = document.getElementById("elevations-chart");
const pressuresChart = document.getElementById("pressures-chart");
const clearButton = document.getElementById("clear-button");

clearButton.addEventListener("click", function(){
	location.reload();
});


function onSubmit(event) {
	if (event.target !== injectionProfileEditor) {
		event.preventDefault();
		const invalid = document.querySelector(":invalid");
		if (invalid === null) {
			const elevationProfile = elevationProfileEditor.data;

			if (elevationProfile.content.length > 0) {
				const injectionFluid = Object.fromEntries(new FormData(document.forms[0]).entries());
				const pipeline = Object.fromEntries(new FormData(document.forms[1]).entries());
				const profile = injectionProfile(
					injectionFluid,
					pipeline,
					elevationProfile.content);
				const data = {
					"headers": [
						// System
						"Purge Time (min)",

						// Pipeline
						"Distance (m)",
						"Elevation (m)",

						// Injection
						"Pig Speed (km/hr)",
						"N2 Pressure (kPa)",
						"N2 Total Volume (m3)",

						// Displacement
						"Outlet Fluid Rate (m3/min)",
						"Total Fluid Displaced (m3)",
					],
					"content": profile.map(record => [
						record.time,
						record.distance,
						record.elevation,
						record.injectionVelocity,
						record.injectionPressure,
						record.injectionVolume,
						record.displacementRate,
						record.displacementVolume,
					]),
				};
				const labels = profile.map(record => record.distance);
				const velocities = profile.map(record => record.injectionVelocity);
				const elevations = profile.map(record => record.elevation);
				const pressures = profile.map(record => record.injectionPressure);

				injectionProfileEditor.data = data;
				velocitiesChart.update(labels, velocities);
				elevationsChart.update(labels, elevations);
				pressuresChart.update(labels, pressures);
			}
		}
	}
}

// initialize
customElements.define("pipeline-chart", PipelineChartElement);
customElements.define("csv-editor", CsvEditorElement);
window.addEventListener("submit", onSubmit);
window.addEventListener("change", onSubmit);
downloadButton.addEventListener("click", () => injectionProfileEditor.download());
