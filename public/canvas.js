(function () {
    let canvas = document.getElementById("canvas");
    let signatureInput = document.getElementById("hidden-input");
    let context = canvas.getContext("2d");

    let draw = false;
    canvas.onmouseup = () => {
        draw = false;
        let dataURL = canvas.toDataURL();
        signatureInput.value = dataURL;
    };
    canvas.onmousedown = () => {
        draw = true;
        // let dataURL = canvas.toDataURL();
        // signatureInput.value = dataURL;
    };
    canvas.onmousemove = (e) => {
        if (!draw) {
            return;
        }
        context.strokeStyle = "black";
        context.lineTo(e.offsetX, e.offsetY);
        context.stroke();
    };
})();
