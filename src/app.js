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
                "taskCompleted": product[6]
            };
            // Create the html for the task
            const $newTaskTemplate = $taskTemplate.clone();
            const productRow = product;
            const addrLen = productRow["owner"].length;
            productRow["owner"] = "#..." + productRow["owner"].slice(addrLen - 8, addrLen);
            let msg = "";
            for (const key in productRow) {
                msg += `${key}: ${productRow[key]} | `;
            }
            console.log(msg);
            $newTaskTemplate.find('.content').html(msg);
            $newTaskTemplate.find('.bidproduct')
                .prop("name", productRow["id"])
                // .prop("checked", productRow["completed"])
                .on("click", App.bidProduct);

            // Put the task in the correct list
            if (productRow["completed"]) {
                $('#completedTaskList').append($newTaskTemplate)
            } else {
                $('#taskList').append($newTaskTemplate)
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
        // App.setLoading(true);
        console.log(e);
        const productId = e.target.name;
        await App.auction.bidProduct(productId, {from: App.account});
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

// TODO: can't buy when auction is not yet finished
// TODO: can't buy your own product
// TODO: for logs - console.log(JSON.stringify(product));
// TODO: create html tables insted of msg
// TODO: send specific product id
// const pay = await App.auction.buyProduct
// ({from: App.account, value: bidPrice});

// TODO: can also be timeout of deal and nobody ordered (the last one who did bid)
