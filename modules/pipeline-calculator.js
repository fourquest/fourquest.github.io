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
	let pump_nm3s = injectionFluid.initialRate / 60;

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
	let dt = 0; 
	let main_dt = 0; 
	let endFlag = 0; 
	let cavdisable = 0; 
	let cavFlag = 0; 
	let projhydback = 0; 
	let flow_dp = 0; 
	let projslugback = 0; 
	let roughness = pipeline.roughnessFactor;

	// Declare output array of objects.
	let outputArrayOfObjects = [];

	// Perform nitorgen injection calculations for each elevation profile data point starting here
	for(let i = 0; i < elevationProfile.length; i++){
		

		if(slugBackPressure < 10){
            dt = 0.1 * main_dt; 
        } else if(velocity > 0) {
            if( !(Math.abs(previousVelocity/newVelocity) > 1.01) ){
                dt = 1.5 * dt; 
            }
        }

		if(dt > main_dt){
            dt = main_dt; 
        }

		if(endFlag = 1){
            dt = dt / 10;
            cavdisable = i + 1; 
        }

		// Call the function that looks for cavitation. 
       // cavitation(rowNumber, cavdisable, pipeProfileRecord.Elevation, slugBackPressure, numberOfDataPoints);
        
	   if(cavFlag = 1){
		/**
		 * 
		 * Add some kind of display about cavitation here! 
		 * 
		 */
		//return;
		}


		if(tim > 0){
            injectionPressure = (100000 / area) * (cushion_n_m3 + nm3Pumped + (pump_nm3s * dt)) / (cushion + slugBackPressure + (velocity * dt));
            if(backPressure < pressureLimit){
                velocity = 0; 
                backPressure = injectionPressure - hydback - pigFriction;
            } else {
                backpressure = pressureLimit;
            }
        }

		if(tim = 0){
            injectionPressure = backPressure + hydback + pigFriction + flow_dp;
        }

        projslugback = slugBackPressure + (velocity * dt);
		projhydback = rho * 9.81 * (elevationProfile[0][1] - elevationProfile[elevationProfile.length - 1][1]);
		
		slugLength = elevationProfile[elevationProfile.length - 1][0] - projslugback;

		// Gets flowdp, the delta P across the fluid slug, using sluglen.
		getFriction(flow_dp, velocity, insideDiameter, eta, roughness, rho, slugLength);

		// Solve for new velocity.
		if(backPressure >= pressureLimit){
			newVelocity = velocity + ((dt * area / mass) * (injectionPressure - projhydback - flow_dp - backPressure - (parseFloat(pigFriction))));  
			if(Math.abs(velocity) > 0){
				if(Math.abs(newVelocity / velocity) > 1.01 || Math.abs(newVelocity / velocity) < 0.99){
					dt = dt / 2; 
					newVelocity = velocity + ((dt * area / mass) * (injectionPressure - projhydback - flow_dp - backPressure - (parseFloat(pigFriction))));
				}
			}
		} else {
			newVelocity = 0; 
		}

        projslugback = slugBackPressure + (newVelocity * dt);
        slugLength = elevationProfile[elevationProfile.length - 1][0] - projslugback; 
        

		getFriction(flow_dp, velocity, insideDiameter, eta, roughness, rho, slugLength);

        if(backPressure >= pressureLimit){
            newVelocity = velocity + ((dt * area / mass) * (injectionPressure - projhydback - flow_dp - backPressure - (parseFloat(pigFriction))));
        } else {
            newVelocity = 0; 
        }

        tim = tim + dt; 	
		
		// Update movement using old value of velocity.
		slugBackPressure = projslugback;
		nm3Pumped = nm3Pumped + (dt * pump_nm3s);
		previousVelocity = velocity;
		velocity = newVelocity; 

		// Update mass for amount discharge in this time step. 
		slugVolume = (elevationProfile[elevationProfile.length - 1][0] - slugBackPressure) * area;
		mass = slugVolume * rho; 

		// Update slug length for getfric
		slugLength = slugVolume / area;

		// Declare the output objects (each object represents a row in the output table).
		let outputObject = 
					{	
						time: tim, 
						distance: elevationProfile[i][0], 
						elevation: elevationProfile[i][1], 
						injectionVelocity: injectionVelocity, 
						injectionPressure: injectionPressure, 
						injectionVolume: injectionVolume, 
						displacementRate: displacementRate,
						displacementVolume: displacementVolume,	
					};
		
		outputArrayOfObjects.push(outputObject);
	}

	// If successful change element "Calculated injection profile" to green color
	document.getElementById("calculated-profile-header").style.color = "green";

	return outputArrayOfObjects;
}




/**
 * 
 *  calculates flowdp &  friction factor for Darcy derivation  &  reynolds number
 * 
 */
 function getFriction(flow_dp, velocity, insideDiameter, eta, roughness, rho, slugLength){
    let re;
    let terma;
    let termb;
    let f;
    let fric; 

    if(velocity = 0){
        flow_dp = 0; 
        return; 
    }

    re = Math.abs(rho * velocity * insideDiameter / eta);

    if (re > 0.001){
        terma = (2.457 * Log(1 / ((7 / re) ** 0.9 + (0.27 * (parseFloat(roughness)) / insideDiameter)))) ** 16;
        termb = (37530 / re) ** 16;
        f = ((8 / re) ** 12 + (1 / (terma + termb) ** 1.5)) ** 0.083333;
        fric = 8 * f;  // For Darcy derivation
    } else {
        fric = 64 / re; // Darcy 
    }

    flow_dp = fric * rho * (velocity ** 2) * slugLength * 0.5 / insideDiameter; 

    if(velocity < 0){
        flow_dp = -flow_dp; 
    }

    return; 
}