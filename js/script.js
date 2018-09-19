// Variable initialisation
var canvas = document.querySelector( '#canvas' );
var context = canvas.getContext( '2d' );
var linePoints = [];
var toolMode = 'draw'
var toolSize = 5;
var toolColor = '#000000'
var canvasState = [];
var undoButton = document.querySelector( '[data-action=undo]' );

//Use this to determine what is being done (by default, it is line).
var currentFunction = 'brush';
/**
* The functions available (as strings):
* 'line' : To draw a line
* 'quads' : To create quadrilaterals
* 'brush' : To create brush strokes
*/

// Defaults
context.strokeStyle = "#000000";
context.lineWidth = 5;
// canvas.style.cursor = 'url( images/size'+toolSize+'.cur ), crosshair';
context.lineJoin = "round";
context.lineCap = "round";

// Event listeners
canvas.addEventListener( 'mousedown', draw );
canvas.addEventListener( 'touchstart', draw );
window.addEventListener( 'mouseup', stop );
window.addEventListener( 'touchend', stop );
// document.querySelector( '#tools' ).addEventListener( 'click', selectTool );
// document.querySelector( '#colors' ).addEventListener( 'click', selectTool );
window.addEventListener( 'resize', resizeCanvas );

//Functions
resizeCanvas();

function resizeCanvas() {
	canvas.width = canvas.clientWidth;
	canvas.height = canvas.clientHeight;
	if(canvasState.length) updateCanvas();
}

function clearCanvas() {
  var result = confirm( 'Are you sure you want to delete the picture?' );
  if ( result ) {
    context.clearRect( 0, 0, canvas.width, canvas.height );
    canvasState.length = 0;
    undoButton.classList.add( 'disabled' );
  }
}

/**
*	This function is different from clearCanvas() as it is only called after a
* certain amount of time has passed.
*
* timer set to a minute and 30 seconds
*/
function timeoutClearCanvas() {
		//use modal?
}

//Currently only doing for touch as we dont have to do it for mouse
var originX;
var originY;
var currentX;
var currentY;
function draw( e ) {

	//For a line, we want to check whether the line is the start of the function
	if((currentFunction === 'line' || currentFunction === 'quads') && e.type === 'touchstart'){
		//We want to keep the current origin
		originX = e.touches[0].pageX - canvas.offsetLeft;
		originY = e.touches[0].pageY - canvas.offsetTop;
	}

	//Use event listeners to keep drawing until the mouse/touch end
	window.addEventListener('touchmove', draw);

	//get the current positions and draw it out
	if (e.type === 'touchstart' || e.type === 'touchmove'){
		currentX = e.touches[0].pageX - canvas.offsetLeft;
		currentY = e.touches[0].pageY - canvas.offsetTop;
	}

	//Whenever we move it, we want to draw a line
	if( e.type === 'touchmove' && currentFunction == 'line'){
		//First calculate if they went left or right
		var angle = 0;
		if (currentX > originX){	//if current is right of origin
			//Calculate the angle
			var lineAB = Math.sqrt(Math.pow(originX-originX, 2) + Math.pow(originY-(originY + 1), 2));	//Might need to change this to minus
			var lineBC = Math.sqrt(Math.pow(originX-currentX, 2) + Math.pow(originY-currentY, 2));
			var lineAC = Math.sqrt(Math.pow(currentX-originX, 2) + Math.pow(currentY-(originY + 1), 2));

			angle = (Math.acos((lineBC*lineBC+lineAB*lineAB-lineAC*lineAC)/(2*lineBC*lineAB))*180)/Math.PI;
		} else {
			//Calculate the angle
			var lineAB = Math.sqrt(Math.pow(originX-currentX, 2) + Math.pow(originY-currentY, 2));
			var lineBC = Math.sqrt(Math.pow(originX-currentX, 2) + Math.pow(originY-(originY + 1), 2));
			var lineAC = Math.sqrt(Math.pow(originX-currentX, 2) + Math.pow((originY + 1)-currentY, 2));

			angle = (Math.acos((lineBC*lineBC+lineAB*lineAB-lineAC*lineAC)/(2*lineBC*lineAB))*180)/Math.PI;
		}

		//Now check if it is horizontal or vertical
		if(angle >= 45 && angle <= 135){	//This is a horizontal line
			//render straight line
			renderStraightLine('horizontal', originX, originY, currentX, currentY);
		}
		else{
			renderStraightLine('vertical', originX, originY, currentX, currentY);
		}
	}

	if (e.type === 'touchmove' && currentFunction === 'quads'){
		renderQuads();
	}

	if(currentFunction === 'brush'){
		var mouseDrag = e.type === 'touchmove';
		linePoints.push({x:currentX, y: currentY, drag: mouseDrag, width: toolSize + 20, color: toolColor } );
		renderLine();
	}
}

