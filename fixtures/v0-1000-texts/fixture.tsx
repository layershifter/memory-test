import React from "react";
import { Text, Provider, teamsTheme } from "@fluentui/react-northstar";

function App() {
  return (
    <Provider theme={teamsTheme}>
      {Array.apply(null, Array(1000)).map((_, i) => (
        <Text key={i}>{i}</Text>
      ))}
    </Provider>
  );
}

export default App;
