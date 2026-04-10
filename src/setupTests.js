// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

jest.mock('@teambuildr/react-native-body-highlighter', () => {
  return function DummyBody(props) {
    return <div data-testid="body-highlighter" {...props} />;
  };
});

jest.mock('./vendor/body-highlighter', () => {
  return function DummyBody(props) {
    return <div data-testid="body-highlighter" {...props} />;
  };
});
