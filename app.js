const DB_NAME = "BusinessProductsDB";
const STORE_NAME = "products";

let db;
let products = [];
let currentImage = null;
let selectedProductId = null;
let deferredPrompt = null;


/* =====================================================
   SHORT SELECTOR
===================================================== */

const $ = (id) => document.getElementById(id);


/* =====================================================
   OPEN DATABASE
===================================================== */

function openDatabase() {

    return new Promise((resolve, reject) => {

        const request = indexedDB.open(DB_NAME, 1);

        request.onupgradeneeded = function (event) {

            const database = event.target.result;

            if (!database.objectStoreNames.contains(STORE_NAME)) {

                database.createObjectStore(
                    STORE_NAME,
                    {
                        keyPath: "id"
                    }
                );

            }

        };

        request.onsuccess = function (event) {

            db = event.target.result;

            resolve();

        };

        request.onerror = function () {

            reject(request.error);

        };

    });

}


/* =====================================================
   GET ALL PRODUCTS
===================================================== */

function getProducts() {

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                STORE_NAME,
                "readonly"
            );

        const store =
            transaction.objectStore(
                STORE_NAME
            );

        const request =
            store.getAll();

        request.onsuccess = function () {

            resolve(
                request.result || []
            );

        };

        request.onerror = function () {

            reject(request.error);

        };

    });

}


/* =====================================================
   SAVE PRODUCT
===================================================== */

function saveProduct(product) {

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                STORE_NAME,
                "readwrite"
            );

        const store =
            transaction.objectStore(
                STORE_NAME
            );

        const request =
            store.put(product);

        request.onsuccess = function () {

            resolve();

        };

        request.onerror = function () {

            reject(request.error);

        };

    });

}


/* =====================================================
   DELETE PRODUCT
===================================================== */

