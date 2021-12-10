console.log("Hello Worlds");

(function () {
    const signatureCan = document.getElementById("signature-can");
    const trySigAgain = document.getElementById("try-again");
    const submitBtn = document.getElementById("submit-btn");
    const signatureInput = document.getElementById("signature");

    let context = signatureCan.getContext("2d");
    let isDrawing = false;
    let x = 0;
    let y = 0;

    // FIXME: Aufräumen!!! Arrow Functions etc.
    signatureCan.addEventListener("mousedown", function (event) {
        x = event.offsetX;
        y = event.offsetY;
        isDrawing = true;
    });

    signatureCan.addEventListener("mousemove", function (event) {
        console.log("Event offset X", event.offsetX);
        if (isDrawing === true) {
            drawSignature(context, x, y, event.offsetX, event.offsetY);
            x = event.offsetX;
            y = event.offsetY;
        }
    });

    signatureCan.addEventListener("mouseup", function (event) {
        if (isDrawing === true) {
            drawSignature(context, x, y, event.offsetX, event.offsetY);
            x = 0;
            y = 0;
        }
        isDrawing = false;
    });

    trySigAgain.addEventListener("click", function () {
        console.log("try it again");
        context.clearRect(0, 0, signatureCan.width, signatureCan.height);
    });

    submitBtn.addEventListener("click", function () {
        signatureInput.value = signatureCan.toDataURL();
        console.log("signature Input Value: ", signatureInput.value);
    });

    function drawSignature(context, startX, startY, moveX, moveY) {
        context.beginPath();
        context.strokeStyle = "black";
        context.lineWidth = 2;
        context.moveTo(startX, startY);
        context.lineTo(moveX, moveY);
        context.stroke();
        context.closePath();
    }
})();
