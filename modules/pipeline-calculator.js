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
 * @property {number} totalLength
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

	// Convert pig friction from kPa to Pa.
	let pigFriction = injectionFluid.pigFriction * 1000;

	// Calculate inside diameter of pipeline.
	let insideDiameter = (pipeline.outsideDiameter - (2 * pipeline.wallThickness));

	// Convert inside pipe diameter to meters so it is in S.I.
	insideDiameter = insideDiameter / 1000; 

	// Convert initial nitrogen injection rate to S.I. (Nm3/sec).
	let nitrogenInjectionM3PerSec = injectionFluid.initialRate / 60;

	// Calculate fluid density (rho, kg/m3).
	let rho = injectionFluid.specificGravity * 1000;

	// Calculate dynamic viscosity Ns/m2.
	let eta = injectionFluid.viscosity * rho / 1000000;

	// Convert max pipe pressure to S.I (kPa to Pa).
	let maxPipePressure = pipeline.maximumPipePressure * 1000;

	// Calculate cross sectional area of the pipe. 
	let area = 0.25 * (insideDiameter * insideDiameter) * Math.PI;

	// Calculate slug volume. 
	let slugVolume = area * pipeline.totalLength;

	// Calculate free volume.
	let freeVolume = area * pipeline.purgeLength;

	// Calculare free volume per kilometer.
	let freeVolumePerKm = area * 1000;

	// Calculare mass of slug (mass of fluid being displaced).
	let mass = slugVolume * rho;

	// Calculate pressure limit.
	let pressureLimit = injectionFluid.initialBackPressure * 1000;

	// Calculare pinit (pressure initial?)
	let pinit = pressureLimit;

	// Calculare back pressure.
	let backPressure = pressureLimit;

	// Calculare slug length (meters).
	let slugLength = slugVolume / area;

	// Time is initially zero.
	let tim = 0;

	// Slug back pressure is initially 0 becuase slug initially fills line.
	let slugBackPressure = 0;

	//Comment from original program: elevationFrontOfLine is always at the far end of pipeline.
	let elevationBackOfLine = elevationProfile[0][1];
	let elevationFrontOfLine = elevationProfile[elevationProfile.length-1][1];

	// Calculate hydback (hydrostatic backpressure)
	// Comment from original program: get the hydrostatic at the back of the slug,
	// hydback is +ve when back of slug is lower than front.
	let hydback = Math.abs(rho * 9.81 * (elevationFrontOfLine - elevationBackOfLine));

	// Comment from original program: initial pump rate is specified,
	// Assume it is barely moving(vel=initvel)
	// and that the injection pressure: 
    // Pin = backpressure + hydrostatic + pig friction pressure + flow friction at initial velocity.
	let initialVelocity = 0.01;
	let velocity = initialVelocity;
	let previousVelocity = velocity;
	let newVelocity = velocity;
	let nm3Pumped = 0;

    // Comment from original program: Cushion adsorbs the pressure spike in the first timestamp. 
    // (Cushion is likely a factor of safety).
	let cushion = 10;
	let cushionInitialBar = (pinit + hydback + pigFriction) / 100000;
	let cushion_n_m3 = cushion + area + cushionInitialBar;

	let injectionVelocity = 0; 
	let injectionPressure = 0; 
	let injectionVolume = 0; 
	let displacementRate = 0;
	let displacementVolume = 0; 
	let distance = 0;
	let elevation = 0; 

	// Declare output array of objects.
	let outputArrayOfObjects = [];

	// Declare the output objects (each object represents a row in the output table).
	let outputObject = 
					{	
						time:0, 
						distance:0, 
						elevation:0, 
						injectionVelocity:0, 
						injectionPressure:0, 
						injectionVolume:0, 
						displacementRate:0,
						displacementVolume:0,	
					};

		
					

	// Perform nitorgen injection calculations for each elevation profile data point starting here
	for(let i = 0; i < elevationProfile.length - 1; i++){
	// 	// console.log(elevationProfile[i][0]);
	// 	// console.log(elevationProfile[i][1]);

		
	console.log(parseFloat(elevationProfile[i][1]));
		
		
		
	// 	// outputObject.time = tim;
	// 	// outputObject.distance = elevationProfile[i][0];
	// 	// outputObject.elevation = elevationProfile[i][1]; 
	// 	// outputObject.injectionVelocity = injectionVelocity;
	// 	// outputObject.injectionPressure = injectionPressure;
	// 	// outputObject.injectionVolume = injectionVolume;
	// 	// outputObject.displacementRate = displacementRate;
	// 	// outputObject.displacementVolume = displacementVolume; 
		
	// 	// outputArrayOfObjects.push(outputObject);
	}

	// If successful change element "Calculated injection profile" to green color
	
	//console.log(outputArrayOfObjects);

	return 10;
}

