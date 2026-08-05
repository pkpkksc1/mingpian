const uploadBtn = document.getElementById("uploadBtn");
const cameraInput = document.getElementById("cameraInput");
const preview = document.getElementById("preview");

uploadBtn.addEventListener("click", () => {
    cameraInput.click();
});

cameraInput.addEventListener("change", async (event) => {

    const file = event.target.files[0];

    if (!file) return;

    // 미리보기
    preview.src = URL.createObjectURL(file);
    preview.style.display = "block";

    // 파일명 생성
    const fileName = `${Date.now()}.jpg`;

    // Storage 업로드
    const { data, error } = await supabaseClient.storage
        .from("mingpin")
        .upload(fileName, file);

    if (error) {
        alert("업로드 실패");
        console.error(error);
        return;
    }

    // Public URL 생성
    const { data: urlData } = supabaseClient.storage
        .from("mingpin")
        .getPublicUrl(fileName);

    console.log(urlData.publicUrl);

    alert("업로드 완료!");
});
