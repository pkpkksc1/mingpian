// ==========================================
// MingPian v2.6
// Part 1 : 전역변수
// ==========================================

const uploadBtn = document.getElementById("uploadBtn");
const cameraInput = document.getElementById("cameraInput");
const preview = document.getElementById("preview");
const listBtn = document.getElementById("listBtn");
const cards = document.getElementById("cards");

// 사진 보기
const modalImage = document.getElementById("modalImage");
const imageModal = new bootstrap.Modal(
    document.getElementById("imageModal")
);

// 삭제 모달
const deleteModal = new bootstrap.Modal(
    document.getElementById("deleteModal")
);

const deleteBtn = document.getElementById("deleteBtn");

// 삭제할 데이터
let selectedId = null;
let selectedFile = null;
//========================
// Part 2
// 자동 회전(EXIF)
//========================

async function fixImageRotation(file){

    return new Promise((resolve,reject)=>{

        loadImage(
            file,
            function(canvas){

                if(!canvas){
                    resolve(file);
                    return;
                }

                canvas.toBlob((blob)=>{

                    resolve(new File(
                        [blob],
                        file.name,
                        {type:"image/jpeg"}
                    ));

                },"image/jpeg",0.95);

            },
            {
                canvas:true,
                orientation:true
            }
        );

    });

}

//========================
// Part 3
// 업로드
//========================

uploadBtn.onclick = () => {

    cameraInput.click();

};

cameraInput.onchange = async (e) => {

    const originalFile = e.target.files[0];

    if (!originalFile) return;

    const file = await fixImageRotation(originalFile);

    preview.src = URL.createObjectURL(file);
    preview.style.display = "block";

    const fileName = `${Date.now()}.jpg`;

    //----------------------------------
    // Storage 업로드
    //----------------------------------

    const { error: uploadError } =
        await supabaseClient.storage
            .from("mingpin")
            .upload(fileName, file);

    if (uploadError) {

        alert(uploadError.message);
        return;

    }

    //----------------------------------
    // DB 저장
    //----------------------------------

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

    cameraInput.value = "";

    loadCards();

};
//========================
// Part 4
// 명함 목록
//========================

listBtn.onclick = () => {

    loadCards();

};

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

    <div class="card shadow-sm position-relative">

        <button
            class="delete-card-btn"
            data-id="${card.id}"
            data-file="${card.image_file}"
            title="삭제">

            ⋮

        </button>

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
    bindDeleteEvents();

}
//========================
// Part 5
// 삭제 기능
//========================

function bindDeleteEvents() {

    document.querySelectorAll(".delete-card-btn").forEach(btn => {

        btn.onclick = () => {

            e.stopPropagation();

            alert("삭제 버튼 클릭");
        
            selectedId = btn.dataset.id;
            selectedFile = btn.dataset.file;

            deleteModal.show();

        };

    });

}

deleteBtn.onclick = async () => {

    if (!selectedId || !selectedFile) return;

    deleteBtn.disabled = true;
    deleteBtn.innerText = "삭제중...";

    //------------------------------------------------
    // Storage 삭제
    //------------------------------------------------

    const { error: storageError } =
        await supabaseClient.storage
            .from("mingpin")
            .remove([selectedFile]);

    if (storageError) {

        deleteBtn.disabled = false;
        deleteBtn.innerText = "삭제";

        alert(storageError.message);

        return;

    }

    //------------------------------------------------
    // DB 삭제
    //------------------------------------------------

    const { error: dbError } =
        await supabaseClient
            .from("business_cards")
            .delete()
            .eq("id", selectedId);

    if (dbError) {

        deleteBtn.disabled = false;
        deleteBtn.innerText = "삭제";

        alert(dbError.message);

        return;

    }

    deleteBtn.disabled = false;
    deleteBtn.innerText = "삭제";

    deleteModal.hide();

    selectedId = null;
    selectedFile = null;

    loadCards();

};
//========================
// Part 6
// 사진 크게보기
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