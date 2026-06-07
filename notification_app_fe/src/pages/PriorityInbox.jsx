import React, { useState, useEffect, useCallback } from "react";
import {
  Container,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Grid,
  Skeleton
} from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import NotificationCard from "../components/NotificationCard";
import { fetchNotifications } from "../services/api";

const WEIGHTS = {
  Placement: 3,
  Result: 2,
  Event: 1
};

export default function PriorityInbox({ readMap, markAsRead }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rawNotifications, setRawNotifications] = useState([]);
  const [priorityCount, setPriorityCount] = useState(10); // user chosen 'n' (10, 15, 20)
  const [typeFilter, setTypeFilter] = useState("");

  // Fetches a pool of notifications (5 pages of 10 items) to prioritize from
  const loadPool = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let pool = [];
      // Fetch 5 pages of notifications sequentially to avoid rate limits and cover 50 items
      for (let page = 1; page <= 5; page++) {
        const data = await fetchNotifications({ page, limit: 10 });
        if (data.notifications) {
          pool = pool.concat(data.notifications);
        }
      }
      setRawNotifications(pool);
    } catch (err) {
      setError("Failed to retrieve notifications for ranking. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPool();
  }, [loadPool]);

  // Priority scoring and selection logic
  const getPriorityNotifications = () => {
    // 1. Filter out already read notifications (Priority Inbox displays unread first)
    let unreadList = rawNotifications.filter((item) => !readMap[item.ID]);

    // 2. Apply optional type filter
    if (typeFilter) {
      unreadList = unreadList.filter((item) => item.Type === typeFilter);
    }

    // 3. Sort by priority weight (Placement > Result > Event) and then recency (newest first)
    return unreadList
      .sort((a, b) => {
        const weightA = WEIGHTS[a.Type] || 0;
        const weightB = WEIGHTS[b.Type] || 0;

        if (weightA !== weightB) {
          return weightB - weightA; // Higher weight first
        }

        // Same weight, sort by timestamp (newest first)
        const timeA = new Date(a.Timestamp.replace(" ", "T")).getTime();
        const timeB = new Date(b.Timestamp.replace(" ", "T")).getTime();
        return timeB - timeA;
      })
      .slice(0, priorityCount); // Take top 'n'
  };

  const priorityNotifications = getPriorityNotifications();

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 6 }}>
      {/* Page Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 4 }}>
        <StarIcon sx={{ fontSize: "2.5rem", color: "#f59e0b" }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: "#0f172a", mb: 0.5, fontFamily: "'Outfit', sans-serif" }}>
            Priority Inbox
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b" }}>
            Viewing top unread notifications sorted by category weight (Placement &gt; Result &gt; Event) and recency.
          </Typography>
        </Box>
      </Box>

      {/* Configuration Controls */}
      <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: "12px", mb: 3, backgroundColor: "#f8fafc" }}>
        <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel id="priority-count-label">Show Top "N" Notifications</InputLabel>
                <Select
                  labelId="priority-count-label"
                  value={priorityCount}
                  label='Show Top "N" Notifications'
                  onChange={(e) => setPriorityCount(e.target.value)}
                  sx={{ borderRadius: "8px", backgroundColor: "#ffffff" }}
                >
                  <MenuItem value={10}>Top 10</MenuItem>
                  <MenuItem value={15}>Top 15</MenuItem>
                  <MenuItem value={20}>Top 20</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel id="priority-type-label">Filter by Category</InputLabel>
                <Select
                  labelId="priority-type-label"
                  value={typeFilter}
                  label="Filter by Category"
                  onChange={(e) => setTypeFilter(e.target.value)}
                  sx={{ borderRadius: "8px", backgroundColor: "#ffffff" }}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  <MenuItem value="Placement">Placements Only</MenuItem>
                  <MenuItem value="Result">Results Only</MenuItem>
                  <MenuItem value="Event">Events Only</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: "8px" }}>
          {error}
        </Alert>
      )}

      {/* Priority Notifications List */}
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
        ) : priorityNotifications.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8, border: "2px dashed #cbd5e1", borderRadius: "12px" }}>
            <Typography variant="h6" sx={{ color: "#64748b", mb: 1 }}>
              No priority notifications
            </Typography>
            <Typography variant="body2" sx={{ color: "#94a3b8" }}>
              All notifications have been read, or no matches found for your filter.
            </Typography>
          </Box>
        ) : (
          priorityNotifications.map((notification) => (
            <NotificationCard
              key={notification.ID}
              notification={notification}
              isRead={false} // items in priority inbox are unread
              onMarkRead={() => markAsRead(notification.ID)}
            />
          ))
        )}
      </Box>
    </Container>
  );
}
