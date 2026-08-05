// ==========================================
// MingPian v2.5.2
// 기능
// 1. 명함 업로드
// 2. 명함 목록
// 3. 사진 크게 보기
// ==========================================

const uploadBtn = document.getElementById("uploadBtn");
const cameraInput = document.getElementById("cameraInput");
const preview = document.getElementById("preview");
const listBtn = document.getElementById("listBtn");
const cards = document.getElementById("cards");

const modalImage = document.getElementById("modalImage");
const imageModal = new bootstrap.Modal(
    document.getElementById("imageModal")
);

//========================
// 업로드
//========================

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

    // DB 저장
    const { error: dbError } =
        await supabaseClient
            .from("business_cards")
            .insert([
                {
                    image_file: fileName
                }
            ]);

    if (dbError) {
        alert(dbError.message);
        return;
    }

    alert("명함 등록 완료!");

    loadCards();

};

//========================
// 명함 목록 버튼
//========================

listBtn.onclick = () => {

    loadCards();

};

//========================
// 목록 불러오기
//========================

async function loadCards() {

    cards.innerHTML = "";

    cards.className = "row g-4";

    const { data, error } =
        await supabaseClient
            .from("business_cards")
            .select("*")
            .order("id", { ascending: false });

    if (error) {
        alert(error.message);
        return;
    }

    for (const card of data) {

        if (!card.image_file) continue;

        const { data: signedData, error: signedError } =
            await supabaseClient.storage
                .from("mingpin")
                .createSignedUrl(card.image_file, 3600);

        if (signedError) continue;

        cards.innerHTML += `
        <div class="col-lg-4 col-md-6 col-12">

            <div class="card">

                <img
                    src="${signedData.signedUrl}"
                    class="card-img-top card-image"
                    data-url="${signedData.signedUrl}"
                    loading="lazy">

            </div>

        </div>
        `;

    }

    bindImageEvents();

}

//========================
// 사진 클릭
//========================

function bindImageEvents() {

    document.querySelectorAll(".card-image").forEach(img => {

        img.onclick = () => {

            modalImage.src = img.dataset.url;

            imageModal.show();

        };

    });

}

//========================
// 시작
//========================

loadCards();
