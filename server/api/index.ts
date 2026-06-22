import "dotenv/config";
import app from "../src/app.js";

// Vercel's Node runtime calls the default export as (req, res).
// An Express app instance has that exact signature, so no adapter is needed.
export default app;
