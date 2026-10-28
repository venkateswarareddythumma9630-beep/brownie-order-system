
let config = {
    productName: "Brownie Cake",
    unitPrice: 100,
    whatsappNumber: ""
};

const form = document.querySelector("#orderForm");
const qty = form.elements.quantity;

const money = n =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    }).format(n);

function waLink(text) {
    const number = String(config.whatsappNumber || "").replace(/\D/g, "");
    return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

function updateTotal() {
    document.querySelector("#total").textContent =
        money(Number(qty.value || 0) * Number(config.unitPrice));
}

function normalizeIndianMobile(value) {
    let phone = String(value || "").replace(/[\s()-]/g, "");

    // Accept +91XXXXXXXXXX or 91XXXXXXXXXX.
    if (phone.startsWith("+")) {
        phone = phone.substring(1);
    }

    if (/^91[6-9]\d{9}$/.test(phone)) {
        return phone;
    }

    // Accept a 10-digit Indian mobile number.
    if (/^[6-9]\d{9}$/.test(phone)) {
        return "91" + phone;
    }

    return null;
}

fetch("/api/config")
    .then(r => {
        if (!r.ok) throw new Error("Could not load configuration");
        return r.json();
    })
    .then(c => {
        config = c;

        document.querySelector("#brand").textContent =
            c.productName + " Orders";

        document.querySelector("#unitPrice").textContent =
            money(c.unitPrice);

        document.querySelector("#waTop").href =
            waLink("Hi! I'd like to order " + c.productName + ".");

        document.querySelector("#waBottom").href =
            waLink("Hi! I'd like to order " + c.productName + ".");

        updateTotal();
    })
    .catch(() => {
        document.querySelector("#unitPrice").textContent =
            money(config.unitPrice);
        updateTotal();
    });

qty.addEventListener("input", updateTotal);

form.addEventListener("submit", async e => {
    e.preventDefault();

    const btn = document.querySelector("#submitBtn");
    const msg = document.querySelector("#message");

    const formData = Object.fromEntries(new FormData(form));
    const customerWhatsApp = normalizeIndianMobile(formData.phone);

    if (!customerWhatsApp) {
        msg.className = "error";
        msg.textContent =
            "Enter a valid Indian mobile number starting with 6, 7, 8 or 9. Use a WhatsApp-enabled number.";
        form.elements.phone.focus();
        return;
    }

    // Open a blank tab immediately from the click action to reduce popup blocking.
    const whatsappTab = window.open("about:blank", "_blank");

    if (!whatsappTab) {
        msg.className = "error";
        msg.textContent =
            "Your browser blocked the WhatsApp tab. Allow pop-ups for this website and click Place order again.";
        return;
    }

    btn.disabled = true;
    msg.className = "";
    msg.textContent = "Saving your order…";

    const data = {
        ...formData,
        phone: customerWhatsApp,
        quantity: Number(formData.quantity)
    };

    try {
        const res = await fetch("/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        const body = await res.json();

        if (!res.ok) {
            throw new Error(
                body.message || "Please check your details and try again."
            );
        }

        const reference = `BR${String(body.id).padStart(5, "0")}`;

        msg.className = "success";
        msg.textContent =
            `Order saved! Reference #${reference}. Estimated total: ` +
            `${money(body.totalAmount)}. The bakery still needs to confirm your order.`;

        const text =
            `Hi! I submitted an order on your order page.\n` +
            `Order reference: #${reference}\n` +
            `Name: ${body.customerName}\n` +
            `Quantity: ${body.quantity}\n` +
            `Estimated total: ${money(body.totalAmount)}\n` +
            `Please confirm availability and delivery.`;

        const adminNumber = String(config.whatsappNumber || "").replace(/\D/g, "");

        if (adminNumber.length < 10 || adminNumber.length > 15) {
            whatsappTab.close();
            msg.textContent +=
                " However, the bakery's WhatsApp contact is not configured correctly.";
        } else {
            whatsappTab.location.href = waLink(text);
        }

        form.reset();
        qty.value = 1;
        updateTotal();

    } catch (err) {
        // The order was not confirmed as saved; don't leave a blank tab open.
        whatsappTab.close();

        msg.className = "error";
        msg.textContent =
            err.message || "Order could not be saved. Please try again.";
    } finally {
        btn.disabled = false;
    }
});
