(function () {
    const signatureCan = document.getElementById("signature-can");
    const trySigAgain = document.getElementById("try-again");
    const submitBtn = document.getElementById("submit-btn");
    const signatureInput = document.getElementById("signature");

    console.log("navigator touch points: ",navigator.maxTouchPoints);

    let context = signatureCan.getContext("2d");
    let isDrawing = false;
    let x = 0;
    let y = 0;

    signatureCan.addEventListener("mousedown", (event) => {
        x = event.offsetX;
        y = event.offsetY;
        isDrawing = true;
    });

    signatureCan.addEventListener("mousemove", (event) => {
        // console.log("Event offset X", event.offsetX);
        if (isDrawing === true) {
            drawSignature(context, x, y, event.offsetX, event.offsetY);
            x = event.offsetX;
            y = event.offsetY;
        }
    });

    signatureCan.addEventListener("mouseup", (event) => {
        if (isDrawing === true) {
            drawSignature(context, x, y, event.offsetX, event.offsetY);
            x = 0;
            y = 0;
        }
        signatureInput.value = signatureCan.toDataURL();
        isDrawing = false;
    });

    trySigAgain.addEventListener("click", () => {
        // console.log("try it again");
        context.clearRect(0, 0, signatureCan.width, signatureCan.height);
    });

    function drawSignature(context, startX, startY, moveX, moveY) {
        context.beginPath();
        context.strokeStyle = "black";
        context.lineWidth = 1;
        context.moveTo(startX, startY);
        context.lineTo(moveX, moveY);
        context.stroke();
        context.closePath();
    }
})();
