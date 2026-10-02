import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, StyleProp, ViewStyle } from 'react-native';
import Svg, {
  Path,
  Circle,
  Ellipse,
  G,
  Defs,
  LinearGradient,
  Stop,
  Rect,
} from 'react-native-svg';
import { ThemeColors } from '@/constants/theme';

// ── 1. CUTE ANIMATED READING BUNNY / OWL MASCOT (FOR LOADING) ──────────────────
export function CuteLoadingBunny({ size = 150, style }: { size?: number; style?: StyleProp<ViewStyle> }) {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const starPulse = useRef(new Animated.Value(1)).current;
  const earWiggle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Floating bounce
    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -12,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    // Star sparkle pulse
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(starPulse, {
          toValue: 1.25,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(starPulse, {
          toValue: 0.9,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    // Ear cute wiggle
    const wiggle = Animated.loop(
      Animated.sequence([
        Animated.timing(earWiggle, {
          toValue: 4,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(earWiggle, {
          toValue: -4,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(earWiggle, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    );

    float.start();
    pulse.start();
    wiggle.start();

    return () => {
      float.stop();
      pulse.stop();
      wiggle.stop();
    };
  }, [floatAnim, starPulse, earWiggle]);

  return (
    <View style={[{ width: size, height: size }, styles.center, style]}>
      <Animated.View
        style={{
          width: size,
          height: size,
          transform: [{ translateY: floatAnim }],
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Svg width={size} height={size} viewBox="0 0 200 200" fill="none">
          <Defs>
            <LinearGradient id="bgBubble" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#EAF7EE" />
              <Stop offset="100%" stopColor="#D1F2DD" />
            </LinearGradient>
            <LinearGradient id="bunnyBody" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#FFFFFF" />
              <Stop offset="100%" stopColor="#FFF7ED" />
            </LinearGradient>
            <LinearGradient id="bookGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#34D399" />
              <Stop offset="100%" stopColor="#059669" />
            </LinearGradient>
          </Defs>

          {/* Soft mint backdrop bubble */}
          <Circle cx="100" cy="105" r="75" fill="url(#bgBubble)" />
          <Circle cx="100" cy="105" r="68" fill="#FFFFFF" opacity={0.6} />

          {/* Floating magic sparkles */}
          <Circle cx="35" cy="65" r="4.5" fill="#FBBF24" />
          <Circle cx="165" cy="70" r="5" fill="#F472B6" />
          <Circle cx="150" cy="145" r="4" fill="#60A5FA" />
          <Circle cx="40" cy="135" r="3.5" fill="#34D399" />

          {/* Bunny Ears */}
          <G transform="translate(100, 50)">
            {/* Left Ear */}
            <G transform="translate(-24, -25) rotate(-10)">
              <Ellipse cx="0" cy="0" rx="14" ry="32" fill="#FFFFFF" stroke="#E2ECE6" strokeWidth="2.5" />
              <Ellipse cx="0" cy="2" rx="8" ry="22" fill="#FCE7F3" />
            </G>
            {/* Right Ear */}
            <G transform="translate(24, -25) rotate(12)">
              <Ellipse cx="0" cy="0" rx="14" ry="32" fill="#FFFFFF" stroke="#E2ECE6" strokeWidth="2.5" />
              <Ellipse cx="0" cy="2" rx="8" ry="22" fill="#FCE7F3" />
            </G>
          </G>

          {/* Bunny Head */}
          <Ellipse cx="100" cy="90" rx="46" ry="40" fill="url(#bunnyBody)" stroke="#E2ECE6" strokeWidth="2.5" />

          {/* Chubby cheeks blush */}
          <Circle cx="72" cy="98" r="9" fill="#F472B6" opacity={0.5} />
          <Circle cx="128" cy="98" r="9" fill="#F472B6" opacity={0.5} />

          {/* Cute Smart Glasses for reading */}
          {/* Left lens */}
          <Circle cx="82" cy="85" r="14" fill="#FFFFFF" stroke="#059669" strokeWidth="3" />
          {/* Right lens */}
          <Circle cx="118" cy="85" r="14" fill="#FFFFFF" stroke="#059669" strokeWidth="3" />
          {/* Glasses bridge */}
          <Path d="M 96 85 Q 100 82 104 85" stroke="#059669" strokeWidth="3" fill="none" strokeLinecap="round" />

          {/* Big Sparkly Anime Eyes */}
          {/* Left eye */}
          <Circle cx="83" cy="85" r="6" fill="#1E293B" />
          <Circle cx="81" cy="83" r="2.2" fill="#FFFFFF" />
          <Circle cx="85" cy="87" r="1.2" fill="#FFFFFF" />
          {/* Right eye */}
          <Circle cx="117" cy="85" r="6" fill="#1E293B" />
          <Circle cx="115" cy="83" r="2.2" fill="#FFFFFF" />
          <Circle cx="119" cy="87" r="1.2" fill="#FFFFFF" />

          {/* Cute little nose */}
          <Path d="M 97 94 Q 100 96 103 94 Z" fill="#FB7185" />
          {/* Happy smile */}
          <Path d="M 96 98 Q 100 102 104 98" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" fill="none" />

          {/* Open Storybook Held by Bunny */}
          <G transform="translate(62, 118)">
            {/* Shadow under book */}
            <Ellipse cx="38" cy="38" rx="42" ry="7" fill="#CBD5E1" opacity={0.4} />

            {/* Left Page */}
            <Path
              d="M 38 30 C 22 25 6 27 2 30 L 5 4 C 14 2 26 1 38 7 Z"
              fill="#FFFFFF"
              stroke="#059669"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Left page colorful lines */}
            <Path d="M 12 12 Q 22 10 30 14" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
            <Path d="M 12 18 Q 22 16 30 20" stroke="#F472B6" strokeWidth="2" strokeLinecap="round" />
            <Path d="M 12 24 Q 22 22 30 26" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" />

            {/* Right Page */}
            <Path
              d="M 38 30 C 54 25 70 27 74 30 L 71 4 C 62 2 50 1 38 7 Z"
              fill="#ECFDF5"
              stroke="#059669"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Right page colorful lines */}
            <Path d="M 46 12 Q 56 10 64 13" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
            <Path d="M 46 18 Q 56 16 64 19" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
            <Path d="M 46 24 Q 56 22 64 25" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />

            {/* Book Spine */}
            <Path d="M 38 7 L 38 30" stroke="#047857" strokeWidth="2.5" strokeLinecap="round" />

            {/* Cute Little Bunny Paws holding book */}
            <Ellipse cx="4" cy="22" rx="7" ry="6" fill="#FFFFFF" stroke="#E2ECE6" strokeWidth="2" />
            <Ellipse cx="72" cy="22" rx="7" ry="6" fill="#FFFFFF" stroke="#E2ECE6" strokeWidth="2" />
          </G>

          {/* Floating Twinkling Golden Star */}
          <G transform="translate(138, 38)">
            <Path
              d="M 12 2 L 15 9 L 22 10 L 17 15 L 18 22 L 12 18 L 6 22 L 7 15 L 2 10 L 9 9 Z"
              fill="#FBBF24"
              stroke="#D97706"
              strokeWidth="1.5"
            />
            {/* Star smiling eyes */}
            <Circle cx="10" cy="11" r="1.2" fill="#78350F" />
            <Circle cx="14" cy="11" r="1.2" fill="#78350F" />
          </G>
        </Svg>
      </Animated.View>
    </View>
  );
}

// ── 2. CUTE CARING PUPPY/BEAR WITH BAND-AID (FOR ERROR STATE) ──────────────────
export function CuteErrorBear({ size = 150, style }: { size?: number; style?: StyleProp<ViewStyle> }) {
  const swayAnim = useRef(new Animated.Value(0)).current;
  const heartFloat = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Gentle caring sway
    const sway = Animated.loop(
      Animated.sequence([
        Animated.timing(swayAnim, {
          toValue: -4,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(swayAnim, {
          toValue: 4,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(swayAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );

    // Heart floating
    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(heartFloat, {
          toValue: -8,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(heartFloat, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );

    sway.start();
    float.start();

    return () => {
      sway.stop();
      float.stop();
    };
  }, [swayAnim, heartFloat]);

  return (
    <View style={[{ width: size, height: size }, styles.center, style]}>
      <Animated.View
        style={{
          width: size,
          height: size,
          transform: [{ rotate: swayAnim.interpolate({ inputRange: [-10, 10], outputRange: ['-10deg', '10deg'] }) }],
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Svg width={size} height={size} viewBox="0 0 200 200" fill="none">
          <Defs>
            <LinearGradient id="bgError" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#FFF1F2" />
              <Stop offset="100%" stopColor="#FFE4E6" />
            </LinearGradient>
            <LinearGradient id="bearBody" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#FDE68A" />
              <Stop offset="100%" stopColor="#F59E0B" />
            </LinearGradient>
          </Defs>

          {/* Warm soft pink/coral backdrop circle */}
          <Circle cx="100" cy="105" r="75" fill="url(#bgError)" />
          <Circle cx="100" cy="105" r="66" fill="#FFFFFF" opacity={0.6} />

          {/* Bear Round Ears */}
          {/* Left Ear */}
          <Circle cx="64" cy="62" r="18" fill="#F59E0B" stroke="#D97706" strokeWidth="2" />
          <Circle cx="64" cy="62" r="10" fill="#FEF3C7" />
          {/* Right Ear */}
          <Circle cx="136" cy="62" r="18" fill="#F59E0B" stroke="#D97706" strokeWidth="2" />
          <Circle cx="136" cy="62" r="10" fill="#FEF3C7" />

          {/* Bear Head */}
          <Circle cx="100" cy="98" r="48" fill="url(#bearBody)" stroke="#D97706" strokeWidth="2" />

          {/* Snout Muzzle */}
          <Ellipse cx="100" cy="112" rx="22" ry="16" fill="#FFFFFF" />

          {/* Caring big puppy eyes */}
          <Circle cx="82" cy="96" r="6" fill="#451A03" />
          <Circle cx="80" cy="94" r="2" fill="#FFFFFF" />
          <Circle cx="118" cy="96" r="6" fill="#451A03" />
          <Circle cx="116" cy="94" r="2" fill="#FFFFFF" />

          {/* Little nose & gentle encouraging smile */}
          <Ellipse cx="100" cy="106" rx="6" ry="4" fill="#78350F" />
          <Path d="M 94 116 Q 100 121 106 116" stroke="#78350F" strokeWidth="2.2" strokeLinecap="round" fill="none" />

          {/* Blushing cheeks */}
          <Circle cx="68" cy="108" r="8" fill="#FB7185" opacity={0.5} />
          <Circle cx="132" cy="108" r="8" fill="#FB7185" opacity={0.5} />

          {/* Cute Colorful Band-Aid on Forehead */}
          <G transform="translate(100, 68) rotate(-18)">
            <Rect x="-18" y="-7" width="36" height="14" rx="6" fill="#FEF08A" stroke="#CA8A04" strokeWidth="1.5" />
            <Circle cx="-6" cy="0" r="1.5" fill="#EAB308" />
            <Circle cx="0" cy="0" r="1.5" fill="#EAB308" />
            <Circle cx="6" cy="0" r="1.5" fill="#EAB308" />
            {/* Little heart on bandaid */}
            <Path d="M 0 -3 C -2 -5 -5 -3 -5 -1 C -5 2 0 4 0 4 C 0 4 5 2 5 -1 C 5 -3 2 -5 0 -3 Z" fill="#F43F5E" />
          </G>

          {/* Bear holding magnifying glass / encouragement flower */}
          <G transform="translate(42, 115) rotate(15)">
            <Circle cx="14" cy="14" r="12" fill="#E0F2FE" stroke="#0284C7" strokeWidth="3" opacity={0.9} />
            <Path d="M 23 23 L 34 34" stroke="#0369A1" strokeWidth="4" strokeLinecap="round" />
            <Circle cx="10" cy="10" r="3" fill="#FFFFFF" opacity={0.8} />
          </G>

          {/* Floating encouragement heart */}
          <G transform="translate(142, 42)">
            <Path
              d="M 12 5 C 9 1 3 3 3 8 C 3 13 12 18 12 18 C 12 18 21 13 21 8 C 21 3 15 1 12 5 Z"
              fill="#F43F5E"
            />
          </G>
        </Svg>
      </Animated.View>
    </View>
  );
}

// ── 3. CUTE TREASURE CHEST & SMILING STAR (FOR EMPTY STATE) ───────────────────
export function CuteEmptyChest({ size = 150, style }: { size?: number; style?: StyleProp<ViewStyle> }) {
  const jumpAnim = useRef(new Animated.Value(0)).current;
  const starWiggle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Joyful little star jump
    const jump = Animated.loop(
      Animated.sequence([
        Animated.timing(jumpAnim, {
          toValue: -14,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(jumpAnim, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );

    const wiggle = Animated.loop(
      Animated.sequence([
        Animated.timing(starWiggle, {
          toValue: 8,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(starWiggle, {
          toValue: -8,
          duration: 350,
          useNativeDriver: true,
        }),
      ])
    );

    jump.start();
    wiggle.start();

    return () => {
      jump.stop();
      wiggle.stop();
    };
  }, [jumpAnim, starWiggle]);

  return (
    <View style={[{ width: size, height: size }, styles.center, style]}>
      <Svg width={size} height={size} viewBox="0 0 200 200" fill="none">
        <Defs>
          <LinearGradient id="bgEmpty" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#FEF3C7" />
            <Stop offset="100%" stopColor="#FDE68A" />
          </LinearGradient>
          <LinearGradient id="chestWood" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#B45309" />
            <Stop offset="100%" stopColor="#78350F" />
          </LinearGradient>
          <LinearGradient id="goldTrim" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="#FDE047" />
            <Stop offset="100%" stopColor="#EAB308" />
          </LinearGradient>
        </Defs>

        {/* Soft cheerful sun glow circle */}
        <Circle cx="100" cy="105" r="75" fill="url(#bgEmpty)" opacity={0.6} />
        <Circle cx="100" cy="105" r="66" fill="#FFFFFF" opacity={0.7} />

        {/* Floating colorful confetti */}
        <Circle cx="35" cy="60" r="4" fill="#EC4899" />
        <Circle cx="165" cy="65" r="5" fill="#3B82F6" />
        <Circle cx="45" cy="135" r="4.5" fill="#10B981" />
        <Circle cx="160" cy="130" r="3.5" fill="#F59E0B" />
        <Rect x="145" y="45" width="8" height="8" rx="2" fill="#8B5CF6" transform="rotate(25 145 45)" />
        <Rect x="45" y="85" width="7" height="7" rx="2" fill="#F59E0B" transform="rotate(15 45 85)" />

        {/* Treasure Chest Base */}
        <G transform="translate(48, 105)">
          {/* Shadow */}
          <Ellipse cx="52" cy="50" rx="55" ry="10" fill="#92400E" opacity={0.2} />

          {/* Chest main box */}
          <Rect x="4" y="10" width="96" height="42" rx="10" fill="url(#chestWood)" stroke="#451A03" strokeWidth="2.5" />

          {/* Golden bands on chest */}
          <Rect x="16" y="10" width="12" height="42" fill="url(#goldTrim)" />
          <Rect x="76" y="10" width="12" height="42" fill="url(#goldTrim)" />

          {/* Keyhole plate */}
          <Rect x="44" y="14" width="16" height="18" rx="4" fill="url(#goldTrim)" stroke="#A16207" strokeWidth="1.5" />
          <Circle cx="52" cy="20" r="3" fill="#451A03" />
          <Path d="M 52 22 L 52 28" stroke="#451A03" strokeWidth="2.5" strokeLinecap="round" />
        </G>

        {/* Open Chest Lid (Tilted back) */}
        <G transform="translate(44, 76)">
          <Path
            d="M 6 30 C 6 8 35 2 56 2 C 77 2 106 8 106 30 Z"
            fill="url(#chestWood)"
            stroke="#451A03"
            strokeWidth="2.5"
          />
          {/* Gold bands on lid */}
          <Path d="M 20 28 C 20 12 25 5 28 3 L 38 3 C 35 6 32 14 32 28 Z" fill="url(#goldTrim)" />
          <Path d="M 76 28 C 76 14 73 6 70 3 L 80 3 C 83 5 88 12 88 28 Z" fill="url(#goldTrim)" />
        </G>

        {/* Cheerful Golden Star character popping out waving */}
        <G transform="translate(100, 68)">
          {/* Star Body */}
          <Path
            d="M 0 -32 L 8 -12 L 30 -10 L 14 6 L 18 28 L 0 16 L -18 28 L -14 6 L -30 -10 L -8 -12 Z"
            fill="#FBBF24"
            stroke="#D97706"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* Rosy Cheeks */}
          <Circle cx="-10" cy="4" r="3.5" fill="#F472B6" opacity={0.6} />
          <Circle cx="10" cy="4" r="3.5" fill="#F472B6" opacity={0.6} />

          {/* Big happy anime eyes */}
          <Circle cx="-7" cy="-2" r="3.5" fill="#451A03" />
          <Circle cx="-8" cy="-3.5" r="1.2" fill="#FFFFFF" />
          <Circle cx="7" cy="-2" r="3.5" fill="#451A03" />
          <Circle cx="6" cy="-3.5" r="1.2" fill="#FFFFFF" />

          {/* Big smiling mouth */}
          <Path d="M -5 6 Q 0 12 5 6 Z" fill="#DC2626" />

          {/* Waving little hand */}
          <G transform="translate(20, -6)">
            <Ellipse cx="4" cy="0" rx="5" ry="3.5" fill="#FBBF24" stroke="#D97706" strokeWidth="1.5" transform="rotate(30)" />
          </G>
        </G>
      </Svg>
    </View>
  );
}

// ── 4. BOUNCING PLAYFUL LOADING DOTS ──────────────────────────────────────────
export function BouncingLoadingDots({ color = ThemeColors.primary }: { color?: string }) {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createBounce = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: -8,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.delay(400 - delay),
        ])
      );
    };

    const a1 = createBounce(dot1, 0);
    const a2 = createBounce(dot2, 150);
    const a3 = createBounce(dot3, 300);

    a1.start();
    a2.start();
    a3.start();

    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.dotsRow}>
      <Animated.View style={[styles.dot, { backgroundColor: color, transform: [{ translateY: dot1 }] }]} />
      <Animated.View style={[styles.dot, { backgroundColor: '#F59E0B', transform: [{ translateY: dot2 }] }]} />
      <Animated.View style={[styles.dot, { backgroundColor: '#3B82F6', transform: [{ translateY: dot3 }] }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
