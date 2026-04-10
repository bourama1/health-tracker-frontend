# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Body Map Explorer**: Interactive anatomical model in the Exercise Library for muscle-based filtering.
- **Chart Utilities**: Extracted reusable logic for trendline calculation, axis domain scaling, and date formatting across all tracking components.
- Expanded test suites for Measurements, Sleep, and Workouts components, increasing coverage and reliability.
- CI/CD workflow enhancements for automated testing on every push and pull request.

### Changed

- Refactored `ExerciseLibrary`, `Measurements`, `Sleep`, and `Workouts` to use centralized chart utilities.
- Improved Exercise Library pagination and search performance.
- Enhanced accessibility and responsiveness across tracking dashboards.

## [0.2.0] - 2026-04-10

### Added

- Comprehensive README.md with project overview, features, and setup instructions.
- ISC License file.
- Contributing guidelines (CONTRIBUTING.md).
- Code of Conduct (CODE_OF_CONDUCT.md).
- Security policy (SECURITY.md).
- This changelog file.

## [0.1.0] - 2025-05-15

### Added

- Initial project release.
- Core features: Workouts, Measurements, Photos, and Sleep tracking.
- Material UI integration for a modern, responsive interface.
- Dark mode support.
- Recharts for data visualization.
- Google Authentication for secure access.
