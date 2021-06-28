
/* Global variables */
const numParticles = 120;
//const numParticles = 1;
let particleArr = []; // change this!
const FPS = 60;
const SCREEN_TIME_LIMIT = 500;
let intervId;
let module = "";

function init(){
	/* clear the animation stack frame every rerun */
	clearInterval(intervId);
	particleArr = [];

	const width 	= $(window).width() * 0.5;
	const height 	= $(window).height() * 0.5;
	removeAllCanvases();
	prependCanvasToFlowCanvasContainer(width, height);
	showAllSliders();
}

function getCtxCanvas(){
	const canvas = document.getElementById("flow-canvas");
	let ctx = canvas.getContext("2d");
//
//	/* fix for blurry canvas */
//	/* Reference: https://medium.com/wdstack/fixing-html5-2d-canvas-blur-8ebe27db07da */
//	let dpi = window.devicePixelRatio;
//	let style_height = +getComputedStyle(canvas).getPropertyValue("height").slice(0, -2);
//	let style_width = +getComputedStyle(canvas).getPropertyValue("width").slice(0, -2);
//	canvas.setAttribute('height', style_height * dpi);
//	canvas.setAttribute('width', style_width * dpi);

	return { ctx: ctx, canvas: canvas };
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
		//"border": "red 2px solid",
	});
}

function drawCartesianAxes(ctx, canvas){
	ctx.save();
	ctx.strokeStyle = "black";

	/* x-axis */
	ctx.beginPath();
	ctx.moveTo(-canvas.width,1);
	ctx.lineTo(canvas.width, 1);

	/* y-axis */
	ctx.moveTo(1,-canvas.height);
	ctx.lineTo(1, +canvas.height);

	ctx.stroke();
	ctx.closePath();
	ctx.restore();
}

function drawSurfaces(ctx, bnd){
	ctx.save();
		ctx.strokeStyle = "blue";
		if( bnd.type == "lines" ){
			ctx.beginPath();
				ctx.moveTo(bnd.startLoc, bnd.topSurf);	
				ctx.lineTo(bnd.endLoc, bnd.topSurf);
				ctx.moveTo(bnd.startLoc, bnd.bottomSurf);
				ctx.lineTo(bnd.endLoc, bnd.bottomSurf);
				ctx.stroke();
			ctx.closePath();
		}
		else if (bnd.type == "circles") {
			/* arc(x, y, radius, startAngle, endAngle, counterclockwise) */
			ctx.beginPath();
				ctx.arc(0, 0, bnd.bottomSurf, 0, 2 * Math.PI, false);
				ctx.stroke();
			ctx.closePath();
			ctx.beginPath();
				ctx.arc(0, 0, bnd.topSurf, 0, 2 * Math.PI, false);
				ctx.stroke();
			ctx.closePath();
		}
	ctx.restore();
}

function createTrail(ctx, canvas){
	ctx.fillStyle = 'rgba(255, 255, 255, .10)';
	ctx.fillRect(-canvas.width, -canvas.height, 2*canvas.width, 2*canvas.height);
}

$(document).ready( () => {
	$("#pressure-range").change( () => {
		clearInterval(intervId);
		switch(module){
			case "poiseulle":
				runPoiseulle();
				break;
			case "couette":
				runCouette();
				break;
			case "rotating_cylinders_flow":
				runRotatingCylindersFlow();
				break;
		}	
	});
});

function removeOutdatedParticles(canvas){
	for( let i = 0; i < particleArr.length; i++){
			if(particleArr[i].isOutdated(canvas)){
				particleArr.splice(i,1);
				i--;
			}
	}
}

function drawParticles(ctx){
	for(let i = 0; i < particleArr.length; i++){
		ctx.save();
			ctx.beginPath();
				ctx.fillStyle = "black";
				particleArr[i].drawParticle(ctx);
				ctx.fill();
		ctx.restore();
	}
	//console.log(particleArr[0].ux);
}

function updateParticleInfo(canvas, bnd, updateFunc){
	if( particleArr.length < numParticles ){
		while(particleArr.length < numParticles)
			particleArr.push( updateFunc(canvas, bnd) );
	}
	else{
		for(let i = 0; i < particleArr.length; i++)
			particleArr[i].update();
	}
}

