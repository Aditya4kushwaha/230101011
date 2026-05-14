const axios = require("axios");

const {
  MinPriorityQueue,
} = require("@datastructures-js/priority-queue");



// ===============================
// API CONFIG
// ===============================

// REPLACE WITH ACTUAL API URL

const API_URL =
  "https://your-api-url.com/api/notifications";


// REPLACE WITH ACTUAL TOKEN

const TOKEN =
  "YOUR_BEARER_TOKEN";



// ===============================
// PRIORITY WEIGHTS
// ===============================

const typeWeights = {

  Placement: 3,

  Result: 2,

  Event: 1,

};



// ===============================
// CALCULATE PRIORITY SCORE
// ===============================

function calculatePriority(notification) {

  const typeWeight =
    typeWeights[notification.Type] || 0;


  const recencyScore =
    new Date(
      notification.Timestamp
    ).getTime();


  return (
    typeWeight * 10000000000000 +
    recencyScore
  );

}



// ===============================
// FETCH NOTIFICATIONS FROM API
// ===============================

async function fetchNotifications() {

  try {

    console.log(
      "\nFetching notifications from API...\n"
    );


    const response = await axios.get(
      API_URL,
      {
        headers: {

          Authorization:
            `Bearer ${TOKEN}`,

        },
      }
    );


    return response.data.notifications;

  } catch (error) {

    console.log(
      "API Fetch Error:",
      error.message
    );

    return [];

  }

}



// ===============================
// GET TOP PRIORITY NOTIFICATIONS
// ===============================

function getTopPriorityNotifications(
  notifications,
  topN = 10
) {

  const minHeap = new MinPriorityQueue(
    (item) => item.priority
  );


  for (const notification of notifications) {

    const priority =
      calculatePriority(notification);


    minHeap.enqueue({

      ID: notification.ID,

      Type: notification.Type,

      Message: notification.Message,

      Timestamp: notification.Timestamp,

      priority,

    });


    // KEEP ONLY TOP N

    if (minHeap.size() > topN) {

      minHeap.dequeue();

    }

  }


  const result = [];


  while (!minHeap.isEmpty()) {

    result.push(
      minHeap.dequeue()
    );

  }


  return result.sort(

    (a, b) => b.priority - a.priority

  );

}



// ===============================
// MAIN FUNCTION
// ===============================

async function main() {

  // FETCH API DATA

  const notifications =
    await fetchNotifications();


  console.log(
    `Total Notifications Fetched: ${notifications.length}\n`
  );


  // GET TOP 10

  const topNotifications =
    getTopPriorityNotifications(
      notifications,
      10
    );


  console.log(
    "\nTop Priority Notifications:\n"
  );


  console.table(topNotifications);

}



// RUN APPLICATION

main();