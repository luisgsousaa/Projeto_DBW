function toggleBox(button) {
  const box = button.closest(".light-blue-box-background");
  const boxInfo = box.querySelector(".box-info");

  if (boxInfo.style.display === "none" || boxInfo.style.display === "") {
    boxInfo.style.display = "block";
    box.classList.remove("hidden");
    button.classList.remove("closed");
    button.classList.add("open");
    button.classList.add("rotated");
  } else {
    boxInfo.style.display = "none";
    box.classList.add("hidden");
    button.classList.remove("open");
    button.classList.remove("rotated");
    button.classList.add("closed");
  }
}
