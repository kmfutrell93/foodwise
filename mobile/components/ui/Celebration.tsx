import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, StyleSheet, AccessibilityInfo, ImageSourcePropType } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, Easing, runOnJS,
} from 'react-native-reanimated';
import LottieView, { AnimationObject } from 'lottie-react-native';
import { ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/context/ThemeContext';

export type CelebrationVariant = 'confetti' | 'success' | 'flame';
export type NoriPose = 'happy' | 'celebrate';

type Props = {
  /** Increment (or change) to fire a celebration. 0 / falsy = idle. */
  playKey: number;
  variant: CelebrationVariant;
  reduceMotion?: boolean;
  /** Optional Nori expression overlay (placeholder PNGs until real art lands). */
  noriPose?: NoriPose;
  /** Streak count-up target; when set, animates number beside flame. */
  countTo?: number;
  onDone?: () => void;
};

const SOURCES: Record<CelebrationVariant, AnimationObject> = {
  confetti: require('@/assets/lottie/confetti.json') as AnimationObject,
  success: require('@/assets/lottie/success.json') as AnimationObject,
  flame: require('@/assets/lottie/streak-flame.json') as AnimationObject,
};

const NORI: Record<NoriPose, ImageSourcePropType> = {
  happy: require('@/assets/images/nori_happy.png'),
  celebrate: require('@/assets/images/nori_celebrate.png'),
};

/**
 * Lazy-mounted celebration overlay.
 * Plays once on playKey change; auto-hides when finished.
 * When reduceMotion: shows static end frame (or Nori only) briefly — no motion.
 */
export function Celebration({
  playKey,
  variant,
  reduceMotion: reduceMotionProp,
  noriPose,
  countTo,
  onDone,
}: Props) {
  const colors = useThemeColors();
  const s = makeStyles(colors);
  const [active, setActive] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(!!reduceMotionProp);
  const lottieRef = useRef<LottieView>(null);
  const lastKey = useRef(0);
  const opacity = useSharedValue(0);
  const countAnim = useSharedValue(0);
  const [displayCount, setDisplayCount] = useState(0);

  useEffect(() => {
    if (reduceMotionProp !== undefined) {
      setReduceMotion(reduceMotionProp);
      return;
    }
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (alive) setReduceMotion(v);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      alive = false;
      sub.remove();
    };
  }, [reduceMotionProp]);

  const finish = () => {
    opacity.value = withTiming(0, { duration: reduceMotion ? 120 : 280 }, (finished) => {
      if (finished) runOnJS(setActive)(false);
    });
    onDone?.();
  };

  useEffect(() => {
    if (!playKey || playKey === lastKey.current) return;
    lastKey.current = playKey;
    setActive(true);
    opacity.value = withTiming(1, { duration: reduceMotion ? 0 : 180 });

    if (typeof countTo === 'number' && countTo > 0) {
      if (reduceMotion) {
        setDisplayCount(countTo);
      } else {
        countAnim.value = 0;
        countAnim.value = withTiming(countTo, {
          duration: 700,
          easing: Easing.out(Easing.cubic),
        }, () => {
          runOnJS(setDisplayCount)(countTo);
        });
        // Lightweight JS ticker for displayed integer
        const start = Date.now();
        const from = Math.max(0, countTo - 1);
        const tick = () => {
          const t = Math.min(1, (Date.now() - start) / 700);
          setDisplayCount(Math.round(from + (countTo - from) * t));
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }

    if (reduceMotion) {
      // Static end frame only — no Lottie playback
      const t = setTimeout(finish, 900);
      return () => clearTimeout(t);
    }

    // Allow Lottie to mount, then play once; safety timeout if onAnimationFinish never fires
    const start = setTimeout(() => {
      lottieRef.current?.reset();
      lottieRef.current?.play();
    }, 16);
    const safety = setTimeout(finish, 2800);
    return () => {
      clearTimeout(start);
      clearTimeout(safety);
    };
  }, [playKey, reduceMotion, countTo]);

  const wrapStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!active) return null;

  return (
    <Animated.View
      style={[s.overlay, wrapStyle]}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {reduceMotion ? (
        <View style={s.staticWrap}>
          <LottieView
            source={SOURCES[variant]}
            style={s.lottie}
            progress={1}
            loop={false}
            autoPlay={false}
          />
        </View>
      ) : (
        <LottieView
          ref={lottieRef}
          source={SOURCES[variant]}
          style={s.lottie}
          loop={false}
          autoPlay={false}
          onAnimationFinish={(cancelled) => {
            if (!cancelled) finish();
          }}
        />
      )}

      {noriPose ? (
        <Image source={NORI[noriPose]} style={s.nori} resizeMode="contain" accessibilityLabel="Nori celebrating" />
      ) : null}

      {typeof countTo === 'number' && countTo > 0 ? (
        <Text style={s.count}>{displayCount}</Text>
      ) : null}
    </Animated.View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 100,
      alignItems: 'center',
      justifyContent: 'center',
    },
    staticWrap: { alignItems: 'center', justifyContent: 'center' },
    lottie: { width: 280, height: 280 },
    nori: {
      position: 'absolute',
      bottom: '22%',
      width: 96,
      height: 96,
    },
    count: {
      position: 'absolute',
      top: '28%',
      fontSize: 48,
      fontFamily: 'PlusJakartaSans-ExtraBold',
      color: c.primary,
      textShadowColor: 'rgba(0,0,0,0.35)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 8,
    },
  });
}
