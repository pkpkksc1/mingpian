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
    const { error: uploadError } = await supabaseClient.storage
        .from("mingpin")
        .upload(fileName, file);

    if (uploadError) {
        console.error(uploadError);
        alert("사진 업로드 실패");
        return;
    }

    // Public URL 가져오기
    const { data: urlData } = supabaseClient.storage
        .from("mingpin")
        .getPublicUrl(fileName);

    const imageUrl = urlData.publicUrl;

    // DB 저장
    const { error: dbError } = await supabaseClient
        .from("business_cards")
        .insert([
            {
                company: "",
                phone: "",
                email: "",
                image_url: imageUrl,
                memo: ""
            }
        ]);

    if (dbError) {
        console.error(dbError);
        alert("DB 저장 실패");
        return;
    }

    alert("명함 등록 완료!");

});
