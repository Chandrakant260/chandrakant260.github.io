const cart = {};

let menu = [];

const MENU_API =
    "https://script.google.com/macros/s/AKfycbwUxERWkcbCexjpy0lz95zdyHlvCgRhwShcj_PFgXleTfVVinbT7wiaQUa_cU8YiqoXBA/exec";

const PACKAGING_CHARGE = 15;
const DELIVERY_CHARGE = 30;

const isMobile = () => window.innerWidth <= 900;

loadMenu();

document
    .getElementById("deliveryType")
    .addEventListener("change", () => {
        syncDeliveryType("desktop");
        refreshCart();
    });

document
    .getElementById("mobileDeliveryType")
    .addEventListener("change", () => {
        syncDeliveryType("mobile");
        refreshCart();
    });

document
    .getElementById("searchBox")
    .addEventListener("input", renderMenu);

document
    .getElementById("mobileOverlay")
    .addEventListener("click", (e) => {
        if (e.target.id === "mobileOverlay") {
            closeMobileCheckout();
        }
    });

async function loadMenu() {

    const container =
        document.getElementById("menu-container");

    container.innerHTML =
        "<p>Loading menu...</p>";

    try {

        const response =
            await fetch(MENU_API + "?t=" + Date.now());

        if (!response.ok) {
            throw new Error("HTTP " + response.status);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error("Invalid menu data");
        }

        menu = data.filter(item =>
            item.active === true ||
            item.active === "TRUE"
        );

        renderMenu();
        renderCategories();
        refreshCart();

    } catch (e) {

        console.error("Menu load failed:", e);

        container.innerHTML =
            "<p>Unable to load menu. Please refresh the page.</p>";
    }
}

let activeCategory = "All";

function renderCategories() {

    const container =
        document.getElementById("categories");

    const categories = [
        "All",
        ...new Set(menu.map(item => item.category).filter(Boolean))
    ];

    container.innerHTML = "";

    categories.forEach(category => {

        const btn =
            document.createElement("button");

        btn.className =
            "category-btn" +
            (category === activeCategory ? " active" : "");

        btn.textContent = category;

        btn.addEventListener("click", () => {
            activeCategory = category;
            renderCategories();
            renderMenu();
        });

        container.appendChild(btn);
    });
}

function renderMenu() {

    const container =
        document.getElementById("menu-container");

    const keyword =
        document
            .getElementById("searchBox")
            .value
            .toLowerCase();

    const filtered =
        menu.filter(item => {

            const matchesSearch =
                item.name
                    .toLowerCase()
                    .includes(keyword);

            const matchesCategory =
                activeCategory === "All" ||
                item.category === activeCategory;

            return matchesSearch && matchesCategory;
        });

    container.innerHTML = "";

    if (filtered.length === 0) {
        container.innerHTML =
            "<p>No dishes found.</p>";
        return;
    }

    filtered.forEach(item => {

        const card =
            document.createElement("div");

        card.className = "food-card";

        const imageHtml = item.image
            ? `<img src="${item.image}" alt="${item.name}">`
            : "";

        const qty = cart[item.id] || 0;

        const cartBadge = qty > 0
            ? `<span class="cart-badge">${qty} in cart</span>`
            : "";

        const actionBtn = qty > 0
            ? `<div class="card-actions">
                <button type="button" class="qty-btn" onclick="decreaseQty(${item.id})">−</button>
                <span class="qty-count">${qty}</span>
                <button type="button" class="qty-btn" onclick="increaseQty(${item.id})">+</button>
               </div>`
            : `<button type="button" onclick="addToCart(${item.id})">Add To Cart</button>`;

        card.innerHTML = `
            ${imageHtml}
            <div class="food-info">
                <h3>${item.name} ${cartBadge}</h3>
                <p>₹${item.price}</p>
                ${actionBtn}
            </div>
        `;

        container.appendChild(card);
    });
}

function addToCart(id) {

    cart[id] = (cart[id] || 0) + 1;

    refreshCart();

    if (isMobile()) {
        document.getElementById("mobileCartBar")
            .classList.remove("is-empty");
    }
}

function increaseQty(id) {

    cart[id]++;

    refreshCart();
}

function decreaseQty(id) {

    cart[id]--;

    if (cart[id] <= 0) {
        delete cart[id];
    }

    refreshCart();
}

