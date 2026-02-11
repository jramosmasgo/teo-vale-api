import app from './app';
import dotenv from 'dotenv';
import connectDB from './config/db';

dotenv.config();

// Connect to Database
connectDB();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
