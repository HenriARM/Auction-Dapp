pragma solidity ^0.5.0;

contract Auction {
    uint public productCount = 0;

    struct Product {
        uint id;
        string description;
        address owner;
        uint startPrice;
        uint bid;
        uint datetime;
        bool isClosed;
        bool isPayed;
    }

    mapping(uint => Product) public products;

    event TaskCreated(
        uint id,
        string content,
        bool isClosed
    );

    event TaskCompleted(
        uint id,
        bool isClosed
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
        emit TaskCreated(productCount, description, false);
    }

    function bidProduct(uint id) public {
        Product memory product = products[id];
        product.bid = product.bid + 100;
        products[id] = product;
        emit TaskCompleted(id, product.isClosed);
    }

    function closeProduct(uint id) public {
        Product memory product = products[id];
        product.isClosed = !product.isClosed;
        products[id] = product;
        emit TaskCompleted(id, product.isClosed);
    }

    function buyProduct(uint id, address payable owner) public payable {
        Product memory product = products[id];
        require(product.isClosed == true, "Offer is not closed yet");
        require(product.bid == msg.value, "Incorrect sent money");
        product.isPayed = !product.isPayed;
        // send money to the product owner
        owner.transfer(product.bid);
        products[id] = product;
        emit TaskCompleted(id, product.isPayed);
    }

    //    require(msg.value == 1.0, "Incorrect amount");
    //  function showSender() public view returns (address) {
    //    return (msg.sender);
    //  }

}