function buildCartHtml() {

    let html = "";
    let subtotal = 0;
    let totalItems = 0;

    const ids = Object.keys(cart);

    if (ids.length === 0) {
        return {
            html: '<div class="empty-cart">Cart is empty</div>',
            subtotal: 0,
            totalItems: 0
        };
    }

    ids.forEach(id => {

        const item =
            menu.find(m => m.id == id);

        const qty = cart[id];

        subtotal += qty * Number(item.price);
        totalItems += qty;

        html += `
            <div class="cart-item">
                <div>
                    <strong>${item.name}</strong>
                    <div style="color:#888;font-size:0.8rem;margin-top:2px">
                        ₹${item.price} each
                    </div>
                </div>
                <div class="cart-qty-controls">
                    <button type="button" onclick="decreaseQty(${id})">−</button>
                    <span>${qty}</span>
                    <button type="button" onclick="increaseQty(${id})">+</button>
                </div>
            </div>
        `;
    });

    return { html, subtotal, totalItems };
}

function syncDeliveryType(source) {

    const desktop =
        document.getElementById("deliveryType");

    const mobile =
        document.getElementById("mobileDeliveryType");

    if (source === "mobile") {
        desktop.value = mobile.value;
    } else {
        mobile.value = desktop.value;
    }

    toggleAddressFields();
}

function toggleAddressFields() {

    const isDelivery =
        document.getElementById("deliveryType").value
            === "delivery";

    const hint = isDelivery
        ? "Required for delivery orders"
        : "Optional for pickup — use if you want to share location";

    ["addressGroup", "mobileAddressGroup"].forEach(id => {
        const group = document.getElementById(id);
        if (!group) return;

        const label = group.querySelector("label");
        if (label) {
            label.innerHTML = isDelivery
                ? 'Delivery Address <span class="required-tag">required</span>'
                : 'Delivery Address <span class="optional-tag">optional</span>';
        }

        const hintEl = group.querySelector(".address-hint");
        if (hintEl) hintEl.textContent = hint;
    });
}

function refreshCart() {

    const { html, subtotal, totalItems } =
        buildCartHtml();

    document.getElementById("cart-items").innerHTML = html;
    document.getElementById("mobile-cart-items").innerHTML = html;

    const pageCart =
        document.getElementById("page-cart-items");

    if (pageCart) {
        pageCart.innerHTML = html;
    }

    const pageFooter =
        document.getElementById("pageCartFooter");

    if (pageFooter) {
        pageFooter.hidden = totalItems === 0;
    }

    const pageCount =
        document.getElementById("pageCartCount");

    const pageTotal =
        document.getElementById("pageCartTotal");

    if (pageCount) pageCount.innerText = totalItems;

    if (pageTotal) {
        const deliveryType =
            document.getElementById("deliveryType").value;

        const packaging =
            subtotal > 0 ? PACKAGING_CHARGE : 0;

        const delivery =
            deliveryType === "delivery" && subtotal > 0
                ? DELIVERY_CHARGE
                : 0;

        pageTotal.innerText =
            subtotal + packaging + delivery;
    }

    renderMenu();

    const deliveryType =
        document.getElementById("deliveryType").value;

    const packaging =
        subtotal > 0 ? PACKAGING_CHARGE : 0;

    const delivery =
        deliveryType === "delivery" && subtotal > 0
            ? DELIVERY_CHARGE
            : 0;

    const total =
        subtotal + packaging + delivery;

    const amounts = {
        subtotal,
        packaging,
        delivery,
        total
    };

    Object.entries(amounts).forEach(([key, val]) => {
        const el = document.getElementById(key);
        if (el) el.innerText = val;
    });

    document.getElementById("mobileSubtotal").innerText = subtotal;
    document.getElementById("mobilePackaging").innerText = packaging;
    document.getElementById("mobileDelivery").innerText = delivery;
    document.getElementById("mobileTotal").innerText = total;
    document.getElementById("mobileFooterTotal").innerText = total;

    document.getElementById("mobileTotalItems").innerText = totalItems;
    document.getElementById("mobileTotalPrice").innerText = total;

    const cartBar =
        document.getElementById("mobileCartBar");

    if (totalItems === 0) {
        cartBar.classList.add("is-empty");
        cartBar.querySelector(".cart-bar-cta").textContent =
            "Add items to order";
    } else {
        cartBar.classList.remove("is-empty");
        cartBar.querySelector(".cart-bar-cta").textContent =
            "View Cart →";
    }

    toggleAddressFields();
}

function openMobileCheckout() {

    if (Object.keys(cart).length === 0) return;

    document.getElementById("mobileOverlay").hidden = false;
    document.body.classList.add("drawer-open");
}