function deleteProductFromDB(id) {

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                STORE_NAME,
                "readwrite"
            );

        const store =
            transaction.objectStore(
                STORE_NAME
            );

        const request =
            store.delete(id);

        request.onsuccess = function () {

            resolve();

        };

        request.onerror = function () {

            reject(request.error);

        };

    });

}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHTML(value = "") {

    return String(value).replace(
        /[&<>"']/g,
        function (character) {

            const map = {

                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"

            };

            return map[character];

        }
    );

}


/* =====================================================
   FORMAT PRICE
===================================================== */

function formatPrice(value) {

    if (
        value === "" ||
        value === null ||
        value === undefined
    ) {

        return "—";

    }

    return "Rs. " +
        Number(value).toLocaleString(
            "en-LK",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );

}


/* =====================================================
   FORMAT STOCK
===================================================== */

function formatStock(value) {

    if (
        value === "" ||
        value === null ||
        value === undefined
    ) {

        return "—";

    }

    return Number(value).toLocaleString() +
        " Pcs";

}


/* =====================================================
   REFRESH PRODUCTS
===================================================== */

async function refreshProducts() {

    products =
        await getProducts();

    products.sort(
        function (a, b) {

            return String(a.code || "")
                .localeCompare(
                    String(b.code || "")
                );

        }
    );

    renderProducts();

}


/* =====================================================
   RENDER PRODUCTS
===================================================== */

function renderProducts() {

    const searchInput = $("searchInput");

    const search =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";

    const filtered =
        products.filter(
            function (product) {

                return String(
                    product.code || ""
                )
                    .toLowerCase()
                    .includes(search);

            }
        );


    /* PRODUCT COUNT */

    if ($("productCount")) {

        $("productCount").textContent =
            filtered.length +
            (
                filtered.length === 1
                    ? " item"
                    : " items"
            );

    }


    /* PRODUCT LIST */

    if (!$("productList")) {
        return;
    }


    $("productList").innerHTML =
        filtered.map(
            function (product) {

                const image =
                    product.image

                        ?

                    `
                    <div class="product-image">
                        <img
                            src="${product.image}"
                            alt="${escapeHTML(product.name || product.code || "Product")}"
                        >
                    </div>
                    `

                        :

                    `
                    <div class="product-image">
                        <div class="product-image-placeholder">
                            <span>📦</span>
                            <p>No image</p>
                        </div>
                    </div>
                    `;


                return `

                <article class="product-card">

                    ${image}

                    <div class="product-card-body">

                        <div class="product-top">

                            <div>

                                <div class="product-code">
                                    ${escapeHTML(product.code || "")}
                                </div>

                                <h3 class="product-name">
                                    ${escapeHTML(
                                        product.name ||
                                        "Product"
                                    )}
                                </h3>

                            </div>


                            <div class="product-price">

                                <small>PRICE</small>

                                <strong>
                                    ${formatPrice(product.price)}
                                </strong>

                            </div>

                        </div>


                        <div class="product-meta">

                            <div class="meta-item">

                                <span>SIZE</span>

                                <strong>
                                    ${escapeHTML(
                                        product.size || "—"
                                    )}
                                </strong>

                            </div>


                            <div class="meta-item">

                                <span>STOCK</span>

                                <strong>
                                    ${formatStock(product.stock)}
                                </strong>

                            </div>

                        </div>


                        <button
                            class="read-more-btn"
                            type="button"
                            onclick="showDetails('${product.id}')">

                            Read More

                            <span>→</span>

                        </button>

                    </div>

                </article>

                `;

            }
        )
        .join("");


    /* EMPTY STATE */

    if ($("emptyState")) {

        $("emptyState").style.display =
            filtered.length === 0
                ? "block"
                : "none";

    }


    /* CLEAR SEARCH BUTTON */

    if ($("clearSearch")) {

        $("clearSearch").style.display =
            search.length > 0
                ? "block"
                : "none";

    }

}


/* =====================================================
   OPEN ADD / EDIT FORM
===================================================== */

function openForm(product = null) {

    const modal = $("productModal");

    if (!modal) {
        return;
    }


    modal.classList.add("active");


    $("modalTitle").textContent =
        product
            ? "Edit Product"
            : "Add Product";


    $("productCode").value =
        product?.code || "";


    $("productName").value =
        product?.name || "";


    $("productSize").value =
        product?.size || "";


    $("productStock").value =
        product?.stock ?? "";


    $("productPrice").value =
        product?.price ?? "";


    $("productDescription").value =
        product?.description || "";


    selectedProductId =
        product?.id || null;


    currentImage =
        product?.image || null;


    renderImagePreview();

}


/* =====================================================
   CLOSE FORM
===================================================== */

function closeForm() {

    const modal = $("productModal");

    if (!modal) {
        return;
    }

    modal.classList.remove("active");

}


/* =====================================================
   RENDER IMAGE PREVIEW
===================================================== */

function renderImagePreview() {

    const preview = $("imagePreview");

    if (!preview) {
        return;
    }


    if (currentImage) {

        preview.innerHTML = `
            <img
                src="${currentImage}"
                alt="Product Preview"
            >
        `;

    } else {

        preview.innerHTML = `

            <div class="upload-placeholder">

                <span>＋</span>

                <p>Add Product Image</p>

                <small>
                    Tap to choose from phone
                </small>

            </div>

        `;

    }

}


/* =====================================================
   EDIT PRODUCT
===================================================== */

function editProduct(id) {

    const product =
        products.find(
            function (item) {

                return item.id === id;

            }
        );


    if (product) {

        openForm(product);

    }

}


/* =====================================================
   DELETE PRODUCT
===================================================== */

async function deleteProduct(id) {

    const product =
        products.find(
            function (item) {

                return item.id === id;

            }
        );


    if (!product) {
        return;
    }


    const confirmed =
        confirm(
            `Delete product "${product.code}"?`
        );


    if (!confirmed) {
        return;
    }


    await deleteProductFromDB(id);


    if (
        selectedProductId === id
    ) {

        selectedProductId = null;

    }


    closeDetails();

    await refreshProducts();

}


/* =====================================================
   SHOW DETAILS
===================================================== */

function showDetails(id) {

    const product =
        products.find(
            function (item) {

                return item.id === id;

            }
        );


    if (!product) {
        return;
    }


    selectedProductId = id;


    /* IMAGE */

    if ($("detailsImage")) {

        if (product.image) {

            $("detailsImage").innerHTML = `

                <img
                    src="${product.image}"
                    alt="${escapeHTML(
                        product.name ||
                        product.code ||
                        "Product"
                    )}"
                >

            `;

        } else {

            $("detailsImage").innerHTML = `

                <div class="product-image-placeholder">

                    <span>📦</span>

                    <p>No image available</p>

                </div>

            `;

        }

    }


    /* CODE */

    $("detailsCode").textContent =
        product.code || "—";


    /* NAME */

    $("detailsName").textContent =
        product.name ||
        "Product";


    /* SIZE */

    $("detailsSize").textContent =
        product.size ||
        "—";


    /* STOCK */

    $("detailsStock").textContent =
        formatStock(product.stock);


    /* PRICE */

    $("detailsPrice").textContent =
        formatPrice(product.price);


    /* DESCRIPTION */

    $("detailsDescription").textContent =
        product.description ||
        "No description available.";


    /* SHOW MODAL */

    $("detailsModal").classList.add(
        "active"
    );

}


/* =====================================================
   CLOSE DETAILS
===================================================== */

function closeDetails() {

    const modal =
        $("detailsModal");

    if (!modal) {
        return;
    }

    modal.classList.remove(
        "active"
    );

}


/* =====================================================
   SAVE PRODUCT FORM
===================================================== */

$("productForm").addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const code =
            $("productCode")
                .value
                .trim();


        const name =
            $("productName")
                .value
                .trim();


        if (!code) {

            alert(
                "Please enter a product code."
            );

            return;

        }


        const id =
            selectedProductId ||
            crypto.randomUUID();


        /* CHECK DUPLICATE CODE */

        const duplicate =
            products.find(
                function (product) {

                    return (

                        String(
                            product.code || ""
                        )
                            .toLowerCase() ===
                        code.toLowerCase()

                    )
                    &&
                    product.id !== id;

                }
            );


        if (duplicate) {

            alert(
                "This product code already exists."
            );

            return;

        }


        /* CREATE PRODUCT */

        const product = {

            id: id,

            code: code,

            name: name,

            size:
                $("productSize")
                    .value
                    .trim(),

            price:
                $("productPrice")
                    .value,

            stock:
                $("productStock")
                    .value,

            description:
                $("productDescription")
                    .value
                    .trim(),

            image:
                currentImage,

            updatedAt:
                Date.now()

        };


        await saveProduct(product);


        closeForm();


        selectedProductId = null;


        await refreshProducts();

    }
);


