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
        //    TODO: status of product
        bool completed;
    }

    mapping(uint => Product) public products;

    //  TODO: test event
    event TaskCreated(
        uint id,
        string content,
        bool completed
    );

    event TaskCompleted(
        uint id,
        bool completed
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
            false);
        emit TaskCreated(productCount, description, false);
    }

    function bidProduct(uint id) public {
        Product memory product = products[id];
        product.bid = product.bid + 100;
        products[id] = product;
        emit TaskCompleted(id, product.completed);
    }

    //  function showSender() public view returns (address) {
    //    return (msg.sender);
    //  }

    function buyProduct() public payable {
        //    require(msg.value == 1.0, "Incorrect amount");

    }

    // TODO: use block.timestamp for current  time

}

// TODO: check offer expiration time is > today