// MingPian v2.5

const uploadBtn = document.getElementById("uploadBtn");
const cameraInput = document.getElementById("cameraInput");
const preview = document.getElementById("preview");
const listBtn = document.getElementById("listBtn");
const cards = document.getElementById("cards");

uploadBtn.onclick = () => cameraInput.click();

cameraInput.onchange = async (e) => {

    const file = e.target.files[0];
    if (!file) return;

    preview.src = URL.createObjectURL(file);
    preview.style.display = "block";

    const fileName = `${Date.now()}.jpg`;

    // Storage 업로드
    const { error: uploadError } =
        await supabaseClient.storage
            .from("mingpin")
            .upload(fileName, file);

    if (uploadError) {
        alert(uploadError.message);
        return;
    }

    // DB에는 파일명만 저장
    const { error: dbError } =
        await supabaseClient
            .from("business_cards")
            .insert([{
                image_file: fileName
            }]);

    if (dbError) {
        alert(dbError.message);
        return;
    }

    alert("명함 등록 완료!");
};



listBtn.onclick = async () => {

    const { data, error } =
        await supabaseClient
            .from("business_cards")
            .select("*")
            .order("id", { ascending: false });

    if (error) {
        alert(error.message);
        return;
    }

    cards.innerHTML = "";

    cards.className = "row g-3 mt-3";

    for (const card of data) {

        if (!card.image_file) continue;

        const { data: signedData, error: signedError } =
            await supabaseClient.storage
                .from("mingpin")
                .createSignedUrl(card.image_file, 3600);

        if (signedError) {
            console.log(signedError);
            continue;
        }

        cards.innerHTML += `
        <div class="col-md-4">

            <div class="card shadow">

                <img
                    src="${signedData.signedUrl}"
                    class="card-img-top"
                    style="height:280px;object-fit:contain;background:#f8f8f8;">

            </div>

        </div>
        `;
    }

};