/* =====================================================
   ADD PRODUCT BUTTON
===================================================== */

if ($("addProductBtn")) {

    $("addProductBtn").addEventListener(
        "click",
        function () {

            openForm();

        }
    );

}


/* =====================================================
   EMPTY STATE ADD BUTTON
===================================================== */

if ($("emptyAddBtn")) {

    $("emptyAddBtn").addEventListener(
        "click",
        function () {

            openForm();

        }
    );

}


/* =====================================================
   CLOSE FORM BUTTON
===================================================== */

if ($("closeModal")) {

    $("closeModal").addEventListener(
        "click",
        function () {

            closeForm();

        }
    );

}


/* =====================================================
   FORM OVERLAY CLOSE
===================================================== */

const productModal =
    $("productModal");

if (productModal) {

    const overlay =
        productModal.querySelector(
            ".modal-overlay"
        );

    if (overlay) {

        overlay.addEventListener(
            "click",
            function () {

                closeForm();

            }
        );

    }

}


/* =====================================================
   CLOSE DETAILS BUTTON
===================================================== */

if ($("closeDetails")) {

    $("closeDetails").addEventListener(
        "click",
        function () {

            closeDetails();

        }
    );

}


/* =====================================================
   DETAILS OVERLAY CLOSE
===================================================== */

