const numParticles = 120;
let particleArr = []; // hack for time being, not the best solution
const FPS = 60;
const SCREEN_TIME_LIMIT = 2000;
let intervId;

function runCouette(){
	/* clear the animation stack frame every rerun */
	clearInterval(intervId);
	particleArr = [];

	const width 	= "500";
	const height 	= "500";
	removeAllCanvases();
	prependCanvasToFlowCanvasContainer(width, height);
	showAllSliders();
	const canvas = document.getElementById("flow-canvas");
	let ctx = canvas.getContext("2d");
	/* change the coordinate axes system*/
	ctx.save(); // save the current state of the context
	ctx.transform(1, 0, 0, -1, 0, canvas.height);
	/* transform(a, b, c, d, e, f)
	 	* a (m11) : Horizontal scaling.
		* b (m12) : Horizontal skewing.
		* c (m21) : Vertical skewing.
		* d (m22) : Vertical scaling.
		* e (dx)  : Horizontal moving.
		* f (dy)  : Vertical moving. */

	intervId = setInterval(draw, 1000 / FPS);
}

function showAllSliders(){
	$("#flow-canvas-container").css({
		"display":"flex",
	});
}

function removeAllCanvases(){
	$(".canvas").remove();
}

function prependCanvasToFlowCanvasContainer(w, h){
	$("#flow-canvas-container").prepend('<canvas id="flow-canvas" class="canvas card" width='+ w + ' height=' + h + '></canvas>')
	$("#flow-canvas").css({
		"background": "#f0eee4",
		"margin": "20px",
	});
}

function drawCartesianAxes(ctx, canvas){
	ctx.save();
	ctx.strokeStyle = "black";

	/* x-axis */
	ctx.beginPath();
	ctx.moveTo(0,0);
	ctx.lineTo(canvas.width, 0);

	/* y-axis */
	ctx.moveTo(1,-canvas.height/2);
	ctx.lineTo(1, +canvas.height/2);
	ctx.stroke();
	ctx.closePath();
	ctx.restore();
}

function getBoundary(canvas){
	return {
		topSurf			: canvas.height/2.5,
		bottomSurf	: -canvas.height/2.5,
		startLoc		: 0,
		endLoc			: canvas.width,
	};
}

function drawSurfaces(ctx, bnd){
	ctx.save();
		ctx.strokeStyle = "blue";
		ctx.beginPath();
		ctx.moveTo(bnd.startLoc, bnd.topSurf);	
		ctx.lineTo(bnd.endLoc, bnd.topSurf);
		ctx.moveTo(bnd.startLoc, bnd.bottomSurf);
		ctx.lineTo(bnd.endLoc, bnd.bottomSurf);
		ctx.stroke();
		ctx.closePath();
	ctx.restore();
}

function getParticleInitialConditions(canvas, bnd){
	//let val = {
	//				uz	: 1,
	//				ur	: 0,
	//				z		: Math.floor( Math.random() * canvas.width ),
	//				r		:	Math.floor( Math.random() * (Math.random() > 0.5 ? bnd.topSurf : bnd.bottomSurf) ),
	//				screenTime : 0
	//			};
	let val = {
					uz	: 1,
					ur	: 0,
					z		: 0,
					r		:	Math.floor( Math.random() * (Math.random() > 0.5 ? bnd.topSurf : bnd.bottomSurf) ),
					screenTime : 0
				};
	val.uz = calculateUz(val.r, (bnd.topSurf - bnd.bottomSurf)/2, (bnd.endLoc - bnd.startLoc)); 
	return val;
}

function calculateUz(r, R, L){
	const delP = $("#pressure-range").val();
	const eta = 1;
	return delP * ( R*R - r*r ) / (4 * eta * L);
}

function draw(){
	const canvas = document.getElementById('flow-canvas');
	let ctx = canvas.getContext('2d');

	/* get the boundary info */
	const bnd = getBoundary(canvas);

	//ctx.globalCompositeOperation = 'destination-over';
	//ctx.clearRect(0, -canvas.height/2, canvas.width, canvas.height);

	/* create slightly transparent rectangle for trail effect */
	ctx.fillStyle = 'rgba(255, 255, 255, .10)';
	ctx.fillRect(0, -canvas.height/2, canvas.width, canvas.height);

	/* draw the cartesian coordinate axes */
	drawCartesianAxes(ctx, canvas);
	/* draw surfaces */
	drawSurfaces(ctx, bnd);

	/* get particles */
	if( particleArr.length < numParticles ){
		while(particleArr.length < numParticles){
			particleArr.push( getParticleInitialConditions(canvas, bnd) );
		}
	}
	else{
		for(let i = 0; i < particleArr.length; i++)
			particleArr[i].z += particleArr[i].uz;
	}

	/* check if some particles has gone out of the system and remove them if they do so */
	for( let i = 0; i < particleArr.length; i++){
		if(particleArr[i]. z > canvas.width || 
			particleArr[i].z < 0 || 
			particleArr[i].r >= canvas.height/2 || 
			particleArr[i].r <= -canvas.height/2 ||
			particleArr[i].screenTime > SCREEN_TIME_LIMIT){
				particleArr.splice(i,1);
				i--;
		}
	}

	/* Draw the particles */
	for(let i = 0; i < particleArr.length; i++){
		ctx.save();
			ctx.beginPath();
				ctx.fillStyle = "black";
				ctx.moveTo(particleArr[i].z, particleArr[i].r);
				ctx.arc(particleArr[i].z, particleArr[i].r, 1, 0, Math.PI * 2, true)
				ctx.fill();
		ctx.restore();
		particleArr[i].screenTime++;
	}
}

$(document).ready( () => {
	$("#pressure-range").change( () => {
		clearInterval(intervId);
		runCouette();
	});
});
