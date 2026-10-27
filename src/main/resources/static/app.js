let config={productName:"Brownie Cake",unitPrice:100,whatsappNumber:"91XXXXXXXXXX"};
const form=document.querySelector("#orderForm"), qty=form.elements.quantity;
const money=n=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2}).format(n);
function waLink(text){const number=(config.whatsappNumber||"").replace(/\D/g,"");return `https://wa.me/${number}?text=${encodeURIComponent(text)}`}
function updateTotal(){document.querySelector("#total").textContent=money(Number(qty.value||0)*Number(config.unitPrice));}
fetch("/api/config").then(r=>r.json()).then(c=>{config=c;document.querySelector("#brand").textContent=c.productName+" Orders";document.querySelector("#unitPrice").textContent=money(c.unitPrice);document.querySelector("#waTop").href=waLink("Hi! I'd like to order "+c.productName+".");document.querySelector("#waBottom").href=waLink("Hi! I'd like to order "+c.productName+".");updateTotal()}).catch(()=>{document.querySelector("#unitPrice").textContent=money(config.unitPrice);updateTotal()});
qty.addEventListener("input",updateTotal);
form.addEventListener("submit",async e=>{e.preventDefault();const btn=document.querySelector("#submitBtn"),msg=document.querySelector("#message");btn.disabled=true;msg.textContent="Saving your order…";msg.className="";
const data=Object.fromEntries(new FormData(form));data.quantity=Number(data.quantity);
try{const res=await fetch("/api/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});const body=await res.json();if(!res.ok)throw new Error(body.message||"Please check your details and try again.");
msg.className="success";msg.innerHTML=`<strong>Order request saved! Reference #BR${String(body.id).padStart(5,"0")}</strong><br>Estimated total: ${money(body.totalAmount)}. The bakery still needs to confirm your order.`;
const text=`Hi! I submitted order #BR${String(body.id).padStart(5,"0")} on your order page.\nName: ${body.customerName}\nQuantity: ${body.quantity}\nEstimated total: ${money(body.totalAmount)}\nPlease confirm availability and delivery.`;
const number=(config.whatsappNumber||"").replace(/\D/g,"");if(number.length>=10){const a=document.createElement("a");a.className="whatsapp";a.target="_blank";a.rel="noopener";a.href=waLink(text);a.textContent="Send order reference on WhatsApp";msg.append(document.createElement("br"),document.createElement("br"),a)}
form.reset();qty.value=1;updateTotal();
}catch(err){msg.className="error";msg.textContent=err.message||"Order could not be saved. Please try again."}finally{btn.disabled=false}});
