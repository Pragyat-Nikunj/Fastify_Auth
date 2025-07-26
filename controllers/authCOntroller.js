const User = require("../models/user.js");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

exports.register = async (request, reply) => {
    try {
        const {name, email, password, country} = request.body;
        if (!name) {
            return reply.code(400).send({message: "Name Required"});
        }
        if (!email) {
            return reply.code(400).send({message: "Email Required"});
        }
        if (!password) {
            return reply.code(400).send({message: "Password Required"});
        }
        if (!country) {
            return reply.code(400).send({message: "Country Required"});
        }
        //validate fields
        const hashedPassword = await bcrypt.hash(password, 12);
        const user = new User({name, email, password: hashedPassword, country});
        await user.save();
        reply.code(201).send({message: "User created successfully!"});
    } catch (error) {
        reply.send(error)
    }
} 

exports.login = async(request, reply) => {
    try {
        const {email, password} = request.body;
        if (!email) {
            return reply.code(400).send({message: "Email Required"});
        }
        if (!password) {
            return reply.code(400).send({message: "Password Required"});
        }
        const user = await User.findOne({email});
        
        if (!user) {
            return reply.code(404).send({message: "User not Found."});
        }

        //validate the password

        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
            return reply.code(400).send({message: "Invalid password"});
        }

        const token = request.server.jwt.sign({id: user._id});
        reply.send({token});
    } catch (error) {
        reply.send(error);
    }
}

exports.forgotPassword = async (request, reply) => {
    try {
        const {email} = request.body;
        const user = await User.findOne({email});
        if (!user) {
            return reply.notFound("User not Found!");
        }

        // Use hex encoding for token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetPasswordExpire = Date.now() + 10 * 60 * 1000;
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpiry = resetPasswordExpire;

        await user.save({validateBeforeSave: false});

        const resetUrl = `http://localhost:${process.env.PORT}/api/auth/reset-password/${resetToken}`;
        reply.send({resetUrl, token: resetToken});

    } catch (error) {
        reply.send(error);
    }

}

exports.resetPassword = async (request, reply) => {
    const resetToken = request.params.token;
    const {newPassword} = request.body;

    const user = await User.findOne({
        resetPasswordToken: resetToken,
        resetPasswordExpiry: {$gt: Date.now()}
    });

    if (!user) {
        return reply.badRequest("Invalid or expired password token.");
    }

    //hash the password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;

    await user.save();

    reply.send({message: "Password reset successfully"})
}

exports.logout = async (request, reply) => {
    //JWT are stateless, use strategy like refrest token or blacklist token
    reply.send({message: "User logged out"});
}