import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Paper
} from "@mui/material";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
import SchoolIcon from "@mui/icons-material/School";
import EventNoteIcon from "@mui/icons-material/EventNote";

const TYPE_CONFIGS = {
  Placement: {
    color: "#059669",
    bg: "rgba(5, 150, 105, 0.08)",
    icon: <BusinessCenterIcon sx={{ color: "#059669" }} />,
    label: "Placement"
  },
  Result: {
    color: "#2563eb",
    bg: "rgba(37, 99, 235, 0.08)",
    icon: <SchoolIcon sx={{ color: "#2563eb" }} />,
    label: "Result"
  },
  Event: {
    color: "#7c3aed",
    bg: "rgba(124, 58, 237, 0.08)",
    icon: <EventNoteIcon sx={{ color: "#7c3aed" }} />,
    label: "Event"
  }
};

export default function NotificationCard({ notification, isRead, onMarkRead }) {
  const config = TYPE_CONFIGS[notification.Type] || {
    color: "#64748b",
    bg: "rgba(100, 116, 139, 0.08)",
    icon: <EventNoteIcon sx={{ color: "#64748b" }} />,
    label: "Notification"
  };

  // Format date nicely
  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr.replace(" ", "T"));
      return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <Card
      elevation={isRead ? 1 : 4}
      sx={{
        mb: 2,
        borderRadius: "12px",
        borderLeft: `6px solid ${config.color}`,
        backgroundColor: isRead ? "#ffffff" : "#f0f9ff", // soft blue tint for unread
        transition: "all 0.2s ease-in-out",
        boxShadow: isRead 
          ? "0 1px 3px rgba(0,0,0,0.05)" 
          : "0 4px 6px -1px rgba(56, 189, 248, 0.1), 0 2px 4px -1px rgba(56, 189, 248, 0.06)",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.04)"
        }
      }}
    >
      <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
            <Paper
              elevation={0}
              sx={{
                p: 1,
                borderRadius: "10px",
                backgroundColor: config.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              {config.icon}
            </Paper>

            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5, flexWrap: "wrap" }}>
                <Chip
                  label={config.label}
                  size="small"
                  sx={{
                    backgroundColor: config.bg,
                    color: config.color,
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    borderRadius: "6px"
                  }}
                />
                {!isRead && (
                  <Chip
                    label="NEW"
                    size="small"
                    color="primary"
                    sx={{
                      height: "18px",
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      borderRadius: "4px",
                      backgroundColor: "#0284c7"
                    }}
                  />
                )}
              </Box>
              <Typography
                variant="body1"
                sx={{
                  color: isRead ? "#334155" : "#0f172a",
                  fontWeight: isRead ? 400 : 600,
                  fontSize: "1rem",
                  mb: 0.5,
                  lineHeight: 1.4
                }}
              >
                {notification.Message}
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>
                {formatDate(notification.Timestamp)}
              </Typography>
            </Box>
          </Box>

          {!isRead && (
            <Tooltip title="Mark as Read" arrow>
              <IconButton
                onClick={onMarkRead}
                size="small"
                sx={{
                  color: "#0284c7",
                  backgroundColor: "rgba(2, 132, 199, 0.05)",
                  "&:hover": {
                    backgroundColor: "rgba(2, 132, 199, 0.15)",
                    color: "#0369a1"
                  }
                }}
              >
                <MarkEmailReadIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
