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
 * @property {number} outputDistance
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
	let diameter = insideDiameter / 1000; 

	// Convert initial nitrogen injection rate to S.I. (from m3/min to m3/sec).
	let pump_nm3s = injectionFluid.initialRate / 60;

	// Calculate fluid density (rho, kg/m3).
	let rho = injectionFluid.specificGravity * 1000;

	// Calculate dynamic viscosity Ns/m2.
	let eta = injectionFluid.viscosity * rho / 1000000;

	// Convert max pipe pressure to S.I (kPa to Pa).
	let maxPipePressure = pipeline.maximumPipePressure * 1000;

	// Calculate cross sectional area of the pipe. 
	let area = 0.25 * (diameter ** 2) * Math.PI;

	// Calculate slug volume 
	let slugVolume = area * (parseFloat(elevationProfile[elevationProfile.length - 1][0]));

	// Calculate free volume.
	let freeVolume = area * pipeline.purgeLength;
	console.log("Free volume: " + freeVolume);

	// Calculare free volume per kilometer.
	let freeVolumePerKm = freeVolume / (pipeline.purgeLength / 1000);
	console.log("Free Volume per km: " + freeVolumePerKm);
	console.log("");

	// Calculare mass of slug (mass of fluid being displaced).
	let mass = slugVolume * rho;

	// Calculate pressure limit = initial back pressure, convert to Pascals from kPa
	let pressureLimit = injectionFluid.initialBackPressure * 1000;

	// Calculare pinit (pressure initial?)
	let pinit = pressureLimit;

	// Calculare back pressure.
	let backPressure = pressureLimit;

	// Calculare slug length (meters).
	let slugLength = slugVolume / area;

	// Time is initially zero.
	let tim = 0;

	// backOfSlug is the distance at which the back of the slug is located (realative to injection point).
	// backOfSlug is initially 0 becuase slug initially fills line. 
	let backOfSlug = 0;

	//Comment from original program: elevationFrontOfLine is always at the far end of pipeline.
	let elevationAtBack = interpolateElevation(backOfSlug, elevationProfile);
	let elevationAtFront = (parseFloat(elevationProfile[elevationProfile.length-1][1]));

	// Calculate hydback (hydrostatic backpressure)
	// Comment from original program: get the hydrostatic at the back of the slug,
	// hydback is +ve when back of slug is lower than front.
	let hydback = rho * 9.81 * (elevationAtFront - elevationAtBack);

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
	let cushion_n_m3 = cushion * area * cushionInitialBar;

	let injectionPressure = 0;  
	let dt = 0; 
	let endFlag = 0; 
	let cavdisable = 0; 
	let projhydback = 0; 
	let flow_dp = 0; 
	let projectedBackOfSlug = 0; 
	let roughness = pipeline.roughnessFactor;
	let elevation = 0; 
	let hr = 0;
	let min = 0;
	let h = 0;
	let m = 0; 
	let last = 0; 
	let i = 0; 

	// Declare output array of objects.
	let outputArrayOfObjects = [];

	let main_dt = 10; 

	console.log("output distance: "  + pipeline.outputDistance);

	// Perform nitorgen injection calculations for each elevation profile data point starting here
	do {

		i++; 
		console.log(i);

		if(i > 20000){
			endFlag = 1; 
		}

		if(backOfSlug < 10){
			dt = 0.1 * main_dt;

		} else {
			if(velocity > 0) {
				if(!((Math.abs(previousVelocity / newVelocity)) > 1.01)){
					dt = 1.5 * dt; 
				}
			}
		}

		if(dt > main_dt){
			dt = main_dt;
		}

		if(endFlag == 1){
			dt = dt / 10; 
			cavdisable = i; 
		}

		// Check for cavitation and make sure max pressure has not been exceeded. 
		let passElevation = interpolateElevation(backOfSlug, elevationProfile);

		let endCheck = cavitationAndMaxPressureDetection(passElevation, i, cavdisable, backOfSlug, elevationProfile, elevationAtFront, backPressure, maxPipePressure, injectionPressure, rho, flow_dp);
		
		if(endCheck == 1){
			return outputArrayOfObjects;
		}

		if(tim > 0){
			injectionPressure = (100000 / area) * (cushion_n_m3 + nm3Pumped + (pump_nm3s * dt)) / (cushion + backOfSlug + (velocity * dt));
			if(backPressure < pressureLimit){
				velocity = 0; 
				backPressure = injectionPressure - hydback - pigFriction;
			} else {
				backPressure = pressureLimit; 
			}
		}


		if(tim == 0){
			injectionPressure = backPressure + hydback + pigFriction + flow_dp;
		}

		projectedBackOfSlug = backOfSlug + (velocity * dt); 

		// Detect the end of the run
		console.log("endFlag: " + endFlag);
		if(projectedBackOfSlug > (pipeline.purgeLength - 2)){ // Do not attempt to calculate the last 2 meters of the run
			endFlag = 1;
			console.log("detect end of run");
			let thisoutputObject = 
				{	
					time: h + "h " + m + "m", 
					distance: (parseFloat(purgeLength / 1000)), 
					elevation: (parseFloat(elevationProfile[1][1])), 
					injectionVelocity: parseFloat((velocity * 3.6).toFixed(2)),
					injectionPressure: parseFloat((((injectionPressure)/1000) - 101).toFixed(2)), 
					injectionVolume: parseFloat(nm3Pumped.toFixed(2)), 
					displacementRate:  parseFloat(((velocity * area) * 60).toFixed(2)),
					displacementVolume: parseFloat(((backOfSlug / 1000) * freeVolumePerKm).toFixed(2)),
				};

			outputArrayOfObjects.push(thisoutputObject);
			return outputArrayOfObjects;
		}

		elevation = interpolateElevation(projectedBackOfSlug, elevationProfile);

		elevationAtBack = elevation; 
		projhydback = rho * 9.81 * (elevationAtFront - elevationAtBack); 
		slugLength = (parseFloat(elevationProfile[elevationProfile.length - 1][0])) - projectedBackOfSlug;

		// Comment from original program: gets flowdp,the flowing dp across the fluid slug, using sluglength
		flow_dp = getFriction(flow_dp, velocity, insideDiameter, eta, roughness, rho, slugLength);

		// Solve for new velocity
		if(backPressure >= pressureLimit){
			newVelocity = velocity + ((dt * area / mass) * (injectionPressure - projhydback - flow_dp - backPressure - pigFriction));
			if((Math.abs(velocity)) > 0){
				if(((Math.abs(newVelocity / velocity)) > 1.01) || ((Math.abs(newVelocity / velocity)) < 0.99)){
					dt = dt / 2; 
					newVelocity = velocity + ((dt * area / mass) * (injectionPressure - projhydback - flow_dp - backPressure - pigFriction));
				}
			}
		} else {
			newVelocity = 0; 
		}

		projectedBackOfSlug = backOfSlug + (newVelocity * dt);
		slugLength = (parseFloat(elevationProfile[elevationProfile.length - 1][0])) - projectedBackOfSlug;

		flow_dp = getFriction(flow_dp, velocity, insideDiameter, eta, roughness, rho, slugLength);

		if(backPressure >= pressureLimit){
			newVelocity = velocity + ((dt * area / mass) * (injectionPressure - projhydback - flow_dp - backPressure - pigFriction));
		} else {
			newVelocity = 0; 
		}

		projectedBackOfSlug = backOfSlug + (newVelocity * dt);
		slugLength = (parseFloat(elevationProfile[elevationProfile.length - 1][0])) - projectedBackOfSlug;

		flow_dp = getFriction(flow_dp, velocity, insideDiameter, eta, roughness, rho, slugLength);

		if(backPressure >= pressureLimit){
			newVelocity = velocity + ((dt * area / mass) * (injectionPressure - projhydback - flow_dp - backPressure - pigFriction));
		} else {
			newVelocity = 0; 
		}

		tim = tim + dt; 

		// Comment from original program: update movement using old value of velocity. 
		backOfSlug = projectedBackOfSlug;

		nm3Pumped = nm3Pumped + (dt * pump_nm3s);
		previousVelocity = velocity;
		velocity = newVelocity; 

		// Comment from original program: update mass for amount discharfed in this time step. 
		slugVolume = ((parseFloat(elevationProfile[elevationProfile.length - 1][0])) - backOfSlug) * area; 
		mass = slugVolume * rho; 

		// Comment from original program: Update slugLength for getFriction().
		slugLength = slugVolume / area;

		console.log("back of slug: " + backOfSlug);

		hr = parseFloat(parseInt((tim / 3600), 10));
		min = ((tim/3600) - hr ) * 60; 
		h = hr.toFixed(0);
		m = min.toFixed(0);
		let timeholderstring = h + "h " + m + "m";

		if((Math.trunc(backOfSlug / pipeline.outputDistance)) > last || i == 1){
			last = Math.trunc(backOfSlug / pipeline.outputDistance);

			if (tim > main_dt || i == 1){let outputObject = 
				{	
					time: timeholderstring, 
					distance: (parseFloat((backOfSlug / 1000).toFixed(2))), 
					elevation: (parseFloat(elevationProfile[1][1])), 
					injectionVelocity: parseFloat((velocity * 3.6).toFixed(2)),
					injectionPressure: parseFloat((((injectionPressure)/1000) - 101).toFixed(2)), 
					injectionVolume: parseFloat(nm3Pumped.toFixed(2)), 
					displacementRate:  parseFloat(((velocity * area) * 60).toFixed(2)),
					displacementVolume: parseFloat(((backOfSlug / 1000) * freeVolumePerKm).toFixed(2)),
				};
		
				outputArrayOfObjects.push(outputObject);
			}
		}
	} while (endFlag == 0);

	// If successful change element "Calculated injection profile" to green color
	document.getElementById("calculated-profile-header").style.color = "green";

	return outputArrayOfObjects;
} 



