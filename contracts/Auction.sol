pragma solidity ^0.5.0;

contract Auction {
    uint public productCount = 0;

    struct Product {
        uint id;
        string description;
        address payable owner;
        uint startPrice;
        uint bid;
        uint datetime;
        bool isClosed;
        bool isPayed;
    }

    mapping(uint => Product) public products;

    event ProductCreated(
        uint id,
        string description
    );

    event ProductBid(
        uint id,
        uint price
    );

    event ProductClosed(
        uint id,
        bool isClosed
    );

    event ProductBought(
        uint id,
        bool isBought
    );

    constructor() public {
        postProduct("Opel Astra", 100, 0);
        postProduct("Toyota Camry", 250, 0);
    }

    function postProduct(string memory description, uint startPrice, uint datetime)
    public payable {
        productCount ++;
        products[productCount] = Product(
            productCount,
            description,
            msg.sender,
            startPrice,
            startPrice, // bid starts from Startprice
            datetime,
            false,
            false);
        emit ProductCreated(productCount, description);
    }

    function bidProduct(uint id) public {
        Product memory product = products[id];
        product.bid = product.bid + 100;
        products[id] = product;
        emit ProductBid(id, product.bid);
    }

    function closeProduct(uint id) public {
        Product memory product = products[id];
        product.isClosed = !product.isClosed;
        products[id] = product;
        emit ProductClosed(id, product.isClosed);
    }

    function buyProduct(uint id) public payable {
        Product memory product = products[id];
        require(product.isClosed == true, "Offer is not closed yet");
        require(product.bid == msg.value, "Incorrect sent money");
        // send money to the product owner
        product.owner.transfer(msg.value);
        product.isPayed = !product.isPayed;
        products[id] = product;
        emit ProductBought(id, product.isPayed);
    }

    //    require(msg.value == 1.0, "Incorrect amount");
    //  function showSender() public view returns (address) {
    //    return (msg.sender);
    //  }

}