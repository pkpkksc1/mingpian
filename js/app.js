// MingPin v2.4

const uploadBtn = document.getElementById("uploadBtn");
const cameraInput = document.getElementById("cameraInput");
const preview = document.getElementById("preview");

const listBtn = document.querySelector(".btn-secondary");
const cards = document.getElementById("cards");


// ======================
// 업로드
// ======================

uploadBtn.addEventListener("click", () => {
    cameraInput.click();
});


cameraInput.addEventListener("change", async (event) => {

    const file = event.target.files[0];

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

    // Public URL
    const { data } =
        supabaseClient.storage
            .from("mingpin")
            .getPublicUrl(fileName);

    const imageUrl = data.publicUrl;

    // DB 저장
    const { error: dbError } =
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
            ]);

    if (dbError) {

        alert(dbError.message);
        return;
    }

    alert("명함 등록 완료!");

});



// ======================
// 명함 목록
// ======================

listBtn.addEventListener("click", async () => {

    cards.innerHTML =
        "<div class='text-center mt-3'>불러오는 중...</div>";

    const { data, error } =
        await supabaseClient
            .from("business_cards")
            .select("*")
            .order("id", { ascending:false });

    if(error){

        cards.innerHTML =
            "<div class='alert alert-danger'>목록을 불러올 수 없습니다.</div>";

        return;
    }

    cards.innerHTML = "";

    if(data.length==0){

        cards.innerHTML =
            "<div class='alert alert-secondary'>등록된 명함이 없습니다.</div>";

        return;
    }

    data.forEach(card=>{

        cards.innerHTML +=`

<div class="card mt-3 shadow">

<img
src="${card.image_url}"
class="card-img-top">

<div class="card-body">

<h5>${card.company || "회사명 없음"}</h5>

<p>📞 ${card.phone || "-"}</p>

<p>📧 ${card.email || "-"}</p>

<p class="text-muted">
${new Date(card.created_at).toLocaleString()}
</p>

</div>

</div>

`;

    });

});