const detailsModal =
    $("detailsModal");

if (detailsModal) {

    const overlay =
        detailsModal.querySelector(
            ".modal-overlay"
        );

    if (overlay) {

        overlay.addEventListener(
            "click",
            function () {

                closeDetails();

            }
        );

    }

}


/* =====================================================
   EDIT FROM DETAILS
===================================================== */

if ($("editProductBtn")) {

    $("editProductBtn").addEventListener(
        "click",
        function () {

            if (!selectedProductId) {
                return;
            }


            const product =
                products.find(
                    function (item) {

                        return (
                            item.id ===
                            selectedProductId
                        );

                    }
                );


            if (product) {

                closeDetails();

                openForm(product);

            }

        }
    );

}


/* =====================================================
   DELETE FROM DETAILS
===================================================== */

if ($("deleteProductBtn")) {

    $("deleteProductBtn").addEventListener(
        "click",
        async function () {

            if (!selectedProductId) {
                return;
            }


            await deleteProduct(
                selectedProductId
            );

        }
    );

}


/* =====================================================
   SEARCH
===================================================== */

if ($("searchInput")) {

    $("searchInput").addEventListener(
        "input",
        function () {

            renderProducts();

        }
    );

}


/* =====================================================
   CLEAR SEARCH
===================================================== */

if ($("clearSearch")) {

    $("clearSearch").addEventListener(
        "click",
        function () {

            $("searchInput").value = "";

            renderProducts();

            $("searchInput").focus();

        }
    );

}


/* =====================================================
   CHOOSE IMAGE
===================================================== */

if ($("chooseImageBtn")) {

    $("chooseImageBtn").addEventListener(
        "click",
        function () {

            $("productImage").click();

        }
    );

}


/* =====================================================
   IMAGE PREVIEW CLICK
===================================================== */

if ($("imagePreview")) {

    $("imagePreview").addEventListener(
        "click",
        function () {

            $("productImage").click();

        }
    );

}


/* =====================================================
   IMAGE SELECT
===================================================== */

if ($("productImage")) {

    $("productImage").addEventListener(
        "change",
        function (event) {

            const file =
                event.target.files[0];


            if (!file) {
                return;
            }


            /* CHECK IMAGE */

            if (!file.type.startsWith("image/")) {

                alert(
                    "Please choose an image file."
                );

                return;

            }


            const reader =
                new FileReader();


            reader.onload =
                function () {

                    currentImage =
                        reader.result;


                    renderImagePreview();

                };


            reader.readAsDataURL(file);

        }
    );

}


/* =====================================================
   PWA INSTALL
===================================================== */

window.addEventListener(
    "beforeinstallprompt",
    function (event) {

        event.preventDefault();

        deferredPrompt = event;


        const installBtn =
            $("installBtn");


        if (installBtn) {

            installBtn.style.display =
                "block";

        }

    }
);


/* =====================================================
   INSTALL BUTTON
===================================================== */

if ($("installBtn")) {

    $("installBtn").addEventListener(
        "click",
        async function () {

            if (!deferredPrompt) {
                return;
            }


            deferredPrompt.prompt();


            await deferredPrompt.userChoice;


            deferredPrompt = null;


            $("installBtn").style.display =
                "none";

        }
    );

}


/* =====================================================
   SERVICE WORKER
===================================================== */

if ("serviceWorker" in navigator) {

    window.addEventListener(
        "load",
        function () {

            navigator.serviceWorker
                .register("sw.js")
                .catch(
                    function (error) {

                        console.error(
                            "Service Worker error:",
                            error
                        );

                    }
                );

        }
    );

}


/* =====================================================
   START APP
===================================================== */

openDatabase()
    .then(
        function () {

            return refreshProducts();

        }
    )
    .catch(
        function (error) {

            console.error(error);

            alert(
                "Unable to open local storage."
            );

        }
    );