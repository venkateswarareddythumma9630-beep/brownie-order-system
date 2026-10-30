
document.addEventListener("DOMContentLoaded", () => {
    const sections = document.querySelectorAll(".reveal");


    const feedbackLink = document.querySelector("#feedbackWhatsApp");

    if (feedbackLink) {
        feedbackLink.style.display = "none";

        fetch("/api/config")
            .then(response => {
                if (!response.ok) throw new Error("Configuration unavailable");
                return response.json();
            })
            .then(config => {
                const number = String(config.whatsappNumber || "")
                    .replace(/\D/g, "");

                if (number.length < 10 || number.length > 15) return;

                const message =
                    "Hi! I'd like to share my feedback about your Brownie Cake.";

                feedbackLink.href =
                    `https://wa.me/${number}?text=${encodeURIComponent(message)}`;

                feedbackLink.style.display = "inline-block";
            })
            .catch(() => {
                // Keep the feedback link hidden if configuration is unavailable.
            });
    }


    if (!sections.length) return;

    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reducedMotion || !("IntersectionObserver" in window)) {
        return;
    }

    const observer = new IntersectionObserver(
        (entries, observerInstance) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;

                entry.target.classList.add("visible");
                observerInstance.unobserve(entry.target);
            });
        },
        {
            threshold: 0.1,
            rootMargin: "0px 0px 40px 0px"
        }
    );

    sections.forEach(section => {
        const rect = section.getBoundingClientRect();

        // Sections already on screen should remain visible.
        if (rect.top < window.innerHeight) {
            section.classList.add("visible");
        }
    });

    document.body.classList.add("reveal-ready");

    sections.forEach(section => {
        if (!section.classList.contains("visible")) {
            observer.observe(section);
        }
    });
});
