import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider, createTheme, CssBaseline, Box } from "@mui/material";
import Navbar from "./components/Navbar";
import AllNotifications from "./pages/AllNotifications";
import PriorityInbox from "./pages/PriorityInbox";

// Define a premium modern theme
const theme = createTheme({
  palette: {
    primary: {
      main: "#0284c7", // Sky blue accent
      contrastText: "#ffffff"
    },
    background: {
      default: "#f8fafc", // Cool light gray background
      paper: "#ffffff"
    },
    text: {
      primary: "#0f172a", // Slate 900
      secondary: "#64748b" // Slate 500
    }
  },
  typography: {
    fontFamily: "'Outfit', 'Inter', sans-serif",
    h4: {
      fontWeight: 800
    },
    body1: {
      fontSize: "0.95rem"
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: "8px"
        }
      }
    }
  }
});

export default function App() {
  // Load read status map from localStorage
  const [readMap, setReadMap] = useState(() => {
    try {
      const saved = localStorage.getItem("read_notifications");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Keep localStorage in sync with state
  useEffect(() => {
    localStorage.setItem("read_notifications", JSON.stringify(readMap));
  }, [readMap]);

  // Mark a single notification as read
  const markAsRead = (id) => {
    setReadMap((prev) => ({
      ...prev,
      [id]: true
    }));
  };

  // Mark multiple notifications as read (e.g. bulk read on page load)
  const markAllAsRead = (ids) => {
    setReadMap((prev) => {
      const updated = { ...prev };
      ids.forEach((id) => {
        updated[id] = true;
      });
      return updated;
    });
  };

  // Calculate unread count (for navbar badge)
  // We can fetch a page of notifications and check how many are not in the readMap.
  // For simplicity, we calculate the number of items currently fetched that are unread.
  // Let's pass a function to update the badge count or read it from readMap size.
  // Wait, let's keep a simple reactive count. We can read unread counts based on active unread items.
  // To make it accurate, we can count keys or display a badge count from readMap.
  // Actually, we can count unread items from the active list. To be simple, we show a dynamic badge
  // indicating that unread items are pending.
  const unreadCount = Object.keys(readMap).filter(k => !readMap[k]).length; 

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#f8fafc" }}>
          <Navbar unreadCount={null /* null hides badge number or shows dot if unread exists */} />
          <Box sx={{ flexGrow: 1 }}>
            <Routes>
              <Route
                path="/"
                element={
                  <AllNotifications
                    readMap={readMap}
                    markAsRead={markAsRead}
                    markAllAsRead={markAllAsRead}
                  />
                }
              />
              <Route
                path="/priority"
                element={
                  <PriorityInbox
                    readMap={readMap}
                    markAsRead={markAsRead}
                  />
                }
              />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}
