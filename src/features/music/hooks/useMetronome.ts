import { useAudioPlayer } from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ensureMetronomeClick } from '../services/metronomeClick';

export function useMetronome(bpm: number) {
  const [clickUri, setClickUri] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [countInBeat, setCountInBeat] = useState<number | null>(null);
  const player = useAudioPlayer(clickUri ? { uri: clickUri } : null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const countTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    void ensureMetronomeClick().then(setClickUri);
  }, []);
  useEffect(
    () => () => {
      if (countTimer.current) clearInterval(countTimer.current);
    },
    [],
  );

  const click = useCallback(() => {
    if (!clickUri) return;
    void player.seekTo(0).then(() => player.play());
  }, [clickUri, player]);

  useEffect(() => {
    if (!isPlaying) return;
    click();
    timer.current = setInterval(click, 60000 / bpm);
    return () => {
      if (timer.current) clearInterval(timer.current);
      timer.current = null;
    };
  }, [bpm, click, isPlaying]);

  const toggle = useCallback(() => setIsPlaying((value) => !value), []);

  const countIn = useCallback(() => {
    if (countInBeat !== null) return;
    setIsPlaying(false);
    let beat = 1;
    setCountInBeat(beat);
    click();
    countTimer.current = setInterval(() => {
      beat += 1;
      if (beat > 4) {
        if (countTimer.current) clearInterval(countTimer.current);
        countTimer.current = null;
        setCountInBeat(null);
        setIsPlaying(true);
      } else {
        setCountInBeat(beat);
        click();
      }
    }, 60000 / bpm);
  }, [bpm, click, countInBeat]);

  return { countIn, countInBeat, isPlaying, toggle };
}
