import amqplib from "amqplib";
import logger from "./logger.js";

let connection = null;
let channel = null;

const EXCHANGE_NAME = "post-service-exchange";

async function connectToRabbitMQ() {
  try {
    connection = await amqplib.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: true });
    logger.info("Connected to RabbitMQ");
  } catch (error) {
    logger.error("Error connecting to RabbitMQ", error);
  }
}

async function publishToRabbitMQ(routingKey, message) {
  if (!channel) {
    await connectToRabbitMQ();
  }
  await channel.publish(
    EXCHANGE_NAME,
    routingKey,
    Buffer.from(JSON.stringify(message)),
  );
  logger.info(`Message published to RabbitMQ with routing key: ${routingKey}`);
}

async function consumeFromRabbitMQ(routingKey, callback) {
  if (!channel) {
    await connectToRabbitMQ();
  }
  const queue = await channel.assertQueue("", { exclusive: true });
  await channel.bindQueue(queue.queue, EXCHANGE_NAME, routingKey);
  channel.consume(queue.queue, (msg) => {
    if (msg !== null) {
      const messageContent = JSON.parse(msg.content.toString());
      callback(messageContent);
      channel.ack(msg);
    }
  });
  logger.info(`Consuming messages from RabbitMQ with routing key: ${routingKey}`);
}

export { connectToRabbitMQ, publishToRabbitMQ, consumeFromRabbitMQ };
