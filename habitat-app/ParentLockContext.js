// ParentLockContext.js
import React, { createContext, useContext, useState } from "react";

const ParentLockContext = createContext(null);

export function ParentLockProvider({ children }) {
  const [isParentUnlocked, setIsParentUnlocked] = useState(false);

  const unlockParent = () => setIsParentUnlocked(true);
  const lockParent = () => setIsParentUnlocked(false);

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
