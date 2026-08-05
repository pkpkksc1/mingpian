// MingPin v2.4.1

const uploadBtn=document.getElementById("uploadBtn");
const cameraInput=document.getElementById("cameraInput");
const preview=document.getElementById("preview");
const listBtn=document.getElementById("listBtn");
const cards=document.getElementById("cards");

uploadBtn.onclick=()=>cameraInput.click();

cameraInput.onchange=async(e)=>{
 const file=e.target.files[0];
 if(!file)return;

 preview.src=URL.createObjectURL(file);
 preview.style.display="block";

 const fileName=`${Date.now()}.jpg`;

 const {error:uploadError}=await supabaseClient.storage
 .from("mingpin")
 .upload(fileName,file);

 if(uploadError){
  alert("Storage 오류 : "+uploadError.message);
  return;
 }

 const {data:urlData}=supabaseClient.storage
 .from("mingpin")
 .getPublicUrl(fileName);

 const {error:dbError}=await supabaseClient
 .from("business_cards")
 .insert([{
  company:"",
  phone:"",
  email:"",
  image_url:urlData.publicUrl,
  memo:""
 }]);

 if(dbError){
  alert("DB 오류 : "+dbError.message);
  return;
 }

 alert("명함 등록 완료!");
};


listBtn.onclick=async()=>{

 const {data,error}=await supabaseClient
 .from("business_cards")
 .select("*")
 .order("id",{ascending:false});

 if(error){
  cards.innerHTML="목록 오류 : "+error.message;
  return;
 }

 cards.innerHTML="";

 data.forEach(card=>{

  cards.innerHTML+=`
  <div class="card mt-3 shadow">

   <img src="${card.image_url}"
    class="card-img-top"
    style="max-height:400px;object-fit:contain;background:#eee;"
    onerror="this.src='';this.alt='이미지 오류';">

   <div class="card-body">
    <h5>${card.company||"회사명 없음"}</h5>
    <p>📞 ${card.phone||"-"}</p>
    <p>📧 ${card.email||"-"}</p>
    <small>${new Date(card.created_at).toLocaleString()}</small>
   </div>

  </div>`;

 });

};
