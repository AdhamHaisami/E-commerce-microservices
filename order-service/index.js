const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const amqp = require('amqplib');
const app = express();

const Order = require('./order');
const authenticator = require('../authenticator');

mongoose.connect(
  'mongodb://localhost/order-service',
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  () => {
    console.log('Order-Service DB connected');
  }
);

let channel;
let connection;

const createOrder = (products, userEmail) => {
  let total = 0;
  for (x = 0; x < products.length; x++) {
    const newOrder = new Order({
      products,
      userEmail,
      total_price: total,
    });
    newOrder.save();
    return newOrder;
  }
};

const connect = async () => {
  const amqpServer = 'amqp://localhost:5672';
  connection = await amqp.connect(amqpServer);
  channel = await connection.createChannel();
  await channel.assertQueue('ORDER');
};

connect()
  .then(() => {
    channel.consume('ORDER', (data) => {
      const { products, userEmail } = JSON.parse(data.content);
      const newOrder = createOrder(products, userEmail);
      channel.ack(data);
      channel.sendToQueue('PRODUCT', Buffer.from(JSON.stringify({ newOrder })));
      console.log('Consuming ORDER queue');
      console.log(products);
    });
  })
  .catch((err) => console.log);

const PORT = process.env.PORT_PRODUCT || 7090;

app.listen(PORT, () => {
  console.log(`ORDER-SERVICE IS LIVE ON ${PORT}`);
});
