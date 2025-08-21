import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import { GoogleGenAI } from "@google/genai";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const userId = req.user._id;
    const users = await User.find({ _id: { $ne: userId } }).select("-password -__v").sort({ createdAt: -1 });

    res.status(200).json({
      users
    })
  } catch (e) {
    console.log("Error in getting Users for sidebar:", e.message);
    res.status(500).json({
      message: "Internal Server Error"
    });
  }
}

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;//learn to deconstruct at res,req
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// export const sendMessage = async (req, res) => {
//   try {
//     const { text, image } = req.body;
//     const { id: receiverId } = req.params;
//     const senderId = req.user._id;

//     let imageUrl;
//     if (image) {
//       // Upload base64 image to cloudinary
//       const uploadResponse = await cloudinary.uploader.upload(image);
//       imageUrl = uploadResponse.secure_url;
//     }

//     const newMessage = new Message({
//       senderId,
//       receiverId,
//       text,
//       image: imageUrl,
//     });

//       await newMessage.save();

//     const receiverSocketId = getReceiverSocketId(receiverId);
//       if (receiverSocketId) {
//             io.to(receiverSocketId).emit("newMessage", newMessage);
//     }

//     res.status(201).json(newMessage);
//   } catch (error) {
//     console.log("Error in sendMessage controller: ", error.message);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };



// Initialize Gemini client (keep your API key in .env)
const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY, // put your Gemini API key in .env
});

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let finalText = text;
    let imageUrl;

    // If image is provided -> upload to Cloudinary
    if (image) {
      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    // ✅ If user message starts with "#gemini"
    const isForAi = text && text.startsWith("#gemini");
    if (isForAi) {
      const prompt = text.replace("#gemini", "").trim();

      const response = await genAI.models.generateContent({
        model: "gemini-2.0-flash", // can swap with gemini-2.0-pro, etc.
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `You are an assistant that always explains things briefly in a small, crisp paragraph. 
                   Keep it concise but clear.\n\nUser request: ${prompt}`,
              },
            ],
          },
        ],
      });

      // Gemini gives AI text output directly
       finalText = 
  "📝 **Prompt:** " + prompt + "\n\n" +
  "🤖 **Answer:** " + response.text;

    }

    // Create and save the message
    const newMessage = new Message({
      senderId,
      receiverId,
      text: finalText,
      image: imageUrl,
    });

    await newMessage.save();

    // Emit message to both users
    const receiverSocketId = getReceiverSocketId(receiverId);
    const senderSocketId = getReceiverSocketId(senderId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }
    if (senderSocketId && isForAi) {
      io.to(senderSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
