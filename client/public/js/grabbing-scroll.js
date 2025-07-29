/**
 * Permite scroll / rolar com grabbing
 */
function initializeGrabbingScroll() {
    const ele = document.querySelector(".grabbing-scroll-container");
    if (ele) {
        let pos = { x: 0, y: 0, left: 0, top: 0 };
        const onMouseDown = (e) => {
            pos = {
                left: ele.scrollLeft,
                top: ele.scrollTop,
                x: e.clientX,
                y: e.clientY,
            };
            ele.style.cursor = "grabbing";
            ele.style.userSelect = "none";
            e.preventDefault(); // previne que se arraste a imagem ou selecionar texto e q fique tudo bugado
            // chamada quando se move o rato
            const onMouseMove = (e) => {
                ele.scrollLeft = pos.left - (e.clientX - pos.x);
                ele.scrollTop = pos.top - (e.clientY - pos.y);
            };
            // chamada quando se solta o rato
            const onMouseUp = () => {
                ele.style.cursor = "grab";
                ele.style.userSelect = "";
                document.removeEventListener("mousemove", onMouseMove);
                document.removeEventListener("mouseup", onMouseUp);
            };

            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
        };
        ele.addEventListener("mousedown", onMouseDown);
    } else {
        console.error("Element with class 'grabbing-scroll-container' not found.");
    }
}




