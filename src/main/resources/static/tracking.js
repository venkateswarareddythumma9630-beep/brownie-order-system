

const TRACKING_STAGES = [
    {
        status: "NEW",
        title: "New",
        message: "Waiting for payment confirmation"
    },
    {
        status: "PAYMENT_RECEIVED",
        title: "Payment Received",
        message: "Your payment has been received and verified! ❤️"
    },
    {
        status: "CONFIRMED",
        title: "Order Confirmed",
        message: "Your brownie order has been confirmed!"
    },
    {
        status: "PREPARING",
        title: "Preparing",
        message: "Baking your happiness!"
    },
    {
        status: "READY",
        title: "Ready",
        message: "Freshly baked and ready!"
    },
    {
        status: "OUT_FOR_DELIVERY",
        title: "Out for Delivery",
        message: "Your brownie is on the way!"
    },
    {
        status: "DELIVERED",
        title: "Delivered",
        message: "Delivered with love. Enjoy!"
    }
];


const trackingParams = new URLSearchParams(window.location.search);
const trackingToken = trackingParams.get("token");

let lastTrackingStatus = null;
let trackingTimer = null;

const trackingLoading = document.getElementById("trackingLoading");
const trackingError = document.getElementById("trackingError");
const trackingContent = document.getElementById("trackingContent");

function renderTracking(order) {
    const index = TRACKING_STAGES.findIndex(
        stage => stage.status === order.status
    );

    document.getElementById("trackingOrderNumber").textContent =
        order.orderNumber;

    document.getElementById("trackingProduct").textContent =
        `${order.productName} × ${order.quantity}`;

    document.getElementById("trackingCurrentStatus").textContent =
        order.status.replaceAll("_", " ");

    trackingLoading.hidden = true;
    trackingError.hidden = true;
    trackingContent.hidden = false;

    const cancelled = order.status === "CANCELLED";

    document.getElementById("trackingCancelled").hidden = !cancelled;
    document.getElementById("trackingJourney").hidden = cancelled;

    if (cancelled) {
        return;
    }

    if (index < 0) {
        throw new Error("Unknown order status");
    }

    const steps = document.getElementById("trackingSteps");
    steps.replaceChildren();

    TRACKING_STAGES.forEach((stage, i) => {
        const step = document.createElement("div");
        step.className = "tracking-step";

        if (i < index) step.classList.add("completed");
        if (i === index) step.classList.add("active");

        const rail = document.createElement("div");
        rail.className = "tracking-step-rail";

        const node = document.createElement("div");
        node.className = "tracking-node";

        if (i === index) {
            const img = document.createElement("img");
            img.src = "/images/hamsa-brownie-logo.png";
            img.alt = "Your brownie is here";
            img.className = "tracking-brownie";
            node.appendChild(img);
        } else if (i < index) {
            node.textContent = "✓";
        } else {
            node.textContent = String(i + 1);
        }

        rail.appendChild(node);

        if (i < TRACKING_STAGES.length - 1) {
            const line = document.createElement("div");
            line.className = "tracking-rail-line";
            rail.appendChild(line);
        }

        const info = document.createElement("div");
        info.className = "tracking-step-info";

        const heading = document.createElement("h3");
        heading.textContent = stage.title;

        const description = document.createElement("p");
        description.textContent =
            i === index ? stage.message :
                i < index ? "Completed" : "Upcoming";

        info.append(heading, description);
        step.append(rail, info);
        steps.appendChild(step);
    });

    const trackingMessage =
        document.getElementById("trackingMessage");

    if (order.status === "DELIVERED") {
        trackingMessage.textContent =
            "🎉 Journey Completed! Your brownie has been delivered. Enjoy every bite! ❤️";
    } else {
        trackingMessage.textContent =
            TRACKING_STAGES[index].message;
    }
}

async function refreshTracking() {
    try {
        const response = await fetch(
            `/api/track/${encodeURIComponent(trackingToken)}`,
            { cache: "no-store" }
        );

        if (!response.ok) {
            throw new Error(
                response.status === 404
                    ? "Tracking link not found."
                    : "Unable to load tracking information."
            );
        }

        const order = await response.json();

        if (order.status !== lastTrackingStatus) {
            renderTracking(order);
            lastTrackingStatus = order.status;
        }

        if (order.status === "DELIVERED" ||
            order.status === "CANCELLED") {
            clearInterval(trackingTimer);
        }
    } catch (error) {
        trackingLoading.hidden = true;
        trackingError.hidden = false;
        trackingError.textContent = error.message;
    }
}

if (!trackingToken) {
    trackingLoading.hidden = true;
    trackingError.hidden = false;
    trackingError.textContent =
        "Missing tracking link. Please use the link provided after ordering.";
} else {
    refreshTracking();
    trackingTimer = setInterval(refreshTracking, 10000);
}
