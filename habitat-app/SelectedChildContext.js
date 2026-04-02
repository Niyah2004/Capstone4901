//child params are not being passed for each screen
import React, { useState , createContext, useContext } from "react";

const SelectedChildContext = createContext();

export const SelectedChildProvider = ({ children }) => {
  const [selectedChildId, setSelectedChildId] = useState(null);
  
  return (
    <SelectedChildContext.Provider value={{ selectedChildId, setSelectedChildId }}>
      {children}
    </SelectedChildContext.Provider>
  );
}

export function useSelectedChild() {
   const context = useContext(SelectedChildContext);
   if (!context) {
        throw new Error("useSelectedChild must be used within a SelectedChildProvider");
    }

    return context;
}