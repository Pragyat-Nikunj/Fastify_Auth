const Thumbnail = require("../models/thumbnail.js");
const path = require("path");
const fs = require("fs");
const { pipeline } = require("stream");
const util = require("util");
const { request } = require("http");
const pipelineAsync = util.promisify(pipeline);

exports.createThumbnail = async (request, reply) => {
    try {
        const parts = await request.parts();
        let fields = {};
        let filename;

        for await (const part of parts) {
            if (part.file) {
                filename = `${Date.now()}-${part.filename}`;
                const saveTo = path.join(
                    __dirname,
                    "..",
                    "uploads",
                    "Thumbnails",
                    filename
                );
                await pipelineAsync(part.file, fs.createWriteStream(saveTo));
            } else {
                fields[part.fieldname] = part.value;
            }
        }

        const thumbnail = new Thumbnail({
            user: request.user.id,
            videoName: fields.videoName,
            version: fields.version,
            image: `/uploads/Thumbnails/${filename}`,
            paid: fields.paid === "true"
        });

        await thumbnail.save();
        reply.code(201).send(thumbnail)
    } catch (error) {
        reply.send(error);
    }
}

exports.getThumbnails = async (request, reply) => {
    try {
        const thumbnails = await Thumbnail.find({ user: request.user.id });
        reply.send(thumbnails);
    } catch (error) {
        reply.send(error);
    }
}

exports.getThumbnail = async (request, reply) => {
    try {
        const thumbnail = await Thumbnail.findOneAndReplace({
            _id: request.params.id,
            user: request.user.id
        });
        if (!thumbnail) {
            return reply.notFound("Thumbnail not Found");
        }
        reply.send(thumbnail);
    } catch (error) {
        reply.send(error);
    }
}

exports.updateThumbnail = async (request, reply) => {
    try {
        const updatedData = request.body;
        const thumbnail = await Thumbnail.findOneAndUpdate(
            { _id: request.params.id, user: request.user.id },
            updatedData,
            { new: true });

        if (!thumbnail) {
            return reply.notFound("Thumbnail couldn't update");
        }
        reply.send(thumbnail);
    } catch (error) {
        reply.send(error);
    }
}

exports.deleteThumbnail = async (request, reply) => {
    try {
        const thumbnail = await Thumbnail.findOneAndDelete({
            _id: request.params.id,
            user: request.user.id
        });

        if (!thumbnail) {
            return reply.notFound("Thumbnail not Found.");
        }

        const filepath = path.join(
            __dirname,
            "..",
            "uploads",
            "Thumbnails",
            path.basename(thumbnail.image)
        );

        fs.unlink(filepath, (err) => {
            if (err) fastify.log.error(err);
        });

        reply.send({ message: "Thumbnail deleted" });
    } catch (error) {
        reply.send(error);
    }
}

exports.deleteAllThumbnails = async (request, reply) => {
    try {
        const thumbnails = await Thumbnail.find({ user: request.user.id });
        await Thumbnail.deleteMany({ user: request.user.id });

        for (const thumbnail of thumbnails) {
            const filepath = path.join(
                __dirname,
                "..",
                "uploads",
                "Thumbnails",
                path.basename(thumbnail.image)
            );
            fs.unlink(filepath, (err) => {
                if (err) fastify.log.error(err);
            });
        }

        reply.send({ message: "All Thumbnails deleted." })
    } catch (error) {
        reply.send(error);
    }
}