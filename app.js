const DB_NAME = "BusinessProductsDB";

const STORE_NAME = "products";

let db;

let products = [];

let currentImage = null;

let deferredPrompt = null;


/* =========================
   SHORT SELECTOR
========================= */

const $ = (id) => document.getElementById(id);


/* =========================
   OPEN DATABASE
========================= */

function openDatabase() {

    return new Promise((resolve, reject) => {

        const request =
            indexedDB.open(DB_NAME, 1);


        request.onupgradeneeded = function (event) {

            const database =
                event.target.result;

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


/* =========================
   GET ALL PRODUCTS
========================= */

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


/* =========================
   SAVE PRODUCT
========================= */

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


/* =========================
   DELETE PRODUCT
========================= */

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


/* =========================
   ESCAPE HTML
========================= */

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


/* =========================
   PRICE
========================= */

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


/* =========================
   STOCK
========================= */

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


/* =========================
   REFRESH
========================= */

async function refreshProducts() {

    products =
        await getProducts();


    products.sort(
        function (a, b) {

            return a.code.localeCompare(
                b.code
            );

        }
    );


    renderProducts();

}


/* =========================
   RENDER PRODUCTS
========================= */

function renderProducts() {

    const search =
        $("searchInput")
            .value
            .trim()
            .toLowerCase();


    const filtered =
        products.filter(
            function (product) {

                return product.code
                    .toLowerCase()
                    .includes(search);

            }
        );


    $("productList").innerHTML =
        filtered.map(
            function (product) {

                const image =
                    product.image

                        ?

                    `
                    <img
                        class="product-image"
                        src="${product.image}"
                        alt="Product">
                    `

                        :

                    `
                    <div class="product-image no-image">
                        📦
                    </div>
                    `;


                return `

                <article class="product-card">

                    ${image}

                    <div class="info">

                        <h3 class="code">
                            ${escapeHTML(product.code)}
                        </h3>

                        <p class="size">
                            ${escapeHTML(product.size || "")}
                        </p>

                        <p class="price">
                            ${formatPrice(product.price)}
                        </p>

                        <p class="stock">
                            ${formatStock(product.stock)}
                        </p>

                        <button
                            class="read"
                            onclick="showDetails('${product.id}')">

                            Read More →

                        </button>


                        <div class="card-actions">

                            <button
                                class="small-btn edit-btn"
                                onclick="editProduct('${product.id}')">

                                Edit

                            </button>


                            <button
                                class="small-btn delete-btn"
                                onclick="deleteProduct('${product.id}')">

                                Delete

                            </button>

                        </div>

                    </div>

                </article>

                `;

            }
        )
        .join("");


    $("emptyState").hidden =
        filtered.length !== 0;

}


/* =========================
   OPEN ADD / EDIT FORM
========================= */

function openForm(product = null) {

    $("formModal").hidden = false;


    $("formTitle").textContent =
        product
            ? "Edit Product"
            : "Add Product";


    $("productId").value =
        product?.id || "";


    $("code").value =
        product?.code || "";


    $("size").value =
        product?.size || "";


    $("price").value =
        product?.price ?? "";


    $("stock").value =
        product?.stock ?? "";


    $("description").value =
        product?.description || "";


    currentImage =
        product?.image || null;


    $("image").value = "";


    $("preview").innerHTML =
        currentImage

            ?

        `<img src="${currentImage}" alt="Preview">`

            :

        "";

}


/* =========================
   CLOSE FORM
========================= */

function closeForm() {

    $("formModal").hidden = true;

}


/* =========================
   EDIT
========================= */

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


/* =========================
   DELETE
========================= */

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


    await refreshProducts();

}


/* =========================
   SHOW DETAILS
========================= */

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


    $("details").innerHTML = `

        ${
            product.image

                ?

            `
            <img
                class="detail-image"
                src="${product.image}"
                alt="Product">
            `

                :

            ""
        }


        <div class="detail-row">

            <span>
                Product Code
            </span>

            <span>
                ${escapeHTML(product.code)}
            </span>

        </div>


        <div class="detail-row">

            <span>
                Size
            </span>

            <span>
                ${escapeHTML(product.size || "—")}
            </span>

        </div>


        <div class="detail-row">

            <span>
                Price
            </span>

            <span>
                ${formatPrice(product.price)}
            </span>

        </div>


        <div class="detail-row">

            <span>
                Stock
            </span>

            <span>
                ${formatStock(product.stock)}
            </span>

        </div>


        <h3>
            Description
        </h3>


        <div class="description">

            ${escapeHTML(
                product.description ||
                "No description added."
            )}

        </div>


        <div class="form-actions">

            <button
                class="secondary-btn"
                onclick="editFromDetails('${product.id}')">

                Edit

            </button>


            <button
                class="delete-btn"
                onclick="deleteFromDetails('${product.id}')">

                Delete

            </button>

        </div>

    `;


    $("detailsModal").hidden = false;

}


/* =========================
   EDIT FROM DETAILS
========================= */

function editFromDetails(id) {

    $("detailsModal").hidden = true;

    editProduct(id);

}


/* =========================
   DELETE FROM DETAILS
========================= */

async function deleteFromDetails(id) {

    $("detailsModal").hidden = true;

    await deleteProduct(id);

}


/* =========================
   ADD BUTTON
========================= */

$("addBtn").onclick = function () {

    openForm();

};


/* =========================
   CLOSE FORM
========================= */

$("closeForm").onclick =
    closeForm;

$("cancelForm").onclick =
    closeForm;


/* =========================
   CLOSE DETAILS
========================= */

$("closeDetails").onclick =
    function () {

        $("detailsModal").hidden = true;

    };


/* =========================
   SEARCH
========================= */

$("searchInput").oninput =
    function () {

        renderProducts();

    };


/* =========================
   CLEAR SEARCH
========================= */

$("clearSearch").onclick =
    function () {

        $("searchInput").value = "";

        renderProducts();

        $("searchInput").focus();

    };


/* =========================
   IMAGE
========================= */

$("image").onchange =
    function (event) {

        const file =
            event.target.files[0];


        if (!file) {

            return;

        }


        const reader =
            new FileReader();


        reader.onload =
            function () {

                currentImage =
                    reader.result;


                $("preview").innerHTML = `

                    <img
                        src="${currentImage}"
                        alt="Preview">

                `;

            };


        reader.readAsDataURL(file);

    };


/* =========================
   SAVE FORM
========================= */

$("productForm").onsubmit =
    async function (event) {

        event.preventDefault();


        const code =
            $("code")
                .value
                .trim();


        if (!code) {

            alert(
                "Please enter a product code."
            );

            return;

        }


        const id =
            $("productId").value ||
            crypto.randomUUID();


        const duplicate =
            products.find(
                function (product) {

                    return (
                        product.code
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


        const product = {

            id: id,

            code: code,

            size:
                $("size")
                    .value
                    .trim(),

            price:
                $("price")
                    .value,

            stock:
                $("stock")
                    .value,

            description:
                $("description")
                    .value
                    .trim(),

            image:
                currentImage,

            updatedAt:
                Date.now()

        };


        await saveProduct(product);


        closeForm();


        await refreshProducts();

    };


/* =========================
   PWA INSTALL
========================= */

window.addEventListener(
    "beforeinstallprompt",
    function (event) {

        event.preventDefault();

        deferredPrompt = event;

        $("installBtn").hidden = false;

    }
);


$("installBtn").onclick =
    async function () {

        if (!deferredPrompt) {

            return;

        }


        deferredPrompt.prompt();


        await deferredPrompt.userChoice;


        deferredPrompt = null;


        $("installBtn").hidden = true;

    };


/* =========================
   SERVICE WORKER
========================= */

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


/* =========================
   START APP
========================= */

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