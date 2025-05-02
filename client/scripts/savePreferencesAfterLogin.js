export async function savePreferencesAfterLogin() {
  console.log("🧠 Running savePreferencesAfterLogin()...");
  const token = localStorage.getItem("token");
  if (!token) {
    console.error("No token found — cannot save preferences.");
    return;
  }

  const preferences = {};

  // Gather EVERYTHING in localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key !== "token") {
      const value = localStorage.getItem(key);
      preferences[key] = parseLocalStorageValue(value);
    }
  }

  // 🛠 Safely expand weightRaw
  const weightRawItem = localStorage.getItem("weightRaw");
  let weightRaw = null;
  if (weightRawItem) {
    try {
      weightRaw = JSON.parse(weightRawItem);
      if (weightRaw.unit && weightRaw.value) {
        preferences.units = weightRaw.unit;
        preferences.startWeight = weightRaw.value;
      }
    } catch (e) {
      console.error("❌ Error parsing weightRaw:", e);
    }
  }

  preferences.savedAt = new Date().toISOString();

  // ✅ Now safe to log
  console.log("✅ Preferences object built:", preferences);

  try {
    const res = await fetch("/api/saveUserPreferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(preferences)
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.message || "Failed to save preferences");
    }

    console.log("✅ Preferences saved successfully after login/signup!");
  } catch (err) {
    console.error("❌ Failed to save preferences after login:", err);
    alert("There was a problem saving your preferences. Please try again later.");
  }
}

function parseLocalStorageValue(value) {
  try {
    return JSON.parse(value);
  } catch (e) {
    return value;
  }
}
