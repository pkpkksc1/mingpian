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

    return new Promise((resolve)=>{

        EXIF.getData(file,function(){

            const orientation =
                EXIF.getTag(this,"Orientation") || 1;
                console.log("Orientation =", orientation);

            const img = new Image();

            img.onload=()=>{

                const canvas=document.createElement("canvas");
                const ctx=canvas.getContext("2d");

                let width=img.width;
                let height=img.height;

                if([5,6,7,8].includes(orientation)){
                    canvas.width=height;
                    canvas.height=width;
                }else{
                    canvas.width=width;
                    canvas.height=height;
                }

                switch(orientation){

                    case 2:
                        ctx.translate(width,0);
                        ctx.scale(-1,1);
                        break;

                    case 3:
                        ctx.translate(width,height);
                        ctx.rotate(Math.PI);
                        break;

                    case 4:
                        ctx.translate(0,height);
                        ctx.scale(1,-1);
                        break;

                    case 5:
                        ctx.rotate(0.5*Math.PI);
                        ctx.scale(1,-1);
                        break;

                    case 6:
                        ctx.rotate(0.5*Math.PI);
                        ctx.translate(0,-height);
                        ctx.translate(canvas.width, 0);
                        ctx.rotate(Math.PI / 2);

                        break;

                    case 7:
                        ctx.rotate(0.5*Math.PI);
                        ctx.translate(width,-height);
                        ctx.scale(-1,1);
                        break;

                    case 8:
                        ctx.rotate(-0.5*Math.PI);
                        ctx.translate(-width,0);
                        ctx.translate(0, canvas.height);
                        ctx.rotate(-Math.PI / 2);

                        break;

                }
            
                ctx.drawImage(img,0,0);

                canvas.toBlob((blob)=>{

                    const newFile=new File(
                        [blob],
                        file.name,
                        {
                            type:"image/jpeg"
                        }
                    );

                    resolve(newFile);

                },"image/jpeg",0.95);

            };

            img.src=URL.createObjectURL(file);

        });

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
            class="btn btn-outline-danger btn-sm delete-card position-absolute"
            data-id="${card.id}"
            data-file="${card.image_file}"
            style="
                top:8px;
                right:8px;
                width:32px;
                height:32px;
                padding:0;
                border-radius:50%;
                z-index:100;
            ">

            🗑

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

    document.querySelectorAll(".delete-card").forEach(btn => {

        btn.onclick = () => {

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