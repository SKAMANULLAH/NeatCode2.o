import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./App.jsx";
import { Provider } from "react-redux";
import { store } from "./stote/store.js";
import { ThemeProvider } from "./context/ThemeContext.jsx";

import "./App.css";
createRoot(document.getElementById("root")).render(
  // Restricting the mode
  <StrictMode>
    {/* Nothing to worry just sharing the global variable where auth and chat are stored */}
    <Provider store={store}>
      {/* Just sharing isDark bool and toggleTheme fn */}
      <ThemeProvider>
        {/* I am sure u know it , we are just setting the virtual routing mechanism */}
        <BrowserRouter>
        {/* So let's begin with todays proceedings ! */}
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  </StrictMode>,
);
