import express from 'express';
import dotenv from "dotenv";
import cookieParser from 'cookie-parser';
import cors from "cors";

import path from 'path';

import authRoutes from './src/routes/auth.route.js';
import messageRoutes from './src/routes/message.route.js';
import { fileURLToPath } from 'url';
import connectToMongoDB from './src/lib/db.js';
import {app,io,server} from './src/lib/socket.js'
dotenv.config();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
const PORT = process.env.PORT || 5001;
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));


app.use('/api/auth', authRoutes);
app.use("/api/messages", messageRoutes);

server.listen(PORT, () => {
    console.log(`Server is running at PORT: ${PORT}`);
    connectToMongoDB();
})