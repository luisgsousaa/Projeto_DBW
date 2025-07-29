// models/users.js
const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const userInfoSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        match: /.+\@.+\..+/,
        lowercase: true,
    },
}, { timestamps: true });

const profileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserInfo",
        required: true,
        unique: true,
    },
    username: { type: String, required: true, unique: true },
    bio: { type: String, default: "" },
    profile_picture: { type: String, default: "" },
    profile_wallpaper: { type: String, default: "" },
    region: { type: String, default: "" },
    level: { type: Number, default: 1, min: 1 },
    last_seen: { type: Date, default: Date.now },

    comments: [{
        user_profile: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Profile",
            required: true,
        },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
    }, ],

    following: [{
        user_profile: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Profile",
            required: true,
        },
    }, ],
}, { timestamps: true });

userInfoSchema.plugin(passportLocalMongoose);

const UserInfo = mongoose.model("UserInfo", userInfoSchema);
const Profile = mongoose.model("Profile", profileSchema);

module.exports = { UserInfo, Profile };