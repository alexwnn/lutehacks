# Nomad

<img width="1920" height="1440" alt="app" src="https://github.com/user-attachments/assets/53155a55-8156-441c-9d5d-ac1fc5ff0c64" />


**Turn your daily steps into a mission.**

Nomad is a mobile app that tracks your steps in real time and recommends nearby places worth walking to — showing exactly how many steps you'll earn, how far it is, and how long it'll take. Tap a destination to get walking directions in Apple Maps or Google Maps.

Built for **LuteHacks 2026** — Health & Wellness Track.

---

## Tech Stack

<p>
  <img src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/react.png" width="50" alt="React Native" />
  <img src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/typescript.png" width="50" alt="TypeScript" />
  <img src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/expo.png" width="50" alt="Expo" />
  <img src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/python.png" width="50" alt="Python" />
  <img src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/flask.png" width="50" alt="Flask" />
</p>

| Layer       | Technology                                        |
| ----------- | ------------------------------------------------- |
| Mobile App  | React Native, TypeScript, Expo (managed workflow) |
| Navigation  | Expo Router                                       |
| Health Data | Apple HealthKit via `expo-sensors` (Pedometer)    |
| Location    | `expo-location`, `react-native-maps`              |
| Backend     | Flask (Python)                                    |
| Places API  | Google Places API (Nearby Search)                 |
| Distances   | Google Distance Matrix API (walking mode)         |
| AI Tools    | Claude Opus 4.6, Cursor                           |
| Storage     | AsyncStorage (on-device, no database)             |

---

## Features

- **Live step counter** with a condensed athletic font and real-time updates from HealthKit
- **Walking stick figure** that moves along a progress bar toward your daily goal
- **Faded map background** centered on your location (Nike Run Club-inspired)
- **Collapsible weekly activity chart** showing the last 7 days from HealthKit
- **Nearby place cards** with distance, walking time, and steps gained — powered by Google Places
- **Tap for directions** — choose between Apple Maps and Google Maps via action sheet
- **Custom onboarding** — name, height (with ruler picker + stick figure), step goal, then guided permission requests for Health and Location
- **Automatic dark mode** — follows system theme including the map
- **Personalized step estimates** using your height to calculate stride length

### Step Calculation

```
stride_length = 0.415 × height_in_inches
steps = (distance_miles × 5,280 × 12) / stride_length
```

---

## What's Next

- Multi-stop walking routes ("walk to the park → library → home = goal reached")
- Longer path options for more steps
- Apple Health sync for name & height
- User-defined favorite destinations
- Streaks, badges, and celebrations
- Loading animations while places fetch
