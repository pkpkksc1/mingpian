const uploadBtn = document.getElementById("uploadBtn");
const cameraInput = document.getElementById("cameraInput");
const preview = document.getElementById("preview");

uploadBtn.addEventListener("click", () => {
    cameraInput.click();
});

cameraInput.addEventListener("change", (event) => {

    const file = event.target.files[0];

    if (!file) return;

    preview.src = URL.createObjectURL(file);
    preview.style.display = "block";

    console.log("선택한 파일:", file.name);
    console.log("파일 크기:", file.size);

});