/* 111########################################################## */
/************  All Poiseulle specific functions ***************/
/* 1. runPoiseulle
 * 2. getBoundary_Poiseulle
 * 3. getParticleIC_Poiseulle
 * 4. drawPoiseulle
 */

function runPoiseulle(){
	module = "poiseulle";
	init();
	let {ctx, canvas} = getCtxCanvas();
	ctx.save(); // save the current state of the context
	ctx.transform(1, 0, 0, -1, 0, canvas.height/2);
	/* transform(a, b, c, d, e, f)
	 	* a (m11) : Horizontal scaling.
		* b (m12) : Horizontal skewing.
		* c (m21) : Vertical skewing.
		* d (m22) : Vertical scaling.
		* e (dx)  : Horizontal moving.
		* f (dy)  : Vertical moving. */

	intervId = setInterval(drawPoiseulle, 1000 / FPS);
}

function getBoundary_Poiseulle(canvas){
	return {
		type 				: "lines",
		topSurf			: canvas.height/2.5,
		bottomSurf	: -canvas.height/2.5,
		startLoc		: 0,
		endLoc			: canvas.width,
	};
}

function getParticleIC_Poiseulle(canvas, bnd){
	class ParticleObj {
				constructor(){
					this.uz	= 1;
					this.ur	= 0;
					this.z		= 0;
					this.r		=	Math.floor( Math.random() * (Math.random() > 0.5 ? bnd.topSurf : bnd.bottomSurf) );
					this.screenTime = 0;
				}
				getUz(r, R, L){
					const delP = $("#pressure-range").val();
					const eta = 1;
					return delP * ( R*R - r*r ) / (4 * eta * L);
				}
				update(){
					this.uz = this.getUz(this.r, (bnd.topSurf - bnd.bottomSurf)/2, (bnd.endLoc - bnd.startLoc));
					this.r += this.ur;
					this.z += this.uz;
					this.screenTime++;
				}
				isOutdated(canvas){
						if(this.z > canvas.width || 
							this.z < 0 || 
							this.r >= canvas.height/2 || 
							this.r <= -canvas.height/2 ||
							this.screenTime > SCREEN_TIME_LIMIT)
								return true;
						return false;
				}
				drawParticle(ctx){
					ctx.moveTo(this.z, this.r);
					ctx.arc(this.z, this.r, 1, 0, Math.PI * 2, true)
				}
	};
	let pObj = new ParticleObj();
	return pObj;
}

function drawPoiseulle(){
	let {ctx, canvas} = getCtxCanvas();
	const bnd = getBoundary_Poiseulle(canvas);

	createTrail(ctx, canvas);
	drawCartesianAxes(ctx, canvas);
	drawSurfaces(ctx, bnd);
	updateParticleInfo(canvas, bnd, getParticleIC_Poiseulle);
	removeOutdatedParticles(canvas);
	drawParticles(ctx);
}

/* 222########################################################## */
/************  All Couette specific functions ***************/
/* 1. runCouette
 * 2. getBoundary_Couette
 * 3. getParticleIC_Couette
 * 4. drawCouette
 */

function runCouette(){
	module = "couette";
	init();
	let {ctx, canvas} = getCtxCanvas();
	ctx.save();
	ctx.transform(1, 0, 0, -1, 0, canvas.height);
	intervId = setInterval(drawCouette, 1000 / FPS);
}

function getBoundary_Couette(canvas){
	const h = canvas.height;
	const bot_h = h/10;
	const top_h = h - bot_h;
	return {
		type 			: "lines",
		topSurf		:	top_h,
		bottomSurf: bot_h,
		startLoc	: 0,
		endLoc		: canvas.width,
	}
}

