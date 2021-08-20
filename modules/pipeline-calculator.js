/**
 * @typedef InjectionFluidDescriptor
 * @property {number} initialRate
 * @property {number} initialBackPressure
 * @property {number} pigFriction
 * @property {number} specificGravity
 * @property {number} viscosity
 * @property {number} pigBypass
 * @property {number} coolDownLosses
 */

/**
 * @typedef PipelineDescriptor
 * @property {number} purgeLength
 * @property {number} outsideDiameter
 * @property {number} wallThickness
 * @property {number} maximumPipePressure
 * @property {number} roughnessFactor
 */

/**
 * @typedef ElevationProfileItemDescriptor
 * @property {number} distance
 * @property {number} elevation
 */

/**
 * @typedef {Array<ElevationProfileItemDescriptor>} ElevationProfileDescriptor
 */

/**
 * @typedef InjectionProfileItemDescriptor
	@property {number} time
	@property {number} distance
	@property {number} elevation
	@property {number} injectionVelocity
	@property {number} injectionPressure
	@property {number} injectionVolume
	@property {number} displacementRate
	@property {number} displacementVolume
 */

/**
 * @typedef {Array<InjectionProfileItemDescriptor>} InjectionProfileDescriptor
 */

/**
 *
 * @param {InjectionFluidDescriptor} injectionFluid
 * @param {PipelineDescriptor} pipeline
 * @param {ElevationProfileDescriptor} elevationProfile
 * @return {InjectionProfileDescriptor}
 */
export function injectionProfile(injectionFluid, pipeline, elevationProfile) {
	const pressureLimit = injectionFluid.initialBackPressure * 1000;
	const pigFriction = injectionFluid.pigFriction * 1000;
	const insideDiameter = (pipeline.outsideDiameter - (2 * pipeline.wallThickness)) / 1000;
	const nitrogenInjectionM3PerSec = injectionFluid.initialRate / 60;
	const rho = injectionFluid.specificGravity * 1000;
	const eta = injectionFluid.viscosity * rho / 1000000;
	const maxPipePressure = pipeline.maximumPipePressure * 1000;
	const area = 0.25 * (insideDiameter * insideDiameter) * Math.PI;
	const slugVolume = area * pipeline.totalLength;
	const freeVolume = area * pipeline.purgeLength;
	const freeVolumePerKm = area * 1000;
	const mass = slugVolume * rho;
	const pinit = pressureLimit;
	const backPressure = pressureLimit;
	const slugLength = slugVolume / area;
	const tim = 0;
	const slugBackPressure = 0;
	const elevationBackOfLine = elevationProfile[0][1];
	const elevationFrontOfLine = elevationProfile[elevationProfile.length-1][1];
	const hydback = Math.abs(rho * 9.81 * (elevationFrontOfLine - elevationBackOfLine));
	const initialVelocity = 0.01;
	const velocity = initialVelocity;
	const previousVelocity = velocity;
	const newVelocity = velocity;
	const nm3Pumped = 0;
	const cushion = 10;
	const cushionInitialBar = (pinit + hydback + pigFriction) / 100000;
	const cushion_n_m3 = cushion + area + cushionInitialBar;


	// If successful change element "Calculated injection profile" to green color

	return [
		{	
			"time": 0,
			"distance": 1,
			"elevation": 606,
			"injectionVelocity": 0,
			"injectionPressure": 686,
			"injectionVolume": 565,
			"displacementRate": 35,
			"displacementVolume": 261.7,
		},
		{
			"time": 1.1,
			"distance": 2,
			"elevation": 687,
			"injectionVelocity": 5.93,
			"injectionPressure": 1858,
			"injectionVolume": 9921,
			"displacementRate": 25.61,
			"displacementVolume": 520.68,
		},
		{
			"time": 1.2,
			"distance": 3,
			"elevation": 689,
			"injectionVelocity": 6.25,
			"injectionPressure": 1799,
			"injectionVolume": 14671,
			"displacementRate": 26.97,
			"displacementVolume": 777.62,
		},
		{
			"time": 1.3,
			"distance": 4,
			"elevation": 656,
			"injectionVelocity": 6.36,
			"injectionPressure": 1782,
			"injectionVolume": 19338,
			"displacementRate": 27.46,
			"displacementVolume": 1039.13,
		},
		{
			"time": 1.4,
			"distance": 5,
			"elevation": 687,
			"injectionVelocity": 6.37,
			"injectionPressure": 1757,
			"injectionVolume": 24025,
			"displacementRate": 27.46,
			"displacementVolume": 1296.94,
		},
		{
			"time": 1.5,
			"distance": 6,
			"elevation": 678,
			"injectionVelocity": 6.36,
			"injectionPressure": 1758,
			"injectionVolume": 28775,
			"displacementRate": 0,
			"displacementVolume": 1555.21,
		},
		{
			"time": 1.6,
			"distance": 7,
			"elevation": 567,
			"injectionVelocity": 6.44,
			"injectionPressure": 1759,
			"injectionVolume": 37775,
			"displacementRate": 29.50,
			"displacementVolume": 1813.73,
		},
	];
}

