// controllers/user.js
import User from "../models/User.js";
import Item from "../models/Item.js";
import jwt from "jsonwebtoken";

// helper: genera token JWT
const jwtPayload = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
};

export default {
  // LOGIN
  login: async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user) return res.status(404).send({ error: "Utente non trovato" });

      const isMatch = await user.matchPassword(password);
      if (!isMatch) return res.status(403).send({ error: "Password errata" });

      const token = jwtPayload(user);
      res.status(200).send({ token });
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  },

  // REGISTRAZIONE
  signUp: async (req, res) => {
    const { email, password, nickname } = req.body;
    if (!email || !password || !nickname) {
      return res.status(400).send({ error: "Campi mancanti" });
    }

    try {
      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(403).send({ error: "Utente già registrato" });
      }

      const user = await User.create({ email, password, nickname });
      const token = jwtPayload(user);
      res.status(201).send({ token });
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  },

  // INFO DAL TOKEN
  tokenInfo: async (req, res) => res.send(req.user),

  // PROFILO UTENTE
  me: async (req, res) => {
    try {
      const user = await User.findById(req.user._id).select(
        "-password -__v"
      );
      if (!user) return res.status(404).send({ error: "Utente non trovato" });
      res.send(user);
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  },

  // LIKE ITEM
  likeItem: async (req, res) => {
    try {
      const item = await Item.findById(req.body.id);
      if (!item) return res.status(404).send({ error: "Item non trovato" });

      const user = await req.user.likeItem(item._id);
      res.status(200).send(user.likedItems);
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  },

  // DISLIKE ITEM
  dislikeItem: async (req, res) => {
    try {
      const item = await Item.findById(req.body.id);
      if (!item) return res.status(404).send({ error: "Item non trovato" });

      const user = await req.user.dislikeItem(item._id);
      res.status(200).send(user.dislikedItems);
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  },
};
