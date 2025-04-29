import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from 'cors';

dotenv.config();

const app = express();

// middleware
// app.use(cors());
app.use(express.json()); // Parses incoming JSON requests
app.use(express.urlencoded({ extended: true })); // Parses URL-encoded data

app.use(cors({
  origin: ['https://sorting-visualizer-ten-delta.vercel.app',],
  methods: ['GET', 'PUT'],
  credentials: true,
}));


// Schema
const StatsSchema = new mongoose.Schema({
  elementsSorted: { type: Number, default: 0 },
  algorithmCount: { type: Number, default: 0 },
  algorithmHistory: {
    type: Map,
    of: Number,
    default: {},
  },
})
const Stats = mongoose.model("Stats", StatsSchema);


// controllers
const getStats = async (_req, res) => {
  try {
    const stats = await Stats.findOne();
    if (!stats) return res.status(404).json({ message: 'Stats not found' });

    // Determine most used algorithm
    const algorithmRun =
      [...stats.algorithmHistory.entries()].reduce((a, b) => (b[1] > a[1] ? b : a), ['', 0])[0] || null;

    res.json({
      elementsSorted: stats.elementsSorted,
      algorithmCount: stats.algorithmCount,
      algorithmRun,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
}
const updateStats = async (req, res) => {
  const { elementsSorted, algorithmRun } = req.body;
  try {
    let stats = await Stats.findOne();
    if (!stats) {
      stats = new Stats({
        elementsSorted,
        algorithmCount: 1,
        algorithmHistory: { [algorithmRun]: 1 },
      });
    } else {
      stats.elementsSorted += elementsSorted ?? 0;
      stats.algorithmCount += 1;

      const currentCount = stats.algorithmHistory.get(algorithmRun) || 0;
      stats.algorithmHistory.set(algorithmRun, currentCount + 1);
    }

    const updatedStats = await stats.save();
    res.json(updatedStats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
}

const allStats = async (_req, res) => {
  try {
    const stats = await Stats.findOne();
    if (!stats) return res.status(404).json({ message: 'Stats not found' });
    res.json(stats)
  }catch(error) {
    res.status(500).json({ message: 'Server error', error });
  }
}

// API Routes
app.route('/api/stats').get(getStats).put(updateStats);
app.get('/api/allstats', allStats);


// MongoDB connection and server start
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error", err);
  });
