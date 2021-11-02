const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const amqp = require('amqplib');

const authenticator = require('../authenticator');
const Product = require('./product');

const app = express();

let connection;
var channel;
let order;

app.use(express.json());

mongoose.connect(
  'mongodb://localhost/product-service',
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  () => {
    console.log(`Product-Service DB connected`);
  }
);

const connect = async () => {
  const amqpServer = 'amqp://localhost:5672';
  connection = await amqp.connect(amqpServer);
  channel = await connection.createChannel();
  await channel.assertQueue('PRODUCT');
};

connect();

// Create new product
app.post('/product/create', authenticator, async (req, res) => {
  const { name, description, price } = req.body;
  const newProduct = new Product({
    name,
    description,
    price,
  });
  newProduct.save();
  return res.json(newProduct);
});

//Buy a product
app.post('/product/buy', authenticator, async (req, res) => {
  try {
    const { ids } = req.body;
    const products = await Product.find({ _id: { $in: ids } });
    channel.sendToQueue(
      'ORDER',
      Buffer.from(
        JSON.stringify({
          products,
          userEmail: req.user.email,
        })
      )
    );

    channel.consume('PRODUCT', (data) => {
      console.log('CONSUMING PRODUCT QUEUE');
      order = JSON.parse(data.content);
      channel.ack(data);
      console.log(order);
    });
    return res.json(order);
  } catch (error) {
    console.log(error);
  }
});

const PORT = process.env.PORT_PRODUCT || 7080;

app.listen(PORT, () => {
  console.log(`PRODUCT-SERVICE IS LIVE ON ${PORT}`);
});
