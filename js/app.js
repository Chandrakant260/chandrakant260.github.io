const cart = {};

const PACKAGING_CHARGE = 15;
const DELIVERY_CHARGE = 30;

renderMenu();

document
    .getElementById("deliveryType")
    .addEventListener("change", refreshCart);

function renderMenu() {

    const container =
        document.getElementById("menu-container");

    menu.forEach(item => {

        const card =
            document.createElement("div");

        card.className = "food-card";

        card.innerHTML = `
            <img src="${item.image}" alt="${item.name}">

            <div class="food-info">
                <h3>${item.name}</h3>
                <p>₹${item.price}</p>
            </div>

            <button onclick="addToCart(${item.id})">
                Add
            </button>
        `;

        container.appendChild(card);
    });
}

function addToCart(id) {

    cart[id] = (cart[id] || 0) + 1;

    refreshCart();
}

function refreshCart() {

    const cartDiv =
        document.getElementById("cart-items");

    cartDiv.innerHTML = "";

    let subtotal = 0;
    let totalItems = 0;

    Object.keys(cart).forEach(id => {

        const item =
            menu.find(m => m.id == id);

        const qty = cart[id];

        totalItems += qty;
        subtotal += qty * item.price;

        cartDiv.innerHTML += `
            <div class="cart-item">
                <span>${item.name} x ${qty}</span>
                <span>₹${qty * item.price}</span>
            </div>
        `;
    });

    const packaging =
        subtotal > 0 ? PACKAGING_CHARGE : 0;

    const deliveryType =
        document.getElementById("deliveryType").value;

    const delivery =
        deliveryType === "delivery"
            ? DELIVERY_CHARGE
            : 0;

    const total =
        subtotal + packaging + delivery;

    document.getElementById("subtotal").innerText =
        subtotal;

    document.getElementById("packaging").innerText =
        packaging;

    document.getElementById("delivery").innerText =
        delivery;

    document.getElementById("total").innerText =
        total;

    document.getElementById("stickyTotal").innerText =
        total;

    document.getElementById("cartSummary").innerText =
        `${totalItems} Items`;

    const sticky =
        document.getElementById("stickyCart");

    if (totalItems > 0) {
        sticky.classList.remove("hidden");
    } else {
        sticky.classList.add("hidden");
    }
}

function placeOrder() {

    if (Object.keys(cart).length === 0) {
        alert("Please add items first");
        return;
    }

    const customerName =
        document.getElementById("customerName").value.trim();

    const customerMobile =
        document.getElementById("customerMobile").value.trim();

    const customerAddress =
        document.getElementById("customerAddress").value.trim();

    const customerDescription =
        document.getElementById("customerDescription").value.trim();

    if (!customerName || !customerMobile) {
        alert("Please enter Name and Mobile Number");
        return;
    }

    let message = `🍱 *NEW ORDER*%0A%0A`;

    message += `👤 *Customer* : ${customerName}%0A`;
    message += `📱 *Mobile* : ${customerMobile}%0A`;
    message += `📍 *Address* : ${customerAddress}%0A`;

    if (customerDescription) {
        message += `📝 *Instructions* : ${customerDescription}%0A`;
    }

    message += `%0A--------------------%0A`;
    message += `🛒 *ORDER ITEMS*%0A`;

    Object.keys(cart).forEach(id => {

        const item =
            menu.find(m => m.id == id);

        const qty =
            cart[id];

        message += `• ${item.name} x ${qty}%0A`;
    });

    const subtotal =
        document.getElementById("subtotal").innerText;

    const packaging =
        document.getElementById("packaging").innerText;

    const delivery =
        document.getElementById("delivery").innerText;

    const total =
        document.getElementById("total").innerText;

    message += `%0A--------------------%0A`;

    message += `Subtotal : ₹${subtotal}%0A`;
    message += `Packaging : ₹${packaging}%0A`;
    message += `Delivery : ₹${delivery}%0A`;

    message += `%0A💰 *Total : ₹${total}*`;

    const whatsappNumber =
        "917870309736";

    const url =
        `https://wa.me/${whatsappNumber}?text=${message}`;

    window.open(url, "_blank");
}

function getCurrentLocation() {
    navigator.geolocation.getCurrentPosition(position => {

        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        document.getElementById("customerAddress").value =
            `https://maps.google.com/?q=${lat},${lng}`;
    });
}