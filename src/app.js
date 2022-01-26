App = {
    loading: false,
    contracts: {},

    load: async () => {
        await App.loadWeb3();
        await App.loadAccount();
        await App.loadContract();
        await App.render();
    },

    // https://medium.com/metamask/https-medium-com-metamask-breaking-change-injecting-web3-7722797916a8
    loadWeb3: async () => {

        window.addEventListener('load', async () => {
            // Modern dapp browsers...
            if (window.ethereum) {
                window.web3 = new Web3(ethereum);
                try {
                    // Request account access if needed
                    await ethereum.enable();
                    // Acccounts now exposed
                    web3.eth.sendTransaction({/* ... */});
                } catch (error) {
                    // User denied account access...
                }
            }
            // Legacy dapp browsers...
            else if (window.web3) {
                window.web3 = new Web3(web3.currentProvider);
                // Acccounts always exposed
                web3.eth.sendTransaction({/* ... */});
            }
            // Non-dapp browsers...
            else {
                console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
            }
        });
    },

    loadAccount: async () => {
        const account = await ethereum.request({method: 'eth_requestAccounts'});
        App.account = account[0];
    },

    loadContract: async () => {
        // Create a JavaScript version of the smart contract
        const auction = await $.getJSON('Auction.json');
        App.contracts.Auction = TruffleContract(auction);
        App.contracts.Auction.setProvider(new Web3.providers.HttpProvider("http://127.0.0.1:7545"));
        App.auction = await App.contracts.Auction.deployed();
    },

    render: async () => {
        // Prevent double render
        if (App.loading) {
            return
        }

        // Update app loading state
        App.setLoading(true);

        // Render Account
        $('#account').html(App.account);

        // Render Products
        await App.renderProducts();

        // Update loading state
        App.setLoading(false)
    },

    renderProducts: async () => {
        const productCount = await App.auction.productCount();
        // Render out each product with a new task template
        const $taskTemplate = $('.taskTemplate');
        for (let i = 1; i <= productCount; i++) {
            // Fetch products from blockchain
            let product = await App.auction.products(i);
            product = {
                "id": product[0].toNumber(),
                "description": product[1],
                "owner": product[2],
                "startPrice": product[3].toNumber(),
                "bid": product[4].toNumber(),
                "datetime": product[5].toNumber(),
                "isClosed": product[6],
                "isPayed": product[7]
            };
            // Create the html for the task
            const $newTaskTemplate = $taskTemplate.clone();
            // clone product
            const productRow = JSON.parse(JSON.stringify(product));
            const addrLen = productRow["owner"].length;
            productRow["owner"] = "#..." + productRow["owner"].slice(addrLen - 8, addrLen);
            let msg = "";
            for (const key in productRow) {
                msg += `${key}: ${productRow[key]} | `;
            }
            console.log(msg);
            $newTaskTemplate.find(".content").html(msg);
            $newTaskTemplate.find(".bidproduct")
                .prop("name", productRow["id"])
                .on("click", App.bidProduct);

            $newTaskTemplate.find(".closeproduct")
                .prop("name", productRow["id"])
                .on("click", App.closeProduct);

            $newTaskTemplate.find(".buyproduct")
                .prop("name", productRow["id"])
                .on("click", App.buyProduct);

            // show close button to product creator and bid to others
            if (!product["isClosed"]) {
                if (App.account === product["owner"].toLowerCase()) {
                    $newTaskTemplate.find(".closeproduct").show();
                } else {
                    $newTaskTemplate.find('.bidproduct')
                        .prop("value", productRow["bid"])
                        .show();
                }
            } else {
                // show buy button if it is closed (and we are not owners)
                if (!product["isPayed"]) {
                    $newTaskTemplate.find(".buyproduct").show();
                }
            }

            // Put the task in the correct list
            if (!productRow["isClosed"]) {
                $('#openedProductList').append($newTaskTemplate);
            } else if (product["isClosed"] && !product["isPayed"]) {
                $('#closedProductList').append($newTaskTemplate);
            } else {
                $('#payedProductList').append($newTaskTemplate)
            }
            // Show the task
            $newTaskTemplate.show()
        }
    },

    postProduct: async () => {
        App.setLoading(true);
        const description = $("#newDescription").val();
        let startPrice = $("#newPrice").val();
        startPrice = parseInt(startPrice);
        let datetime = $("#newTime").val();
        datetime = Math.round(new Date(datetime).getTime() / 1000);
        await App.auction.postProduct(description, startPrice, datetime, {from: App.account});
        window.location.reload();
    },

    bidProduct: async (e) => {
        App.setLoading(true);
        const productId = e.target.name;
        await App.auction.bidProduct(productId, {from: App.account});
        window.location.reload();
    },

    closeProduct: async (e) => {
        App.setLoading(true);
        const productId = e.target.name;
        await App.auction.closeProduct(productId, {from: App.account});
        window.location.reload();
    },

    buyProduct: async (e) => {
        // App.setLoading(true);
        const productId = e.target.name;
        const product = await App.auction.products(productId);
        // console.log(product["owner"]);
        await App.auction.buyProduct(productId, product["owner"].toLowerCase(), {
            from: App.account,
            value: product["bid"]
        });
        window.location.reload();
    },

    setLoading: (boolean) => {
        App.loading = boolean;
        const loader = $('#loader');
        const content = $('#content');
        if (boolean) {
            loader.show();
            content.hide();
        } else {
            loader.hide();
            content.show();
        }
    }
};

$(() => {
    $(window).load(() => {
        App.load();
    })
});


// TODO: test events
// TODO: don't allow to create expired product
// TODO: check offer expiration time is > today use block.timestamp
// TODO: rename from everywhere task keyword
// TODO: create html tables insted of msg
// TODO: can also be timeout of deal and nobody ordered (the last one who did bid)
