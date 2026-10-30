
document.addEventListener("DOMContentLoaded", () => {
    const pages = [
        { label: "Home", href: "/" },
        { label: "About Us", href: "/about.html" },
        { label: "Products", href: "/products.html" },
        { label: "Order Now", href: "/products.html" }
    ];

    const currentPath = window.location.pathname;
    const activePath =
        currentPath === "/index.html" ? "/" : currentPath;

    const nav = document.querySelector("#siteNavigation");

    if (nav) {
        const links = pages.map(page => {
            const active =
                page.label === "Order Now"
                    ? activePath === "/order.html"
                    : page.href === activePath;
            return `
        <a href="${page.href}"
           class="${active ? "active" : ""}"
           ${active ? 'aria-current="page"' : ""}>
          ${page.label}
        </a>
      `;
        }).join("");


        nav.innerHTML = `
  <a class="site-logo" href="/" aria-label="Hamsa Brownies Home">
  <img
    src="/images/hamsa-brownie-logo.png"
    alt=""
    class="brand-logo-img"
  >

  <span class="brand-text">
    <span class="brand-name-first">Hamsa ♡</span>
    <span class="brand-name-second">Brownies</span>
    <span class="brand-tagline">HOMEMADE WITH LOVE ♥</span>
  </span>
</a>

  <button
    type="button"
    class="menu-toggle"
    id="menuToggle"
    aria-label="Open navigation menu"
    aria-expanded="false"
    aria-controls="mobileNavigation">
    <span></span>
    <span></span>
    <span></span>
  </button>

  <div class="site-links" id="mobileNavigation">
    ${links}
  </div>
`;

        const menuToggle = document.querySelector("#menuToggle");
        const menuLinks = document.querySelector("#mobileNavigation");

        function closeMenu() {
            menuLinks.classList.remove("menu-open");
            menuToggle.setAttribute("aria-expanded", "false");
            menuToggle.setAttribute("aria-label", "Open navigation menu");
        }

        menuToggle.addEventListener("click", () => {
            const isOpen = menuLinks.classList.toggle("menu-open");

            menuToggle.setAttribute("aria-expanded", String(isOpen));
            menuToggle.setAttribute(
                "aria-label",
                isOpen ? "Close navigation menu" : "Open navigation menu"
            );
        });

        menuLinks.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", closeMenu);
        });

        document.addEventListener("keydown", event => {
            if (event.key === "Escape") {
                closeMenu();
            }
        });

    }

    const footer = document.querySelector("#siteFooter");

    if (footer) {
        footer.innerHTML = `
  <strong>Hamsa Brownies</strong>
  <p>Small Cakes. Big Happiness.</p>
  <p>© ${new Date().getFullYear()} Hamsa Brownies.
     All rights reserved.</p>
  <p>Designed by
     <strong>Venkateswara Reddy Thumma</strong>
  </p>
`;
    }

    // Floating WhatsApp button on customer pages
    const whatsappButton = document.createElement("a");

    whatsappButton.className = "floating-whatsapp";
    whatsappButton.id = "floatingWhatsApp";
    whatsappButton.target = "_blank";
    whatsappButton.rel = "noopener noreferrer";
    whatsappButton.setAttribute("aria-label", "Chat with us on WhatsApp");
    whatsappButton.title = "Chat with us on WhatsApp";

    whatsappButton.innerHTML = `
    <svg viewBox="0 0 32 32"
         width="29" height="29"
         fill="currentColor"
         aria-hidden="true">
      <path d="M16 .8A15.1 15.1 0 0 0 3 23.6L.9 31l7.6-2A15.2 15.2 0 1 0 16 .8zm0 27.6a12.4 12.4 0 0 1-6.3-1.7l-.5-.3-4.5 1.2 1.2-4.4-.3-.5A12.5 12.5 0 1 1 16 28.4zm6.9-9.3c-.4-.2-2.3-1.1-2.6-1.2-.4-.1-.6-.2-.9.2-.3.4-1 1.2-1.2 1.4-.2.2-.5.3-.9.1-.4-.2-1.6-.6-3.1-2-1.1-1-1.9-2.3-2.1-2.7-.2-.4 0-.6.2-.8l.6-.7.4-.6c.1-.2 0-.5 0-.7l-1.2-2.8c-.3-.7-.6-.6-.9-.6h-.8c-.3 0-.7.1-1.1.5s-1.4 1.4-1.4 3.4 1.5 4 1.7 2.1 4.8 5.1 6.8 6.2 1.5.7 2.7.6 3.7.4c1.1-.2 2.3-1 2.6-2 .3-.9.3-1.7.2-1.9-.1-.2-.4-.3-.8-.5z"/>
    </svg>
    <span class="floating-whatsapp-label">Chat with us</span>
  `;

    // Hide until the configured WhatsApp number is validated.
    whatsappButton.hidden = true;
    document.body.appendChild(whatsappButton);

    fetch("/api/config")
        .then(response => {
            if (!response.ok) {
                throw new Error("Unable to load WhatsApp configuration");
            }
            return response.json();
        })
        .then(config => {
            let number = String(config.whatsappNumber || "")
                .replace(/\D/g, "");

            // Normalize Indian mobile numbers to international format.
            if (/^[6-9]\d{9}$/.test(number)) {
                number = "91" + number;
            }

            if (!/^[1-9]\d{9,14}$/.test(number)) {
                return;
            }

            const message =
                "Hi! I'd like to know more about your Brownie Cake.";

            whatsappButton.href =
                `https://wa.me/${number}?text=${encodeURIComponent(message)}`;

            whatsappButton.hidden = false;
        })
        .catch(error => {
            console.warn("WhatsApp button unavailable:", error.message);
        });


    // Mobile sticky Order Now button
    // Hide on the order page because the customer is already ordering.
    const isOrderPage = window.location.pathname === "/order.html";

    if (!isOrderPage) {
        const stickyOrder = document.createElement("a");
        stickyOrder.href = "/products.html";
        stickyOrder.className = "mobile-sticky-order";
        stickyOrder.innerHTML = `
  <img
    src="/images/hamsa-brownie-logo.png"
    alt=""
    class="sticky-order-logo"
  >
  <span>Order Now</span>
`;
        stickyOrder.setAttribute("aria-label", "Choose a brownie to order");
        document.body.appendChild(stickyOrder);
    }

    // Back to Top button
    const backToTop = document.createElement("button");
    backToTop.type = "button";
    backToTop.className = "back-to-top";
    backToTop.textContent = "↑";
    backToTop.title = "Back to top";
    backToTop.setAttribute("aria-label", "Back to top");
    backToTop.hidden = true;

    document.body.appendChild(backToTop);

    function updateBackToTop() {
        backToTop.hidden = window.scrollY < 350;
    }

    window.addEventListener("scroll", updateBackToTop, {
        passive: true
    });

    updateBackToTop();

    backToTop.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: window.matchMedia(
                "(prefers-reduced-motion: reduce)"
            ).matches ? "instant" : "smooth"
        });
    });

});
