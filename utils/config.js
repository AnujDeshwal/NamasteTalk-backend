export const corsOptions = {
    origin: [
      "http://localhost:5174",
      "http://localhost:5173",
      "https://namasate-talk-frontend.vercel.app/"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  };