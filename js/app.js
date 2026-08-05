// MingPin v2.3.1

const uploadBtn = document.getElementById("uploadBtn");
const cameraInput = document.getElementById("cameraInput");
const preview = document.getElementById("preview");

uploadBtn.addEventListener("click", () => {
    cameraInput.click();
});

cameraInput.addEventListener("change", async (event) => {

    console.log("① change 시작");

    const file = event.target.files[0];

    if (!file) {
        alert("파일이 없습니다.");
        return;
    }

    console.log("② 파일 선택", file);

    // 미리보기
    preview.src = URL.createObjectURL(file);
    preview.style.display = "block";

    // 파일명 생성
    const fileName = `${Date.now()}.jpg`;

    console.log("③ Storage 업로드 시작");

    // Storage 업로드
    const { data: uploadData, error: uploadError } =
        await supabaseClient.storage
            .from("mingpin")
            .upload(fileName, file);

    if (uploadError) {

        console.error(uploadError);

        alert("Storage 오류 : " + uploadError.message);

        return;
    }

    console.log("④ Storage 성공", uploadData);

    // Public URL 생성
    const { data: urlData } =
        supabaseClient.storage
            .from("mingpin")
            .getPublicUrl(fileName);

    const imageUrl = urlData.publicUrl;

    console.log("⑤ Public URL", imageUrl);

    console.log("⑥ DB 저장 시작");

    const { data: dbData, error: dbError } =
        await supabaseClient
            .from("business_cards")
            .insert([
                {
                    company: "",
                    phone: "",
                    email: "",
                    image_url: imageUrl,
                    memo: ""
                }
            ])
            .select();

    if (dbError) {

        console.error(dbError);

        alert("DB 오류 : " + dbError.message);

        return;
    }

    console.log("⑦ DB 저장 성공", dbData);

    alert("명함 등록 완료!");

});
