import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { Toaster } from "react-hot-toast";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient.ts";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
        <QueryClientProvider client={queryClient}>

    <BrowserRouter>
      <App />
      <Toaster position="top-right"/>
    </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);
