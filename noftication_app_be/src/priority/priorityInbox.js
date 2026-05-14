const {
  MinPriorityQueue,
} = require("@datastructures-js/priority-queue");

const notifications = require("./sampleData");



// PRIORITY WEIGHTS

const typeWeights = {

  Placement: 3,

  Result: 2,

  Event: 1,

};



// CALCULATE PRIORITY SCORE

function calculatePriority(notification) {

  const typeWeight =
    typeWeights[notification.notificationType] || 0;


  // RECENCY SCORE

  const recencyScore =
    new Date(notification.createdAt).getTime();


  // FINAL PRIORITY SCORE

  return (
    typeWeight * 10000000000000 +
    recencyScore
  );

}



// GET TOP PRIORITY NOTIFICATIONS

function getTopPriorityNotifications(
  notifications,
  topN = 10
) {

  // MIN HEAP

  const minHeap = new MinPriorityQueue(
    (item) => item.priority
  );


  for (const notification of notifications) {

    // SKIP READ NOTIFICATIONS

    if (notification.isRead) continue;


    // CALCULATE PRIORITY

    const priority =
      calculatePriority(notification);


    // INSERT INTO HEAP

    minHeap.enqueue({

      ...notification,

      priority,

    });


    // KEEP ONLY TOP N

    if (minHeap.size() > topN) {

      minHeap.dequeue();

    }

  }


  const result = [];


  // EXTRACT FROM HEAP

  while (!minHeap.isEmpty()) {

    result.push(
      minHeap.dequeue()
    );

  }


  // SORT DESCENDING

  return result.sort(

    (a, b) => b.priority - a.priority

  );

}



// EXECUTE FUNCTION

const topNotifications =
  getTopPriorityNotifications(
    notifications,
    10
  );



console.log("\nTop Priority Notifications:\n");

console.table(topNotifications);