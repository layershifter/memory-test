import React from "react";
import {
  Button,
  FluentProvider,
  webLightTheme,
} from "@fluentui/react-components";

function App() {
  return (
    <FluentProvider theme={webLightTheme}>
      {Array.apply(null, Array(1000)).map((_, i) => (
        <Button key={i}>{i}</Button>
      ))}
    </FluentProvider>
  );
}

export default App;
