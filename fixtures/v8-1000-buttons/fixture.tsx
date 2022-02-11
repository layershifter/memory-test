import React from "react";
import { PrimaryButton, ThemeProvider } from "@fluentui/react";

function App() {
  return (
    <ThemeProvider>
      {Array.apply(null, Array(1000)).map((_, i) => (
        <PrimaryButton key={i}>{i}</PrimaryButton>
      ))}
    </ThemeProvider>
  );
}

export default App;
