# Testing Guide

This directory contains tests for the backend application.

## Running Tests

To run all tests:

```bash
npm test
```

To run tests in watch mode (for development):

```bash
npm test -- --watch
```

To run tests with coverage:

```bash
npm test -- --coverage
```

## Test Structure

```
__tests__/
├── controllers/   # Tests for API controllers
├── middleware/    # Tests for middleware functions
├── services/      # Tests for business logic services
└── utils/         # Tests for utility functions
```

## Writing Tests

### Naming Conventions

- Test files should end with `.test.ts`
- Test files should be located in the same directory structure as the code they are testing

### Mocking

- Use Jest mocks for external dependencies
- Use mock implementations in the `__mocks__` directory for complex dependencies
- Use `jest.mock()` for simple dependency mocking

### Test Coverage

Aim for at least 80% code coverage for:

- All utility functions
- All middleware
- All controller logic
- Critical business logic

### Running Specific Tests

To run tests for a specific file:

```bash
npm test -- path/to/test/file.test.ts
```

To run tests matching a pattern:

```bash
npm test -- -t "pattern to match in test name"
```