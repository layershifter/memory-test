import React from "react";
import { Button, Provider, teamsTheme } from "@fluentui/react-northstar";

function App() {
  return (
    <Provider theme={teamsTheme}>
      {Array.apply(null, Array(100)).map((_, i) => (
        <Button key={i}>{i}</Button>
      ))}
    </Provider>
  );
}

export default App;