/**
 * 
 *  calculates flowdp &  friction factor for Darcy derivation  &  reynolds number
 * 
 */
 function getFriction(flow_dp, velocity, diameter, eta, roughness, rho, slugLength){
    let re;
    let terma;
    let termb;
    let f;
    let fric; 

    if(velocity == 0){
        flow_dp = 0; 
        return flow_dp; 
    }

    re = Math.abs(rho * velocity * diameter / eta);

    if (re > 0.001){
        terma = (2.457 * (Math.log(1 / ((7 / re)) ** 0.9 + (0.27 * (roughness) / diameter)))) ** 16;
        termb = (37530 / re) ** 16;
        f = ((8 / re) ** 12 + (1 / (terma + termb) ** 1.5)) ** 0.083333;
        fric = 8 * f;  // For Darcy derivation
    } else {
        fric = 64 / re; // Darcy 
    }


    flow_dp = fric * rho * (velocity ** 2) * slugLength * 0.5 / diameter; 


    if(velocity < 0){
        flow_dp = flow_dp - flow_dp - flow_dp; 
    }

    return flow_dp; 
}


// Detects cavitation(pressure < 5 kPa) and if maximum pressure has been exceeded.
function cavitationAndMaxPressureDetection(elevation, i, cavdisable, backOfSlug, elevationProfile, elevationAtFront, backPressure, maxPipePressure, injectionPressure, rho, flow_dp){
	let interval = 50;
	let cavlimit = 5000;
	let lowppos = 0; 
	let hydro = 0; 
	let x = 0; 
	let pressure = 0; 
	let endTrigger = 0;

	if(i > cavdisable + 10){
		for(x = 1; x <= interval - 1; x++){
			lowppos = backOfSlug + (((parseFloat(elevationProfile[elevationProfile.length - 1][0])) - backOfSlug) * x / interval); 
			elevation = interpolateElevation(lowppos, elevationProfile);
			hydro = rho * 9.81 * (elevationAtFront - elevation);
			pressure = hydro + backPressure + ((1 - ( x / interval )) * flow_dp); 

			if((pressure > maxPipePressure) || (injectionPressure > maxPipePressure)){
				if(pressure > maxPipePressure){
					alert("Maximum Pressure was Exceeded at: " + backOfSlug/1000 + " km, reduce N2 rate.");
					document.getElementById("calculated-profile-header").innerHTML = "Max pressure exceeded";
					return endTrigger = 1;
				} else {
					let thisInject = (injectionPressure/1000).toFixed(3);
					alert("Max pressure was exceeded at injection point. Pressure is: " + thisInject + " kPa, reduce N2 rate.");
					document.getElementById("calculated-profile-header").innerHTML = "Max pressure exceeded";
					return endTrigger = 1;
				}
			}

			if(pressure < cavlimit){
				let thisPressure = (pressure / 1000).toFixed(3);
				alert("Cavitation detected at: " + backOfSlug / 1000 + " km, backpressure too low: " + thisPressure + "kPa");
				document.getElementById("calculated-profile-header").innerHTML = "Cavitation detected";
				return endTrigger = 1;
			}
		}
	}
}


