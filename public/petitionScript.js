console.log("Hello Worlds");

(function () {
    let can = document.getElementById("can");
    let outerBox = document.getElementById("outer-box");

    let context = can.getContext("2d");
    let boxCtx = outerBox.getContext("2d");

    function drawSticky() {
        context.beginPath();
        context.strokeStyle = "black";
        context.lineWidth = 3;
        context.moveTo(250, 200);
        context.lineTo(250, 400);
        // sagt dem programm das es eine Linie ziehen soll
        context.stroke();

        // Leg Right
        context.beginPath();
        // (moveTo Anfang , lineTo ende)
        context.moveTo(250, 400);
        context.lineTo(325, 500);
        context.stroke();

        // Leg Left
        context.beginPath();
        context.moveTo(250, 400);
        context.lineTo(175, 500);
        context.stroke();

        // Arm Right
        context.beginPath();
        context.moveTo(250, 250);
        context.lineTo(325, 175);
        context.stroke();

        // Arm Left
        context.beginPath();
        context.moveTo(250, 250);
        context.lineTo(175, 175);
        context.stroke();

        // Head

        context.beginPath();
        context.fillStyle = "black";
        context.arc(250, 150, 50, 0, 2 * Math.PI);
        // context.fill();
        context.stroke();
    }
    drawSticky();

    boxCtx.drawImage(can, 0, 0, can.width, can.height);
    let newX = 0;
    let newY = 0;

    document.addEventListener("keydown", function (event) {
        // Key Event Up
        if (event.keyCode === 38) {
            newY -= 5;
            boxCtx.clearRect(0, 0, can.width, can.height);
            boxCtx.drawImage(can, newX, newY, can.width, can.height);
        }
        // Key Down Event
        else if (event.keyCode === 40) {
            newY += 5;
            boxCtx.clearRect(0, 0, can.width, can.height);
            boxCtx.drawImage(can, newX, newY, can.width, can.height);
        }
        // Key Right
        else if (event.keyCode === 39) {
            newX += 5;
            boxCtx.clearRect(0, 0, can.width, can.height);
            boxCtx.drawImage(can, newX, newY, can.width, can.height);
        }
        // Key Left
        else if (event.keyCode === 37) {
            newX -= 5;
            boxCtx.clearRect(0, 0, can.width, can.height);
            boxCtx.drawImage(can, newX, newY, can.width, can.height);
        }

        if (newX >= 175 || newX <= -175 || newY <= -95 || newY >= 100) {
            console.log("STOOOPPP");
            boxCtx.clearRect(0, 0, can.width, can.height);
        }
        // 500 width 600 height
        // männchen: 150 höhe
        // console.log(newX, newY);

        // X =175 Y -93
        // X -175 Y 100
    });
})();