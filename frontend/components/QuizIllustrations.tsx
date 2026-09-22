import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, {
  Path,
  Circle,
  Ellipse,
  G,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';

export function FishIllustration({
  size = 140,
  style,
}: {
  size?: number;
  style?: ViewStyle;
}) {
  return (
    <View style={[{ width: size, height: size }, styles.center, style]}>
      <Svg width={size} height={size} viewBox="0 0 160 160" fill="none">
        <Defs>
          <LinearGradient id="fishBodyGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#BAE6FD" />
            <Stop offset="50%" stopColor="#7DD3FC" />
            <Stop offset="100%" stopColor="#FBCFE8" />
          </LinearGradient>
          <LinearGradient id="finGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#FDE68A" />
            <Stop offset="100%" stopColor="#F472B6" />
          </LinearGradient>
        </Defs>

        {/* Floating background water bubbles */}
        <Circle cx="40" cy="45" r="4" fill="#E0F2FE" />
        <Circle cx="125" cy="35" r="3" fill="#E0F2FE" />
        <Circle cx="135" cy="55" r="5" fill="#E0F2FE" />
        <Circle cx="30" cy="115" r="3.5" fill="#E0F2FE" />
        <Circle cx="120" cy="120" r="4" fill="#E0F2FE" />

        {/* Seaweed at bottom */}
        <Path
          d="M 35 140 Q 30 115 38 100 Q 42 120 38 140"
          fill="#6EE7B7"
          opacity="0.8"
        />
        <Path
          d="M 45 140 Q 52 120 48 105 Q 43 125 45 140"
          fill="#34D399"
          opacity="0.9"
        />
        <Path
          d="M 125 140 Q 120 118 128 102 Q 132 122 128 140"
          fill="#6EE7B7"
          opacity="0.8"
        />
        <Path
          d="M 115 140 Q 110 125 116 112 Q 120 128 116 140"
          fill="#34D399"
          opacity="0.9"
        />

        {/* Tail Fin (Top & Bottom) */}
        <Path
          d="M 45 80 C 25 55 15 65 20 80 C 15 95 25 105 45 80 Z"
          fill="url(#finGrad)"
          stroke="#F472B6"
          strokeWidth="2"
        />

        {/* Dorsal Top Fin (Ruffled scallops) */}
        <Path
          d="M 60 55 C 65 35 75 35 80 50 C 85 38 95 38 100 56 C 105 45 115 48 115 65 Z"
          fill="url(#finGrad)"
          stroke="#F472B6"
          strokeWidth="2"
        />

        {/* Bottom Fin */}
        <Path
          d="M 75 105 C 70 125 85 125 90 106 Z"
          fill="url(#finGrad)"
          stroke="#F472B6"
          strokeWidth="1.5"
        />
        <Path
          d="M 95 102 C 92 118 104 118 108 100 Z"
          fill="url(#finGrad)"
          stroke="#F472B6"
          strokeWidth="1.5"
        />

        {/* Main Fish Body (Round chubby cute fish) */}
        <Ellipse
          cx="88"
          cy="80"
          rx="45"
          ry="34"
          fill="url(#fishBodyGrad)"
          stroke="#38BDF8"
          strokeWidth="2.5"
        />

        {/* Decorative colorful stripes on scales */}
        <Path
          d="M 68 55 Q 78 80 68 105"
          stroke="#FDE68A"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <Path
          d="M 80 50 Q 92 80 80 110"
          stroke="#F472B6"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <Path
          d="M 94 52 Q 104 80 94 108"
          stroke="#A7F3D0"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Cute Big Eye */}
        <Circle cx="112" cy="72" r="9" fill="#FFFFFF" stroke="#0284C7" strokeWidth="1.5" />
        <Circle cx="113" cy="72" r="5.5" fill="#0F172A" />
        <Circle cx="111" cy="70" r="2" fill="#FFFFFF" />
        <Circle cx="115" cy="73" r="1" fill="#FFFFFF" />

        {/* Cute Smile with cheek blush */}
        <Path
          d="M 124 82 Q 120 89 116 85"
          stroke="#0369A1"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <Circle cx="106" cy="83" r="3.5" fill="#FDA4AF" opacity="0.6" />

        {/* Side pectoral fin */}
        <Path
          d="M 78 82 C 70 85 68 96 78 98 C 86 98 88 88 78 82 Z"
          fill="#FDE68A"
          stroke="#F59E0B"
          strokeWidth="1.5"
        />
      </Svg>
    </View>
  );
}

export function FlowerIllustration({
  size = 140,
  style,
}: {
  size?: number;
  style?: ViewStyle;
}) {
  return (
    <View style={[{ width: size, height: size }, styles.center, style]}>
      <Svg width={size} height={size} viewBox="0 0 160 160" fill="none">
        {/* Stem & Leaves */}
        <Path
          d="M 80 80 Q 75 115 80 145"
          stroke="#10B981"
          strokeWidth="5"
          strokeLinecap="round"
        />
        {/* Left Leaf */}
        <Path
          d="M 78 115 C 55 110 50 125 76 122 Z"
          fill="#34D399"
          stroke="#059669"
          strokeWidth="1.5"
        />
        {/* Right Leaf */}
        <Path
          d="M 80 102 C 105 98 108 112 82 110 Z"
          fill="#34D399"
          stroke="#059669"
          strokeWidth="1.5"
        />

        {/* Petals */}
        <Circle cx="80" cy="50" r="18" fill="#F472B6" />
        <Circle cx="105" cy="65" r="18" fill="#F472B6" />
        <Circle cx="96" cy="95" r="18" fill="#F472B6" />
        <Circle cx="64" cy="95" r="18" fill="#F472B6" />
        <Circle cx="55" cy="65" r="18" fill="#F472B6" />

        {/* Flower Center */}
        <Circle cx="80" cy="74" r="18" fill="#FDE047" stroke="#F59E0B" strokeWidth="2" />
        <Circle cx="74" cy="70" r="2" fill="#78350F" />
        <Circle cx="86" cy="70" r="2" fill="#78350F" />
        <Path
          d="M 76 76 Q 80 81 84 76"
          stroke="#78350F"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