/**
*	Draws a straight line onto the canvas
*
* @param type: string either 'horizontal' or 'vertical'
*/
function renderStraightLine(type){
	context.beginPath();
	context.lineJoin = "round";
	context.lineCap = "round";
	context.strokeStyle = "black";
	context.moveTo (originX, originY);
	if (type === 'horizontal'){
		context.lineTo(currentX, originY);
	} else {
		context.lineTo(originX, currentY);
	}
	context.clearRect( 0, 0, canvas.width, canvas.height);

	if (canvasState.length > 0) updateCanvas();
	context.stroke();
}

/**
*	This function will render quadrilaterals
*/
function renderQuads(){
	context.beginPath();

	var r_width = currentX - originX;
	var r_height = currentY - originY;

	context.clearRect( 0, 0, canvas.width, canvas.height);
	context.rect(originX, originY, r_width, r_height);
	context.fillStyle = toolColor;
	if (canvasState.length > 0) updateCanvas();
	context.fill();
}


function highlightButton( button ) {
  var buttons = button.parentNode.querySelectorAll( 'img' );
  buttons.forEach( function( element ){ element.classList.remove( 'active' ) } );
  button.classList.add( 'active' );
}

function renderLine() {
	context.clearRect( 0, 0, canvas.width, canvas.height);
	if (canvasState.length > 0) updateCanvas();
  for ( var i = 0, length = linePoints.length; i < length; i++ ) {
    if ( !linePoints[i].drag ) {
      context.beginPath();
      context.lineWidth = linePoints[i].width;
	  	context.lineJoin = "round";
			context.lineCap = "round";
      context.strokeStyle = linePoints[i].color;
      context.moveTo( linePoints[i].x, linePoints[i].y );
      context.lineTo( linePoints[i].x + 0.5, linePoints[i].y + 0.5 );
    } else {
      context.lineTo( linePoints[i].x, linePoints[i].y );
    }
  }

  // if ( toolMode === 'erase' ) {
  //   context.globalCompositeOperation = 'destination-out';
  // } else {
  //   context.globalCompositeOperation = 'source-over';
  // }

  context.stroke();
}

function saveState() {
  canvasState.unshift( context.getImageData( 0, 0, canvas.width, canvas.height ) );
  linePoints = [];
  if ( canvasState.length > 25 ) canvasState.length = 25;
  //undoButton.classList.remove( 'disabled' );
}

function selectTool( e ) {
  if ( e.target === e.currentTarget ) return;
  if ( !e.target.dataset.action ) highlightButton( e.target );
  toolSize = e.target.dataset.size || toolSize;
  toolMode = e.target.dataset.mode || toolMode;
  toolColor = e.target.dataset.color || toolColor;
  canvas.style.cursor = 'url( images/size'+toolSize+'.cur ), crosshair';
  if ( e.target === undoButton ) undoState();
  if ( e.target.dataset.action == 'delete' ) clearCanvas();
}

function stop( e ) {
  if ( e.which === 1 || e.type === 'touchend' ) {
    window.removeEventListener( 'mousemove', draw );
 		window.removeEventListener( 'touchmove', draw );

		//If it is a line, we want to be saving the state only after they have finished making the line
		if (currentFunction === 'line' || currentFunction === 'quads' || currentFunction === 'brush'){
			saveState();
		}
  }

}

function undoState() {
  context.putImageData( canvasState.shift(), 0, 0 );
  if ( !canvasState.length ) undoButton.classList.add( 'disabled' );
}

function updateCanvas() {
  context.clearRect( 0, 0, canvas.width, canvas.height );
  context.putImageData( canvasState[ 0 ], 0, 0 );
  //renderLine();
}
