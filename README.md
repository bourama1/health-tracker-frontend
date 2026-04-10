# Health Tracker Frontend

A comprehensive personal health and fitness dashboard built with React, Material UI, and Recharts. This application allows users to track their workouts, body measurements, sleep patterns, and progress photos in one centralized place.

## 🚀 Features

- **Workout Tracking**: Create custom workout plans, log sessions, track Personal Records (PRs), and visualize muscle volume distribution.
- **Body Map Explorer**: Interactive anatomical visualization to explore exercises by target muscle groups.
- **Body Measurements**: Track weight and various body measurements over time with interactive charts and trendlines.
- **Progress Photos**: Seamlessly integrate with Google Photos to manage and view your fitness progress pictures with side-by-side comparison.
- **Sleep Logging**: Monitor your sleep duration and quality to ensure optimal recovery.
- **Dark/Light Mode**: Toggle between light and dark themes for a comfortable viewing experience.
- **Google Authentication**: Secure sign-in using Google OAuth.

## 🛠️ Tech Stack

- **Frontend**: [React](https://reactjs.org/)
- **UI Components**: [Material UI (MUI)](https://mui.com/)
- **Data Visualization**: [Recharts](https://recharts.org/)
- **Anatomical Visuals**: [@teambuildr/react-native-body-highlighter](https://github.com/TeamBuildr/react-native-body-highlighter)
- **API Client**: [Axios](https://axios-http.com/)
- **Testing**: [Jest](https://jestjs.io/) & [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

## 🏁 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1.  **Clone the repository**:

    ```bash
    git clone https://github.com/your-username/health-tracker-frontend.git
    cd health-tracker-frontend
    ```

2.  **Install dependencies**:

    ```bash
    npm install
    ```

3.  **Configure environment variables**:
    Create a `.env` file in the root directory and add your API URL:

    ```env
    REACT_APP_API_URL=http://localhost:5000
    ```

4.  **Start the development server**:
    ```bash
    npm start
    ```
    The app will be available at `http://localhost:3000`.

## 🧪 Running Tests

To run the test suite in interactive mode:

```bash
npm test
```

To run tests in CI mode:

```bash
CI=true npm test
```

## 📦 Building for Production

To create an optimized production build:

```bash
npm run build
```

The build artifacts will be stored in the `build/` directory.

## 🤝 Contributing

Contributions are welcome! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to get started.

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🛡️ Security

If you discover a security vulnerability within this project, please follow the instructions in our [SECURITY.md](SECURITY.md).