function closeMobileCheckout() {

    document.getElementById("mobileOverlay").hidden = true;
    document.body.classList.remove("drawer-open");
}

function getCustomerDetails(fromMobile) {

    if (fromMobile) {
        return {
            name: document.getElementById("mobileCustomerName").value.trim(),
            mobile: document.getElementById("mobileCustomerMobile").value.trim(),
            address: document.getElementById("mobileCustomerAddress").value.trim(),
            description: document.getElementById("mobileCustomerDescription").value.trim()
        };
    }

    return {
        name: document.getElementById("customerName").value.trim(),
        mobile: document.getElementById("customerMobile").value.trim(),
        address: document.getElementById("customerAddress").value.trim(),
        description: document.getElementById("customerDescription").value.trim()
    };
}

function placeOrder(fromMobile = false) {

    if (Object.keys(cart).length === 0) {
        alert("Please add items to your cart first.");
        return;
    }

    const customer = getCustomerDetails(fromMobile || isMobile());

    if (!customer.name) {
        alert("Please enter your name.");
        return;
    }

    if (!customer.mobile || customer.mobile.length < 10) {
        alert("Please enter a valid 10-digit mobile number.");
        return;
    }

    const isDelivery =
        document.getElementById("deliveryType").value === "delivery";

    if (isDelivery && !customer.address) {
        alert("Please enter your delivery address or use current location.");
        return;
    }

    const subtotal = document.getElementById("subtotal").innerText;
    const packaging = document.getElementById("packaging").innerText;
    const delivery = document.getElementById("delivery").innerText;
    const total = document.getElementById("total").innerText;

    let message = "🍱 *SOULFUL MEALS*%0A%0A";
    message += `👤 ${customer.name}%0A`;
    message += `📱 ${customer.mobile}%0A`;

    if (isDelivery) {
        message += `📍 ${customer.address}%0A`;
    } else {
        message += `🛍️ Pickup Order%0A`;
    }

    message += "%0A*ORDER ITEMS*%0A";

    Object.keys(cart).forEach(id => {
        const item = menu.find(m => m.id == id);
        message += `• ${item.name} x ${cart[id]}%0A`;
    });

    message += `%0ASubtotal: ₹${subtotal}`;
    message += `%0APackaging: ₹${packaging}`;
    message += `%0ADelivery: ₹${delivery}`;
    message += `%0A%0A💰 *TOTAL: ₹${total}*`;

    if (customer.description) {
        message += `%0A%0A📝 ${customer.description}`;
    }

    window.open(
        `https://wa.me/917870309736?text=${message}`,
        "_blank"
    );
}

function getCurrentLocation(fromMobile = false) {

    if (!navigator.geolocation) {
        setLocationStatus(
            "Location is not supported on this device.",
            "error",
            fromMobile
        );
        return;
    }

    const btnIds = fromMobile
        ? ["mobileLocationBtn", "pageLocationBtn"]
        : ["locationBtn"];

    const btns = btnIds
        .map(id => document.getElementById(id))
        .filter(Boolean);

    btns.forEach(b => { b.disabled = true; });

    setLocationStatus(
        "Fetching your location...",
        "",
        fromMobile
    );

    navigator.geolocation.getCurrentPosition(

        (position) => {

            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const mapsLink =
                `https://maps.google.com/?q=${lat},${lng}`;

            applyLocationToAddressFields(mapsLink);

            setLocationStatus(
                "Location added! You can still type your full address above.",
                "success",
                fromMobile
            );

            btns.forEach(b => { b.disabled = false; });
        },

        (error) => {

            let msg = "Could not get location. Please type your address.";

            if (error.code === 1) {
                msg = "Location access denied. Please allow location or type your address.";
            }

            setLocationStatus(msg, "error", fromMobile);
            btns.forEach(b => { b.disabled = false; });
        },

        { enableHighAccuracy: true, timeout: 10000 }
    );
}

function applyLocationToAddressFields(mapsLink) {

    const fields = [
        document.getElementById("customerAddress"),
        document.getElementById("mobileCustomerAddress")
    ].filter(Boolean);

    fields.forEach(field => {
        const existing = field.value.trim();
        field.value = existing
            ? `${existing}\n\n📍 Location: ${mapsLink}`
            : `📍 Location: ${mapsLink}`;
    });
}

function setLocationStatus(text, type, fromMobile) {

    const ids = fromMobile
        ? ["mobileLocationStatus", "pageLocationStatus"]
        : ["locationStatus"];

    ids.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.textContent = text;
        el.className = "field-hint" + (type ? " " + type : "");
    });
}