function getParticleIC_Couette(canvas, bnd){
	class ParticleObj {
				constructor(){
					this.ux	= 1;
					this.uy	= 0;
					this.x		= 0;
					this.y		=	bnd.bottomSurf + Math.floor( Math.random() * (bnd.topSurf - bnd.bottomSurf) );
					this.screenTime = 0;
				}
				getUx(y, h){
					const U = 10;
					return U*y/h;
				}
				update(){
					this.ux = this.getUx(this.y, (bnd.topSurf - bnd.bottomSurf));
					this.x += this.ux;
					this.y += this.uy;
					this.screenTime++;
				}
				isOutdated(canvas){
					if(	this.x > canvas.width || 
						this.x < 0 || 
						this.screenTime > SCREEN_TIME_LIMIT)
							return true;
					return false;
				}
				drawParticle(ctx){
					ctx.moveTo(this.x, this.y);
					ctx.arc(this.x, this.y, 1, 0, Math.PI * 2, true)
				}
				
	};
	let pObj = new ParticleObj();
	return pObj;
}

function drawCouette(){
	let {ctx, canvas} = getCtxCanvas();
	const bnd = getBoundary_Couette(canvas);
	createTrail(ctx, canvas);
	drawCartesianAxes(ctx, canvas);
	drawSurfaces(ctx, bnd);
	updateParticleInfo(canvas, bnd, getParticleIC_Couette);
	removeOutdatedParticles(canvas);
	drawParticles(ctx);
}

/* 333########################################################## */
/************  All Rotating Cylinders Flow rpecific functions ***************/
/* 1. runRotatingCylindersFlow
 * 2. getBoundary_RotatingCylindersFlow
 * 3. getParticleIC_RotatingCylindersFlow
 * 4. drawRotatingCylindersFlow
 */

function runRotatingCylindersFlow(){
	module = "rotating_cylinders_flow";
	init();
	let {ctx, canvas} = getCtxCanvas();
	ctx.save();
	ctx.transform(1, 0, 0, -1, canvas.width/2, canvas.height/2);
	intervId = setInterval(drawRotatingCylindersFlow, 1000 / FPS);
}

function getBoundary_RotatingCylindersFlow(canvas){
	return {
		type			: "circles",
		topSurf		:	Math.min(canvas.height, canvas.width)/2 * 0.8, // outer circle radius
		bottomSurf: Math.min(canvas.height, canvas.width)/2 * 0.3, // inner circle radius
		startLoc	: 0, // angle start in deg
		endLoc		: 2 * Math.PI, // angle end in deg
	}
}

function getParticleIC_RotatingCylindersFlow(canvas, bnd){
	class ParticleObj {
				constructor(){
					this.ur	= 0;
					this.ut	= 0;
					this.uz = 0;
					this.r		= bnd.bottomSurf + Math.floor( Math.random() * (bnd.topSurf - bnd.bottomSurf) );
					this.t		=	0;
					this.z 		= 0;
					this.screenTime = 0;
				}
				getUt(ri, ro, r){
					const omega = 0.01 * $("#pressure-range").val();
					return omega * ri * ( ro/ri  - r/ro )/( ro/ri - ri/ro);
				}
				update(){
					this.ur = 0;
					this.ut = this.getUt(bnd.bottomSurf, bnd.topSurf, this.r);
					this.uz = 0;

					this.r += this.ur;
					this.t += this.ut;
					this.z += this.uz;
					this.screenTime++;
				}
				isOutdated(canvas){
					if(	this.r > bnd.topSurf || 
						this.r < bnd.bottomSurf) //|| 
//						this.screenTime > SCREEN_TIME_LIMIT)
							return true;
					return false;
				}
				drawParticle(ctx){
//					ctx.moveTo(this.x, this.y);
//					ctx.moveTo(this.r * Math.cos( this.t ) , this.r * Math.sin( this.t );
					ctx.arc(this.r * Math.cos(this.t) , this.r * Math.sin(this.t), 1, 0, Math.PI * 2, true)
				}
				
	};
	let pObj = new ParticleObj();
	return pObj;
}
function drawRotatingCylindersFlow(){
	let {ctx, canvas} = getCtxCanvas();
	const bnd = getBoundary_RotatingCylindersFlow(canvas);
	createTrail(ctx, canvas);
	drawCartesianAxes(ctx, canvas);
	drawSurfaces(ctx, bnd);
	updateParticleInfo(canvas, bnd, getParticleIC_RotatingCylindersFlow);
	removeOutdatedParticles(canvas);
	drawParticles(ctx);
}
