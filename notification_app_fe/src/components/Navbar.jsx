import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Box,
  Badge,
  useMediaQuery,
  useTheme
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import NotificationsIcon from "@mui/icons-material/Notifications";
import StarIcon from "@mui/icons-material/Star";

export default function Navbar({ unreadCount }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const navItems = [
    { label: "All Notifications", path: "/", icon: <NotificationsIcon /> },
    { label: "Priority Inbox", path: "/priority", icon: <StarIcon /> }
  ];

  const toggleDrawer = (open) => () => {
    setDrawerOpen(open);
  };

  return (
    <>
      <AppBar position="sticky" elevation={3} sx={{ backgroundColor: "#1e293b" }}>
        <Toolbar>
          <NotificationsIcon sx={{ mr: 1.5, color: "#38bdf8" }} />
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              fontWeight: 700,
              letterSpacing: "0.5px",
              fontFamily: "'Outfit', sans-serif"
            }}
          >
            CampusPulse
          </Typography>

          {!isMobile ? (
            <Box sx={{ display: "flex", gap: 1.5 }}>
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Button
                    key={item.label}
                    component={Link}
                    to={item.path}
                    startIcon={
                      item.path === "/" ? (
                        <Badge badgeContent={unreadCount} color="error" max={99}>
                          {item.icon}
                        </Badge>
                      ) : (
                        item.icon
                      )
                    }
                    sx={{
                      color: isActive ? "#38bdf8" : "#94a3b8",
                      fontWeight: isActive ? 600 : 500,
                      textTransform: "none",
                      fontSize: "0.95rem",
                      px: 2,
                      py: 1,
                      borderRadius: "8px",
                      transition: "all 0.2s ease-in-out",
                      backgroundColor: isActive ? "rgba(56, 189, 248, 0.08)" : "transparent",
                      "&:hover": {
                        color: "#38bdf8",
                        backgroundColor: "rgba(56, 189, 248, 0.12)"
                      }
                    }}
                  >
                    {item.label}
                  </Button>
                );
              })}
            </Box>
          ) : (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={toggleDrawer(true)}
              sx={{ ml: 2 }}
            >
              <Badge badgeContent={unreadCount} color="error" variant="dot">
                <MenuIcon />
              </Badge>
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      <Drawer anchor="right" open={drawerOpen} onClose={toggleDrawer(false)}>
        <Box
          sx={{ width: 250, backgroundColor: "#0f172a", height: "100%", pt: 2 }}
          role="presentation"
          onClick={toggleDrawer(false)}
        >
          <Typography
            variant="h6"
            sx={{
              px: 2,
              pb: 2,
              color: "#f8fafc",
              fontWeight: 700,
              fontFamily: "'Outfit', sans-serif",
              borderBottom: "1px solid #1e293b"
            }}
          >
            Navigation
          </Typography>
          <List sx={{ mt: 1 }}>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <ListItem key={item.label} disablePadding>
                  <ListItemButton
                    component={Link}
                    to={item.path}
                    sx={{
                      py: 1.5,
                      mx: 1,
                      borderRadius: "8px",
                      backgroundColor: isActive ? "rgba(56, 189, 248, 0.08)" : "transparent",
                      color: isActive ? "#38bdf8" : "#94a3b8",
                      "&:hover": {
                        backgroundColor: "rgba(56, 189, 248, 0.12)",
                        color: "#38bdf8"
                      }
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
                      <Box sx={{ mr: 2, color: isActive ? "#38bdf8" : "#64748b" }}>
                        {item.path === "/" ? (
                          <Badge badgeContent={unreadCount} color="error" max={99}>
                            {item.icon}
                          </Badge>
                        ) : (
                          item.icon
                        )}
                      </Box>
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{
                          fontWeight: isActive ? 600 : 500,
                          fontSize: "1rem"
                        }}
                      />
                    </Box>
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Drawer>
    </>
  );
}
