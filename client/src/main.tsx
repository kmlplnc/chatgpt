import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Set page title and meta description
document.title = "NutriSage - AI-Powered Dietician Platform";
const metaDescription = document.createElement("meta");
metaDescription.name = "description";
metaDescription.content = "Professional nutrition planning with AI-powered diet plans, detailed food nutritional database, meal planning, and personalized health guidance.";
document.head.appendChild(metaDescription);

// Open Graph tags for better social media sharing
const ogTitle = document.createElement("meta");
ogTitle.setAttribute("property", "og:title");
ogTitle.content = "NutriSage - AI-Powered Dietician Platform";
document.head.appendChild(ogTitle);

const ogDescription = document.createElement("meta");
ogDescription.setAttribute("property", "og:description");
ogDescription.content = "Professional nutrition planning with AI-powered diet plans, detailed food nutritional database, meal planning, and personalized health guidance.";
document.head.appendChild(ogDescription);

const ogType = document.createElement("meta");
ogType.setAttribute("property", "og:type");
ogType.content = "website";
document.head.appendChild(ogType);

createRoot(document.getElementById("root")!).render(<App />);
