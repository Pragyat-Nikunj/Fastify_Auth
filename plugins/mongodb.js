const fp = require("fastify-plugin");
const mongoose = require("mongoose");

module.exports = fp(async (fastify, opts) => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        fastify.decorate("mongoose", mongoose);
        fastify.log.info("MONGODB connected");
    } catch (error) {
        fastify.log.error(error);
        process.exit(1);
    }
});