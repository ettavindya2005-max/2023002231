import axios from "axios";
import { Log } from "../logging_middleware/logger.js";
import { getValidToken } from "../logging_middleware/token_helper.js";

// Priority weights based on Type: Placement (3) > Result (2) > Event (1)
const WEIGHTS = {
  "Placement": 3,
  "Result": 2,
  "Event": 1
};

// Min-Heap implementation to efficiently maintain top N items
class MinHeap {
  constructor(compareFn) {
    this.heap = [];
    this.compare = compareFn;
  }

  size() {
    return this.heap.length;
  }

  peek() {
    return this.heap[0];
  }

  push(val) {
    this.heap.push(val);
    this.up(this.heap.length - 1);
  }

  pop() {
    if (this.heap.length === 0) return null;
    const top = this.heap[0];
    const bottom = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = bottom;
      this.down(0);
    }
    return top;
  }

  up(i) {
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.compare(this.heap[i], this.heap[p]) < 0) {
        this.swap(i, p);
        i = p;
      } else {
        break;
      }
    }
  }

  down(i) {
    const len = this.heap.length;
    while ((i << 1) + 1 < len) {
      let left = (i << 1) + 1;
      let right = left + 1;
      let best = i;
      if (this.compare(this.heap[left], this.heap[best]) < 0) {
        best = left;
      }
      if (right < len && this.compare(this.heap[right], this.heap[best]) < 0) {
        best = right;
      }
      if (best !== i) {
        this.swap(i, best);
        i = best;
      } else {
        break;
      }
    }
  }

  swap(i, j) {
    const temp = this.heap[i];
    this.heap[i] = this.heap[j];
    this.heap[j] = temp;
  }
}

// Compare function: returns negative if A has lower priority than B
function compareNotifications(a, b) {
  const weightA = WEIGHTS[a.Type] || 0;
  const weightB = WEIGHTS[b.Type] || 0;

  if (weightA !== weightB) {
    return weightA - weightB; // Lower weight = lower priority
  }

  // If weights are equal, compare timestamps (older = lower priority)
  const timeA = new Date(a.Timestamp.replace(" ", "T")).getTime();
  const timeB = new Date(b.Timestamp.replace(" ", "T")).getTime();
  return timeA - timeB;
}

// Main execution function
async function getTopNNotifications(n = 10) {
  try {
    console.log(`=== Initializing Priority Inbox Fetcher ===`);
    // Ensure log messages are <= 48 chars
    await Log("backend", "info", "service", "Starting priority fetch.");

    // 1. Get a valid authorization token
    const token = await getValidToken();
    if (!token) {
      throw new Error("Auth failed.");
    }

    // 2. Fetch notifications from the API across multiple pages
    // Since max limit is 10, we fetch 5 pages to get 50 notifications
    const limit = 10;
    const totalPages = 5;
    let allNotifications = [];

    console.log(`Fetching 50 items (5 pages)...`);
    for (let page = 1; page <= totalPages; page++) {
      const url = `http://4.224.186.213/evaluation-service/notifications?limit=${limit}&page=${page}`;
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const pageNotifications = response.data.notifications || [];
      allNotifications = allNotifications.concat(pageNotifications);
    }

    console.log(`Fetched ${allNotifications.length} notifications total.`);

    // 3. Process notifications using the Min-Heap to find top N
    const heap = new MinHeap(compareNotifications);

    for (const notification of allNotifications) {
      if (heap.size() < n) {
        heap.push(notification);
      } else {
        // If the current notification has higher priority than the heap's minimum, swap it
        if (compareNotifications(notification, heap.peek()) > 0) {
          heap.pop();
          heap.push(notification);
        }
      }
    }

    // 4. Extract items from the heap and sort in descending order (highest priority first)
    const result = [];
    while (heap.size() > 0) {
      result.push(heap.pop());
    }
    result.reverse(); // Reverse so highest priority is first

    // 5. Display the result in a clean tabular format
    console.log("\n=== TOP 10 PRIORITY NOTIFICATIONS ===");
    console.table(
      result.map((item, index) => ({
        "Rank": index + 1,
        "Type": item.Type,
        "Message": item.Message,
        "Timestamp": item.Timestamp,
        "ID": item.ID.substring(0, 8) + "..."
      }))
    );

    await Log("backend", "info", "service", "Priority fetch completed.");

    return result;
  } catch (error) {
    console.error("Error in Priority Inbox processor:", error.message);
    await Log("backend", "error", "service", "Priority fetch failed.");
  }
}

// Execute the processor
getTopNNotifications(10);
