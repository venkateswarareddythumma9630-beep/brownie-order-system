const productId = new URLSearchParams(window.location.search)
    .get("product") || "brownie-cake";

const products = {
    "brownie-cake": {
        name: "Brownie Cake",
        unitPrice: 100,
        unitLabel: "piece"
    },
    "walnut-brownie-delight": {
        name: "Walnut Brownie Delight",
        unitPrice: 499,
        unitLabel: "500 g cake"
    }
};

const selectedProduct = products[productId];

if (!selectedProduct) {
    document.querySelector("#message").textContent =
        "Invalid product selected. Please return to our products page.";

    document.querySelector("#submitBtn").disabled = true;

    throw new Error("Unknown product: " + productId);
}

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
        config = {
            ...c,
            productName: selectedProduct.name,
            unitPrice: productId === "brownie-cake"
                ? Number(c.unitPrice)
                : selectedProduct.unitPrice
        };

        document.querySelector("#brand").textContent =
            config.productName + " Orders";

        document.querySelector("#unitPrice").textContent =
            money(config.unitPrice);

        document.querySelector("#quantityLabel").textContent =
            productId === "walnut-brownie-delight"
                ? "Number of 500 g cakes *"
                : "Quantity *";

        document.querySelector("#priceLabel").textContent =
            productId === "walnut-brownie-delight"
                ? "Price per 500 g cake"
                : "Price per brownie cake";

        document.querySelector("#productWeightNote").textContent =
            productId === "walnut-brownie-delight"
                ? "Minimum order: 500 g. Each additional quantity adds another 500 g cake."
                : "";

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
        productId: productId,
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

        const trackingUrl = body.trackingToken
            ? new URL(
                `/tracking.html?token=${encodeURIComponent(body.trackingToken)}`,
                window.location.origin
            ).href
            : null;


        msg.className = "order-success";
        msg.replaceChildren();

        const successCard = document.createElement("div");
        successCard.className = "order-success-card";

        successCard.innerHTML = `
    <div class="order-success-icon" aria-hidden="true">✓</div>

    <h2>Order Placed Successfully!</h2>

    <p class="order-success-subtitle">
        Thank you for choosing Hamsa Brownies ❤️
    </p>

    <div class="order-success-details">
        <div class="order-success-row">
            <span>ORDER REFERENCE</span>
            <strong>#${reference}</strong>
        </div>

        <div class="order-success-row">
            <span>ESTIMATED TOTAL</span>
            <strong>${money(body.totalAmount)}</strong>
        </div>

        <div class="order-success-row">
            <span>CURRENT STATUS</span>
            <span class="order-success-status">
                Waiting for Confirmation
            </span>
        </div>
    </div>

    <p class="order-success-note">
        Your order will be confirmed after payment verification.
    </p>
`;


        if (trackingUrl) {
            const note = successCard.querySelector(".order-success-note");

            // Open the customer's private tracking page.
            const trackingButton = document.createElement("a");
            trackingButton.href = trackingUrl;
            trackingButton.className = "order-success-track";
            trackingButton.textContent = "Track Your Brownie Journey →";

            // Let the customer save their tracking link in WhatsApp.
            const saveWhatsAppButton = document.createElement("a");

            const saveMessage =
                `Hi! This is my Hamsa Brownies order tracking link ❤️\n\n` +
                `Order reference: #${reference}\n` +
                `Track my brownie:\n${trackingUrl}\n\n` +
                `I can use this link to check my order status anytime.`;

            saveWhatsAppButton.href =
                `https://wa.me/${customerWhatsApp}?text=${encodeURIComponent(saveMessage)}`;

            saveWhatsAppButton.target = "_blank";
            saveWhatsAppButton.rel = "noopener noreferrer";
            saveWhatsAppButton.className = "order-success-whatsapp";
            saveWhatsAppButton.textContent = "Save Tracking Link to WhatsApp";

            const saveNote = document.createElement("p");
            saveNote.className = "order-success-save-note";
            saveNote.textContent =
                "WhatsApp will open with your tracking link. Tap Send to save it in your chat.";

            note.before(trackingButton, saveWhatsAppButton, saveNote);
        }

        msg.appendChild(successCard);
        msg.scrollIntoView({ behavior: "smooth", block: "center" });



        const text =
            `Hi! I submitted an order at Hamsa Brownies.\n` +
            `Order reference: #${reference}\n` +
            `Product: ${body.productName}\n` +
            `Name: ${body.customerName}\n` +
            `Quantity: ${body.quantity}\n` +
            `Estimated total: ${money(body.totalAmount)}\n` +
            `Please confirm payment and delivery.\n\n` +
            (trackingUrl
                ? `My brownie tracking link:\n${trackingUrl}`
                : "");


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