// Calculates elevations throught the pipeline. 
// The elevation of the slug must be interpolated because the slug exists over
// multiple elevation points. 
// Place is the back of the slug and eleva is the front of the slug. 
function interpolateElevation(place, elevationProfile){	
	let x = 0; 
	let eleva;

	for(let n = 1; n < elevationProfile.length - 1; n++){
		if((place >= (parseFloat(elevationProfile[n][0]))) && (place < (parseFloat(elevationProfile[n+1][0])))){
			x = n;
		}
	}

	// If the back of this section is the injection point. 
	if (place <= (parseFloat(elevationProfile[0][0]))){
		eleva = (parseFloat(elevationProfile[0][1]));
	}

	if((place >= (parseFloat(elevationProfile[0][0]))) && (place < (parseFloat(elevationProfile[elevationProfile.length - 1][0])))){
		eleva = (parseFloat(elevationProfile[x][1])) + ((place - (parseFloat(elevationProfile[x][0]))) / ((parseFloat(elevationProfile[x+1][0])) - (parseFloat(elevationProfile[x][0])))) * ((parseFloat(elevationProfile[x+1][1])) - (parseFloat(elevationProfile[x][1])));
	}

	if(place >= (parseFloat(elevationProfile[elevationProfile.length - 1][0]))){
		eleva = (parseFloat(elevationProfile[elevationProfile.length - 1][1]));
	}

	return eleva; 
}