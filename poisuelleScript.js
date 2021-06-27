const numParticles = 120;
//const numParticles = 1;
let particleArr = []; // change this!
const FPS = 60;
const SCREEN_TIME_LIMIT = 500;
let intervId;

function runPoiseulle(){
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
function runCouette(){
	init();
	let {ctx, canvas} = getCtxCanvas();
	ctx.save();
	ctx.transform(1, 0, 0, -1, 0, canvas.height);
	intervId = setInterval(drawCouette, 1000 / FPS);
}

function init(){
	/* clear the animation stack frame every rerun */
	clearInterval(intervId);
	particleArr = [];

	const width 	= "500";
	const height 	= "500";
	removeAllCanvases();
	prependCanvasToFlowCanvasContainer(width, height);
	showAllSliders();
}

function getCtxCanvas(){
	const canvas = document.getElementById("flow-canvas");
	let ctx = canvas.getContext("2d");
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
	ctx.moveTo(1,1);
	ctx.lineTo(canvas.width, 1);

	/* y-axis */
	ctx.moveTo(1,-canvas.height);
	ctx.lineTo(1, +canvas.height);
	ctx.stroke();
	ctx.closePath();
	ctx.restore();
}

function getBoundary_Poiseulle(canvas){
	return {
		topSurf			: canvas.height/2.5,
		bottomSurf	: -canvas.height/2.5,
		startLoc		: 0,
		endLoc			: canvas.width,
	};
}

function getBoundary_Couette(canvas){
	const h = canvas.height;
	const bot_h = h/10;
	const top_h = h - bot_h;
	return {
		topSurf		:	top_h,
		bottomSurf: bot_h,
		startLoc	: 0,
		endLoc		: canvas.width,
	}
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
	};
	let pObj = new ParticleObj();
	return pObj;
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
	};
	let pObj = new ParticleObj();
	return pObj;
}

function createTrail(ctx, canvas){
	ctx.fillStyle = 'rgba(255, 255, 255, .10)';
	ctx.fillRect(0, -canvas.height, canvas.width, 2*canvas.height);
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

$(document).ready( () => {
	$("#pressure-range").change( () => {
		clearInterval(intervId);
		runPoiseulle();
	});
});

function removeOutdatedParticles(canvas){
	for( let i = 0; i < particleArr.length; i++){
		if(particleArr[i].hasOwnProperty('z')){
			if(particleArr[i].z > canvas.width || 
				particleArr[i].z < 0 || 
				particleArr[i].r >= canvas.height/2 || 
				particleArr[i].r <= -canvas.height/2 ||
				particleArr[i].screenTime > SCREEN_TIME_LIMIT){
					particleArr.splice(i,1);
					i--;
			}
		}
		else{
			if(	particleArr[i].x > canvas.width || 
					particleArr[i].x < 0 || 
					particleArr[i].screenTime > SCREEN_TIME_LIMIT){
					particleArr.splice(i,1);
					i--;
			}
		}
	}
}

function drawParticles(ctx){
	for(let i = 0; i < particleArr.length; i++){
		ctx.save();
			ctx.beginPath();
				ctx.fillStyle = "black";
				if (particleArr[i].hasOwnProperty('z')){
					ctx.moveTo(particleArr[i].z, particleArr[i].r);
					ctx.arc(particleArr[i].z, particleArr[i].r, 1, 0, Math.PI * 2, true)
				}
				else{
					ctx.moveTo(particleArr[i].x, particleArr[i].y);
					ctx.arc(particleArr[i].x, particleArr[i].y, 1, 0, Math.PI * 2, true)
				}
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
