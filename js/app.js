// ==========================================
// MingPian v2.5.3
// 1. 자동회전(EXIF)
// 2. 업로드
// 3. 명함목록
// 4. 사진 크게보기
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
// 자동 회전
//========================

async function fixImageRotation(file){

    return new Promise((resolve)=>{

        EXIF.getData(file,function(){

            const orientation =
                EXIF.getTag(this,"Orientation") || 1;

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
                        break;

                    case 7:
                        ctx.rotate(0.5*Math.PI);
                        ctx.translate(width,-height);
                        ctx.scale(-1,1);
                        break;

                    case 8:
                        ctx.rotate(-0.5*Math.PI);
                        ctx.translate(-width,0);
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
// 업로드
//========================

uploadBtn.onclick=()=>cameraInput.click();

cameraInput.onchange=async(e)=>{

    const originalFile=e.target.files[0];

    if(!originalFile) return;

    const file=await fixImageRotation(originalFile);

    preview.src=URL.createObjectURL(file);
    preview.style.display="block";

    const fileName=`${Date.now()}.jpg`;

    const {error:uploadError}=
        await supabaseClient.storage
        .from("mingpin")
        .upload(fileName,file);

    if(uploadError){
        alert(uploadError.message);
        return;
    }

    const {error:dbError}=
        await supabaseClient
        .from("business_cards")
        .insert([
            {
                image_file:fileName
            }
        ]);

    if(dbError){
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

            <div class="card shadow-sm">

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
// 사진 크게 보기
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
