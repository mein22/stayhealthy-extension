// Request notification permission when extension loads
chrome.runtime.onInstalled.addListener(() => {
  // Check if notification permission is already granted
  chrome.permissions.contains(
    {
      permissions: ["notifications"],
    },
    (result) => {
      // If not granted, request notification permission
      if (!result) {
        chrome.permissions.request({
          permissions: ["notifications"],
        });
      }
    }
  );

  // Log the current notification permission level
  chrome.notifications.getPermissionLevel((permissionLevel) => {
    console.log("Notification permission level:", permissionLevel);
  });
});

// Listen for alarm events
chrome.alarms.onAlarm.addListener((alarm) => {
  // If the alarm is for "stay_healthy", show a notification
  if (alarm.name === "stay_healthy") {
    chrome.notifications.create(
      {
        type: "basic",
        iconUrl: "alarm.png",
        title: "Stay Healthy!",
        message: "Time to take a break!",
        priority: 2,
        requireInteraction: true, // Notification stays until dismissed
      },
      function (notificationId) {
        console.log("Notification sent:", notificationId);
        // Log any errors that occur when sending the notification
        if (chrome.runtime.lastError) {
          console.error("Notification error:", chrome.runtime.lastError);
        }
      }
    );
  }
});

// Listen for messages from other parts of the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    // Handle reset action: clear the "stay_healthy" alarm
    if (request.action === "reset") {
      chrome.alarms.clear("stay_healthy", () => {
        if (chrome.runtime.lastError) {
          console.error("Error clearing alarm:", chrome.runtime.lastError);
          sendResponse({ success: false, error: chrome.runtime.lastError });
        } else {
          sendResponse({ success: true });
        }
      });
      return true; // Indicates async response
    }

    // Handle setting a new alarm time
    if (request.time) {
      const minutes = parseInt(request.time);
      // Validate the time value
      if (isNaN(minutes) || minutes <= 0 || minutes > 999) {
        sendResponse({ success: false, error: "Invalid time value" });
        return true;
      }

      // Create a new alarm
      createAlarm(minutes);
      sendResponse({ success: true });
    }
  } catch (error) {
    // Catch and log any errors in the message handler
    console.error("Error in message handler:", error);
    sendResponse({ success: false, error: error.message });
  }
  return true; // Indicates async response
});

// Helper function to create or reset the alarm
function createAlarm(minutes) {
  console.log("Creating alarm for", minutes, "minutes");
  // Clear any existing "stay_healthy" alarm before creating a new one
  chrome.alarms.clear("stay_healthy", () => {
    chrome.alarms.create("stay_healthy", {
      delayInMinutes: minutes, // Initial delay
      periodInMinutes: minutes, // Repeat interval
    });
    console.log("Alarm created successfully");

    // Log the current alarm details for verification
    chrome.alarms.get("stay_healthy", (alarm) => {
      console.log("Current alarm:", alarm);
    });
 });
}

