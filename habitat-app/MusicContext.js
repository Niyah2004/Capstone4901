import React, { createContext, useContext, useState, useEffect } from 'react';
import { Audio } from 'expo-av';

const MusicContext = createContext({
  isMusicPlaying: false,
  toggleMusic: () => {},
});

export function MusicProvider({ children }) {
  const [sound, setSound] = useState()
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  useEffect(() => {
    // Clean up sound on unmount
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const initAudio = async () => {
    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
         require('./assets/bgm.wav'),
         { isLooping: true, shouldPlay: true, volume: 0.3 }
      );
      setSound(newSound);
      setIsMusicPlaying(true);
    } catch (e) {
      console.warn("Could not load gamified soundtrack:", e);
      alert("Failed to play background music. It could be an audio setting or simulator limitation.");
    }
  };

  const toggleMusic = async () => {
    if (!sound) {
      // First time turning on
      await initAudio();
    } else {
      if (isMusicPlaying) {
        await sound.pauseAsync();
        setIsMusicPlaying(false);
      } else {
        await sound.playAsync();
        setIsMusicPlaying(true);
      }
    }
  };

  return (
    <MusicContext.Provider value={{ isMusicPlaying, toggleMusic }}>
      {children}
    </MusicContext.Provider>
  );
}

export const useMusic = () => useContext(MusicContext);
