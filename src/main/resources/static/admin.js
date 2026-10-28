
const statuses = [
    "NEW",
    "CONFIRMED",
    "PREPARING",
    "READY",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED"
];

const money = n =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    }).format(n);

const esc = s =>
    String(s ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[c]));

function createWhatsAppMessage(order, status) {
    const orderNumber = `#BR${String(order.id).padStart(5, "0")}`;
    const name = order.customerName;
    const product = "Brownie Cake";

    const messages = {
        NEW: `Hi ${name}! 😊 We have received your ${product} order ${orderNumber}. Thank you for ordering with us!`,
        CONFIRMED: `Hi ${name}! 😊 Your ${product} order ${orderNumber} is confirmed. Thank you for ordering with us!`,
        PREPARING: `Hi ${name}! 🍫 Your ${product} order ${orderNumber} is now being prepared. We'll keep you updated!`,
        READY: `Hi ${name}! 🎂 Your ${product} order ${orderNumber} is ready. Thank you!`,
        OUT_FOR_DELIVERY: `Hi ${name}! 🛵 Your ${product} order ${orderNumber} is on its way!`,
        DELIVERED: `Hi ${name}! ❤️ Your ${product} order ${orderNumber} has been delivered. Hope you enjoy it!`,
        CANCELLED: `Hi ${name}, your ${product} order ${orderNumber} has been cancelled. Please contact us if you have any questions.`
    };

    return messages[status] ||
        `Hi ${name}, the status of your order ${orderNumber} is now ${status.replaceAll("_", " ")}.`;
}

function openWhatsApp(order, status) {
    // WhatsApp expects the phone number in international format,
    // with digits only and the country code included.
    let phone = String(order.phone || "").replace(/\D/g, "");

    // Assumption: Indian numbers without a country code.
    if (phone.length === 10) {
        phone = "91" + phone;
    }

    if (phone.length < 8 || phone.length > 15) {
        alert("Invalid customer phone number. Please check the order details.");
        return;
    }

    const message = createWhatsAppMessage(order, status);
    const url =
        `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    // Open WhatsApp in a new tab so the dashboard remains open.
    window.open(url, "_blank", "noopener,noreferrer");
}

async function load() {
    const root = document.querySelector("#orders");

    try {
        const r = await fetch("/api/orders");
        if (!r.ok) throw new Error("Unable to load orders");

        const orders = await r.json();

        document.querySelector("#count").textContent = orders.length;
        document.querySelector("#qty").textContent =
            orders.reduce((s, o) => s + o.quantity, 0);

        document.querySelector("#active").textContent =
            orders.filter(o => !["DELIVERED", "CANCELLED"].includes(o.status)).length;

        document.querySelector("#revenue").textContent = money(
            orders
                .filter(o => o.status !== "CANCELLED")
                .reduce((s, o) => s + Number(o.totalAmount), 0)
        );

        if (!orders.length) {
            root.innerHTML = "<p>No orders yet. Submit a test order from the customer form.</p>";
            return;
        }

        root.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Qty / total</th>
              <th>Delivery address</th>
              <th>Notes</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${orders.map(o => `
              <tr>
                <td>
                  <strong>#BR${String(o.id).padStart(5, "0")}</strong><br>
                  <small>${new Date(o.createdAt).toLocaleString()}</small>
                </td>
                <td>
                  <strong>${esc(o.customerName)}</strong><br>
                  <a href="tel:${esc(o.phone)}">${esc(o.phone)}</a>
                </td>
                <td>
                  ${o.quantity} × ${money(o.unitPrice)}<br>
                  <strong>${money(o.totalAmount)}</strong>
                </td>
                <td><div class="details">${esc(o.address)}</div></td>
                <td><div class="details">${esc(o.notes || "—")}</div></td>
                <td>
                  <select class="status-select"
                    data-id="${o.id}"
                    aria-label="Status for order ${o.id}">
                    ${statuses.map(s => `
                      <option value="${s}" ${s === o.status ? "selected" : ""}>
                        ${s.replaceAll("_", " ")}
                      </option>
                    `).join("")}
                  </select>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;

        root.querySelectorAll("select[data-id]").forEach(sel => {
            sel.addEventListener("change", async () => {
                const order = orders.find(o => String(o.id) === sel.dataset.id);
                const newStatus = sel.value;

                // Open a blank tab immediately during the user's status-change action.
                // This helps prevent the browser from blocking the WhatsApp tab.
                const whatsappTab = window.open("about:blank", "_blank");

                if (!whatsappTab) {
                    alert("Your browser blocked the WhatsApp tab. Please allow pop-ups for localhost:8081 and try again.");
                }

                sel.disabled = true;

                try {
                    const res = await fetch(`/api/orders/${sel.dataset.id}/status`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: newStatus })
                    });

                    if (!res.ok) throw new Error("Could not update status");

                    // Update the local order object before refreshing the dashboard.
                    if (order) order.status = newStatus;

                    // Refresh first, then prepare the WhatsApp message.
                    await load();

                    if (whatsappTab && order) {
                        let phone = String(order.phone || "").replace(/\D/g, "");

                        // Assume Indian country code when a 10-digit number is entered.
                        if (phone.length === 10) {
                            phone = "91" + phone;
                        }

                        if (phone.length < 8 || phone.length > 15) {
                            whatsappTab.close();
                            alert("Invalid customer phone number. Please check the order details.");
                        } else {
                            const message = createWhatsAppMessage(order, newStatus);
                            const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
                            whatsappTab.location.href = url;
                        }
                    }
                } catch {
                    alert("Could not update status. Please refresh and try again.");
                    await load();
                }
            });
        });
    } catch (e) {
        root.innerHTML =
            "<p class='error'>Could not load orders. Check that the backend and database are running.</p>";
    }
}

document.querySelector("#refresh").addEventListener("click", load);
load();
setInterval(load, 5000);
