import React, { useState, useEffect, useCallback } from "react";
import {
  Container,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  Skeleton
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import NotificationCard from "../components/NotificationCard";
import { fetchNotifications } from "../services/api";

export default function AllNotifications({ readMap, markAsRead, markAllAsRead }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Query parameters state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'unread', 'read'
  const [totalPages, setTotalPages] = useState(1);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchNotifications({ page, limit, type: typeFilter });
      setNotifications(data.notifications || []);
      
      // Calculate total pages from API metadata
      const totalPagesFromApi = data.pagination?.total_pages || 1;
      setTotalPages(totalPagesFromApi);
    } catch (err) {
      setError("Failed to retrieve notifications. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, typeFilter]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Handle pagination changes
  const handlePageChange = (event, value) => {
    setPage(value);
  };

  // Handle filter changes
  const handleTypeChange = (event) => {
    setTypeFilter(event.target.value);
    setPage(1); // Reset to page 1
  };

  const handleStatusChange = (event) => {
    setStatusFilter(event.target.value);
  };

  // Filter notifications on client side based on read/unread status
  const filteredNotifications = notifications.filter((item) => {
    const isRead = !!readMap[item.ID];
    if (statusFilter === "unread") return !isRead;
    if (statusFilter === "read") return isRead;
    return true;
  });

  // Mark all visible unread notifications on the page as read
  const handleMarkPageAsRead = () => {
    const unreadIds = notifications
      .filter((item) => !readMap[item.ID])
      .map((item) => item.ID);
    
    if (unreadIds.length > 0) {
      markAllAsRead(unreadIds);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 6 }}>
      {/* Header section */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: "#0f172a", mb: 0.5, fontFamily: "'Outfit', sans-serif" }}>
            All Notifications
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b" }}>
            Stay updated with college placements, fests, and exam results.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<CheckCircleIcon />}
          onClick={handleMarkPageAsRead}
          disabled={loading || notifications.length === 0}
          sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 600 }}
        >
          Mark Page as Read
        </Button>
      </Box>

      {/* Filters section */}
      <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: "12px", mb: 3, backgroundColor: "#f8fafc" }}>
        <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel id="type-filter-label">Filter by Category</InputLabel>
                <Select
                  labelId="type-filter-label"
                  value={typeFilter}
                  label="Filter by Category"
                  onChange={handleTypeChange}
                  sx={{ borderRadius: "8px", backgroundColor: "#ffffff" }}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  <MenuItem value="Placement">Placements</MenuItem>
                  <MenuItem value="Result">Results</MenuItem>
                  <MenuItem value="Event">Events</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel id="status-filter-label">Filter by Status</InputLabel>
                <Select
                  labelId="status-filter-label"
                  value={statusFilter}
                  label="Filter by Status"
                  onChange={handleStatusChange}
                  sx={{ borderRadius: "8px", backgroundColor: "#ffffff" }}
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="unread">New / Unread</MenuItem>
                  <MenuItem value="read">Viewed / Read</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Error alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: "8px" }}>
          {error}
        </Alert>
      )}

      {/* Main Feed */}
      <Box>
        {loading ? (
          // Display Skeletons while loading
          Array.from(new Array(3)).map((_, index) => (
            <Skeleton
              key={index}
              variant="rectangular"
              height={100}
              sx={{ mb: 2, borderRadius: "12px" }}
            />
          ))
        ) : filteredNotifications.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8, border: "2px dashed #cbd5e1", borderRadius: "12px" }}>
            <Typography variant="h6" sx={{ color: "#64748b", mb: 1 }}>
              No notifications found
            </Typography>
            <Typography variant="body2" sx={{ color: "#94a3b8" }}>
              Try adjusting your filters or category selections.
            </Typography>
          </Box>
        ) : (
          filteredNotifications.map((notification) => (
            <NotificationCard
              key={notification.ID}
              notification={notification}
              isRead={!!readMap[notification.ID]}
              onMarkRead={() => markAsRead(notification.ID)}
            />
          ))
        )}
      </Box>

      {/* Pagination Section */}
      {!loading && !error && notifications.length > 0 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            size="large"
            sx={{
              "& .MuiPaginationItem-root": {
                borderRadius: "8px"
              }
            }}
          />
        </Box>
      )}
    </Container>
  );
}
