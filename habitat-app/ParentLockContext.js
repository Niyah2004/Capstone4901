// ParentLockContext.js
import React, { createContext, useContext, useState } from "react";

const ParentLockContext = createContext(null);

export function ParentLockProvider({ children }) {
  const [isParentUnlocked, setIsParentUnlocked] = useState(false);

  const unlockParent = () => {
      console.log("🔓Parent unlocked");
      setIsParentUnlocked(true);
    };
  const lockParent = () => {
      console.log("🔒Parent locked");
      setIsParentUnlocked(false);
    };

  return (
    <ParentLockContext.Provider
      value={{ isParentUnlocked, unlockParent, lockParent }}
    >
      {children}
    </ParentLockContext.Provider>
  );
}

export function useParentLock() {
  const ctx = useContext(ParentLockContext);
  if (!ctx) {
    throw new Error("useParentLock must be used inside ParentLockProvider");
  }
  return ctx;
}
