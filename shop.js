/*
 * KONFIGURASI KAPUAIS
 * Isi harga produk sendiri pada bagian price (angka rupiah tanpa titik/koma).
 * Contoh: price: 5000 berarti Rp5.000 per kg.
 * Nomor WhatsApp: format internasional tanpa + atau spasi, contoh 62812xxxxxxx.
 */
const KAPUAIS_CONFIG = {
  whatsapp: "628979853653",
  products: [
    { id: "es-1kg", name: "Es Batu Kristal KapuAis 1 kg", category: "Kemasan", description: "Kemasan praktis untuk kebutuhan rumah, minuman, dan warung kecil.", unit: "pak", price: 5000, image: "images/produk-1kg.jpeg" },
    { id: "es-5kg", name: "Es Batu Kristal KapuAis 5 kg", category: "Kemasan", description: "Kemasan menengah untuk kedai minuman dan kebutuhan usaha harian.", unit: "pak", price: 20000, image: "images/produk-5kg.jpeg" },
    { id: "es-10kg", name: "Es Batu Kristal KapuAis 10 kg", category: "Kemasan", description: "Kemasan besar untuk kafe, restoran, dan kebutuhan pasokan usaha.", unit: "pak", price: 35000, image: "images/produk-10kg.jpeg" }
  ]
};
const CART_KEY = "kapuais_cart_v1";
const rupiah = value => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
const hasPrice = product => Number.isFinite(product.price) && product.price >= 0 && product.price !== null;
const priceLabel = product => hasPrice(product) ? `${rupiah(product.price)} / ${product.unit}` : `Harga ditentukan admin / ${product.unit}`;
function getCart() { try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); } catch { return []; } }
function saveCart(cart) { localStorage.setItem(CART_KEY, JSON.stringify(cart)); updateCartCount(); }
function productById(id) { return KAPUAIS_CONFIG.products.find(p => p.id === id); }
function updateCartCount() {
  const count = getCart().reduce((sum, item) => sum + item.qty, 0);
  document.querySelectorAll("[data-cart-count]").forEach(el => el.textContent = count);
}
function addToCart(id) {
  const product = productById(id); if (!product) return;
  const cart = getCart(); const item = cart.find(row => row.id === id);
  if (item) item.qty += 1; else cart.push({ id, qty: 1 });
  saveCart(cart);
  const status = document.getElementById("shopStatus");
  if (status) status.textContent = `${product.name} ditambahkan ke keranjang.`;
}
function changeQty(id, amount) {
  const cart = getCart(); const item = cart.find(row => row.id === id); if (!item) return;
  item.qty += amount; saveCart(cart.filter(row => row.qty > 0)); renderCart();
}
function removeItem(id) { saveCart(getCart().filter(row => row.id !== id)); renderCart(); }
function cartTotals() {
  const items = getCart().map(row => ({ ...row, product: productById(row.id) })).filter(row => row.product);
  const allPricesSet = items.every(row => hasPrice(row.product));
  const total = allPricesSet ? items.reduce((sum, row) => sum + row.product.price * row.qty, 0) : null;
  return { items, total, allPricesSet, count: items.reduce((sum, row) => sum + row.qty, 0) };
}
function renderCart() {
  const root = document.getElementById("cartItems"); if (!root) return;
  const { items, total, allPricesSet } = cartTotals();
  if (!items.length) {
    root.innerHTML = '<div class="empty-cart"><div class="empty-cart-icon">🧊</div><h2>Keranjang masih kosong</h2><p>Pilih produk yang kamu butuhkan terlebih dahulu.</p><a class="btn" href="store.html">Lihat Katalog</a></div>';
    document.getElementById("cartSummary").hidden = true; return;
  }
  root.innerHTML = items.map(row => `<article class="cart-item"><img class="product-placeholder small-placeholder" src="${row.product.image}" alt="${row.product.name}"><div class="cart-item-info"><h3>${row.product.name}</h3><p>${priceLabel(row.product)}</p><div class="quantity-control"><button type="button" aria-label="Kurangi jumlah" data-minus="${row.id}">−</button><span>${row.qty} kg</span><button type="button" aria-label="Tambah jumlah" data-plus="${row.id}">+</button><button type="button" class="remove-item" data-remove="${row.id}">Hapus</button></div></div><strong class="line-total">${hasPrice(row.product) ? rupiah(row.product.price * row.qty) : 'Harga dikonfirmasi admin'}</strong></article>`).join("");
  root.querySelectorAll("[data-minus]").forEach(btn => btn.addEventListener("click", () => changeQty(btn.dataset.minus, -1)));
  root.querySelectorAll("[data-plus]").forEach(btn => btn.addEventListener("click", () => changeQty(btn.dataset.plus, 1)));
  root.querySelectorAll("[data-remove]").forEach(btn => btn.addEventListener("click", () => removeItem(btn.dataset.remove)));
  document.getElementById("cartTotal").textContent = allPricesSet ? rupiah(total) : "Dikonfirmasi admin";
  const summaryNote = document.getElementById("cartPriceNote");
  if (summaryNote) summaryNote.textContent = allPricesSet ? "Ongkir akan dikonfirmasi admin." : "Harga produk dan ongkir akan dikonfirmasi admin sebelum pesanan dipastikan.";
  document.getElementById("cartSummary").hidden = false;
}
function renderCheckoutSummary() {
  const root = document.getElementById("checkoutItems"); if (!root) return;
  const { items, total, allPricesSet } = cartTotals();
  if (!items.length) { root.innerHTML = '<p>Keranjang kosong. <a href="store.html">Pilih produk dahulu.</a></p>'; const submit = document.querySelector('#checkoutForm button[type="submit"]'); if (submit) submit.disabled = true; return; }
  root.innerHTML = items.map(row => `<div class="summary-row"><span>${row.product.name} × ${row.qty} kg</span><strong>${hasPrice(row.product) ? rupiah(row.product.price * row.qty) : 'Konfirmasi admin'}</strong></div>`).join("") + `<div class="summary-row summary-total"><span>${allPricesSet ? "Subtotal" : "Subtotal"}</span><strong>${allPricesSet ? rupiah(total) : "Dikonfirmasi admin"}</strong></div><p class="form-help">Harga yang belum diisi dan biaya pengiriman akan dikonfirmasi admin.</p>`;
}
function sendOrderMessage(form) {
  const { items, total, allPricesSet } = cartTotals();
  if (!items.length) { alert("Keranjang masih kosong. Silakan pilih produk terlebih dahulu."); return; }
  const data = new FormData(form);
  const detail = items.map(row => `- ${row.product.name} x ${row.qty} kg: ${hasPrice(row.product) ? rupiah(row.product.price * row.qty) : "harga dikonfirmasi admin"}`).join("\n");
  const message = `Halo KapuAis, saya ingin melakukan pemesanan.\n\nNama: ${data.get("nama")}\nNama usaha: ${data.get("usaha") || "Tidak diisi"}\nNo. telepon: ${data.get("telepon")}\nAlamat pengiriman: ${data.get("alamat")}\n\nProduk:\n${detail}\n\nSubtotal: ${allPricesSet ? rupiah(total) : "Mohon konfirmasi harga produk"}\nOngkir: Mohon konfirmasi admin\nMetode pembayaran pilihan: ${data.get("pembayaran")}\nCatatan: ${data.get("catatan") || "-"}\n\nMohon konfirmasi ketersediaan produk, harga final, ongkir, dan instruksi pembayaran.`;
  if (KAPUAIS_CONFIG.whatsapp === "GANTI_DENGAN_NOMOR_BISNIS") {
    const status = document.getElementById("checkoutStatus");
    if (status) status.textContent = "Pesanan belum dikirim. Buka shop.js lalu ganti GANTI_DENGAN_NOMOR_BISNIS dengan nomor WhatsApp bisnis KapuAis.";
    return;
  }
  window.open(`https://wa.me/${KAPUAIS_CONFIG.whatsapp}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
}
document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  const catalog = document.getElementById("productCatalog");
  if (catalog) {
    catalog.innerHTML = KAPUAIS_CONFIG.products.map(p => `<article class="card product-card" data-category="${p.category.toLowerCase()}"><img class="product-placeholder product-image" src="${p.image}" alt="${p.name}"><div class="card-body"><span class="product-tag">Es batu · ${p.unit}</span><h3>${p.name}</h3><p>${p.description}</p><div class="product-buy-row"><strong class="product-price">${hasPrice(p) ? rupiah(p.price) : "Harga menyusul"} <small>/ ${p.unit}</small></strong><button class="btn" type="button" data-add="${p.id}">+ Keranjang</button></div></div></article>`).join("");
    catalog.querySelectorAll("[data-add]").forEach(btn => btn.addEventListener("click", () => addToCart(btn.dataset.add)));
    const search = document.getElementById("productSearch");
    if (search) search.addEventListener("input", () => {
      const term = search.value.toLowerCase().trim();
      catalog.querySelectorAll(".product-card").forEach(card => { card.hidden = !card.textContent.toLowerCase().includes(term); });
    });
  }
  renderCart(); renderCheckoutSummary();
  const form = document.getElementById("checkoutForm");
  if (form) form.addEventListener("submit", event => { event.preventDefault(); sendOrderMessage(form); });
});
