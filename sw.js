const CACHE_NAME =
    "business-products-v2";


const FILES_TO_CACHE = [

    "./",

    "./index.html",

    "./style.css",

    "./app.js",

    "./manifest.json"

];


self.addEventListener(
    "install",
    function (event) {

        event.waitUntil(

            caches.open(CACHE_NAME)
                .then(
                    function (cache) {

                        return cache.addAll(
                            FILES_TO_CACHE
                        );

                    }
                )

        );

    }
);


self.addEventListener(
    "activate",
    function (event) {

        event.waitUntil(

            caches.keys()
                .then(
                    function (cacheNames) {

                        return Promise.all(

                            cacheNames
                                .filter(
                                    function (name) {

                                        return (
                                            name !==
                                            CACHE_NAME
                                        );

                                    }
                                )
                                .map(
                                    function (name) {

                                        return caches.delete(
                                            name
                                        );

                                    }
                                )

                        );

                    }
                )

        );

    }
);


self.addEventListener(
    "fetch",
    function (event) {

        if (
            event.request.method !==
            "GET"
        ) {

            return;

        }


        event.respondWith(

            caches.match(
                event.request
            )
            .then(
                function (cached) {

                    if (cached) {

                        return cached;

                    }


                    return fetch(
                        event.request
                    )
                    .then(
                        function (response) {

                            const copy =
                                response.clone();


                            caches.open(
                                CACHE_NAME
                            )
                            .then(
                                function (cache) {

                                    cache.put(
                                        event.request,
                                        copy
                                    );

                                }
                            );


                            return response;

                        }
                    )
                    .catch(
                        function () {

                            return caches.match(
                                "./index.html"
                            );

                        }
                    );

                }
            )

        );

    }
);