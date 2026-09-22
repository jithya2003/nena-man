import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, {
  Path,
  Rect,
  Circle,
  G,
  Defs,
  LinearGradient,
  Stop,
  ClipPath,
} from 'react-native-svg';
import { ThemeColors } from '@/constants/theme';

export function WelcomeStudentIllustration({
  size = 200,
  style,
}: {
  size?: number;
  style?: ViewStyle;
}) {
  return (
    <View style={[{ width: size, height: size }, styles.center, style]}>
      <Svg width={size} height={size} viewBox="0 0 240 240" fill="none">
        <Defs>
          <LinearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <Stop offset="100%" stopColor="#E6F5EC" stopOpacity="1" />
          </LinearGradient>
          <ClipPath id="cardClip">
            <Rect x="0" y="0" width="240" height="240" rx="32" />
          </ClipPath>
        </Defs>

        {/* Outer rounded card background */}
        <G clipPath="url(#cardClip)">
          <Rect width="240" height="240" rx="32" fill="url(#bgGrad)" />

          {/* Classroom elements in background */}
          {/* Wall bunting / decorations */}
          <Path
            d="M 20 25 Q 60 40 100 25 Q 140 40 180 25 Q 210 38 230 25"
            stroke="#CDE6D7"
            strokeWidth="2"
            strokeDasharray="4,4"
          />
          <Circle cx="40" cy="35" r="5" fill="#FCD34D" />
          <Circle cx="80" cy="33" r="5" fill="#93C5FD" />
          <Circle cx="120" cy="35" r="5" fill="#F472B6" />
          <Circle cx="160" cy="33" r="5" fill="#6EE7B7" />
          <Circle cx="200" cy="34" r="5" fill="#FCD34D" />

          {/* Plant on top left */}
          <Path d="M 20 60 C 25 35 45 40 50 65" fill="#34D399" opacity="0.6" />
          <Path d="M 10 75 C 18 55 35 60 40 80" fill="#10B981" opacity="0.5" />

          {/* Blackboard / Classroom Board */}
          <Rect
            x="145"
            y="45"
            width="75"
            height="55"
            rx="6"
            fill="#2D5A43"
            stroke="#94A3B8"
            strokeWidth="3"
          />
          {/* Sinhala characters on board: අ ආ 1 2 3 */}
          <Path
            d="M 155 60 Q 160 55 165 60 Q 165 70 157 72"
            stroke="#E2E8F0"
            strokeWidth="1.5"
            fill="none"
          />
          <Path
            d="M 172 60 Q 177 55 182 60 L 182 72"
            stroke="#E2E8F0"
            strokeWidth="1.5"
            fill="none"
          />
          <Path
            d="M 192 62 L 195 62 L 195 72"
            stroke="#FEF08A"
            strokeWidth="1.5"
            fill="none"
          />
          <Path
            d="M 200 62 Q 207 62 207 67 Q 200 72 208 72"
            stroke="#FEF08A"
            strokeWidth="1.5"
            fill="none"
          />

          {/* Bookshelf on left */}
          <Rect x="20" y="85" width="30" height="90" rx="3" fill="#D97706" opacity="0.4" />
          <Rect x="23" y="95" width="6" height="25" rx="1" fill="#EF4444" />
          <Rect x="31" y="92" width="7" height="28" rx="1" fill="#3B82F6" />
          <Rect x="40" y="98" width="6" height="22" rx="1" fill="#10B981" />
          <Rect x="24" y="130" width="22" height="6" rx="1" fill="#8B5CF6" />

          {/* Colorful floor rug */}
          <Circle cx="120" cy="200" r="65" fill="#FCE7F3" opacity="0.5" />
          <Circle cx="120" cy="200" r="50" fill="#E0F2FE" opacity="0.7" />
          <Circle cx="120" cy="200" r="35" fill="#FEF3C7" opacity="0.9" />

          {/* Wooden Chair */}
          <Path d="M 68 120 L 68 185" stroke="#92400E" strokeWidth="5" strokeLinecap="round" />
          <Path d="M 85 125 L 85 185" stroke="#78350F" strokeWidth="4" strokeLinecap="round" />
          <Rect x="65" y="115" width="25" height="40" rx="3" fill="#B45309" opacity="0.8" />

          {/* Student Sitting */}
          {/* Hair & Braids */}
          <Circle cx="102" cy="92" r="22" fill="#1E293B" />
          <Path
            d="M 85 95 C 75 110 80 135 84 140"
            stroke="#1E293B"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <Path
            d="M 118 95 C 128 110 124 135 120 140"
            stroke="#1E293B"
            strokeWidth="6"
            strokeLinecap="round"
          />
          {/* Hair ribbons (red) */}
          <Circle cx="84" cy="135" r="4" fill="#EF4444" />
          <Circle cx="120" cy="135" r="4" fill="#EF4444" />

          {/* Face */}
          <Circle cx="102" cy="94" r="16" fill="#D97706" opacity="0.35" />
          <Circle cx="102" cy="94" r="15" fill="#FBBF24" opacity="0.4" />
          {/* Eyes with happy sparkle */}
          <Circle cx="97" cy="94" r="2" fill="#1E293B" />
          <Circle cx="107" cy="94" r="2" fill="#1E293B" />
          {/* Smile */}
          <Path
            d="M 99 100 Q 102 104 105 100"
            stroke="#1E293B"
            strokeWidth="1.5"
            fill="none"
          />

          {/* Sri Lankan School Uniform (White dress with school tie) */}
          <Path
            d="M 88 112 C 88 112 95 108 102 108 C 109 108 116 112 116 112 L 126 160 L 78 160 Z"
            fill="#FFFFFF"
            stroke="#CBD5E1"
            strokeWidth="2"
          />
          {/* Red/Maroon school tie & belt */}
          <Path d="M 100 110 L 104 110 L 103 126 L 102 130 L 101 126 Z" fill="#991B1B" />
          <Rect x="83" y="138" width="38" height="5" rx="1" fill="#991B1B" />

          {/* Arms holding tablet */}
          <Path
            d="M 88 115 C 80 128 85 142 98 140"
            stroke="#FBBF24"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <Path
            d="M 116 115 C 124 128 118 142 106 140"
            stroke="#FBBF24"
            strokeWidth="6"
            strokeLinecap="round"
          />

          {/* Tablet Device */}
          <Rect
            x="96"
            y="125"
            width="34"
            height="26"
            rx="3"
            fill="#1E293B"
            stroke="#3B82F6"
            strokeWidth="1.5"
          />
          <Rect x="98" y="127" width="30" height="22" rx="2" fill="#F0FDF4" />
          <Rect x="100" y="130" width="12" height="7" rx="1" fill="#F87171" />
          <Rect x="114" y="130" width="12" height="7" rx="1" fill="#60A5FA" />
          <Rect x="100" y="139" width="26" height="7" rx="1" fill="#34D399" />

          {/* Wooden Study Desk */}
          <Path d="M 90 148 L 195 148 L 195 158 L 90 158 Z" fill="#B45309" />
          <Path d="M 140 158 L 140 205" stroke="#78350F" strokeWidth="6" strokeLinecap="round" />
          <Path d="M 190 158 L 190 205" stroke="#78350F" strokeWidth="6" strokeLinecap="round" />

          {/* Books and Stationery on desk */}
          <Rect x="135" y="136" width="24" height="12" rx="2" fill="#3B82F6" />
          <Rect x="133" y="142" width="26" height="6" rx="1" fill="#EF4444" />
          <Rect x="165" y="130" width="14" height="18" rx="2" fill="#10B981" />
          {/* Pencil holder */}
          <Rect x="182" y="132" width="10" height="16" rx="2" fill="#6366F1" />
          <Path d="M 184 132 L 182 124" stroke="#F59E0B" strokeWidth="2" />
          <Path d="M 187 132 L 187 122" stroke="#EF4444" strokeWidth="2" />
          <Path d="M 190 132 L 192 125" stroke="#10B981" strokeWidth="2" />

          {/* Legs & White socks & shoes */}
          <Path d="M 94 160 L 94 185" stroke="#FBBF24" strokeWidth="6" />
          <Path d="M 110 160 L 110 185" stroke="#FBBF24" strokeWidth="6" />
          <Rect x="90" y="180" width="8" height="14" rx="2" fill="#FFFFFF" />
          <Rect x="106" y="180" width="8" height="14" rx="2" fill="#FFFFFF" />
          <Rect x="88" y="190" width="14" height="7" rx="3" fill="#1E293B" />
          <Rect x="104" y="190" width="14" height="7" rx="3" fill="#1E293B" />
        </G>
      </Svg>
    </View>
  );
}

export function RelaxTreeIllustration({
  size = 140,
  style,
}: {
  size?: number;
  style?: ViewStyle;
}) {
  return (
    <View style={[{ width: size, height: size }, styles.center, style]}>
      <Svg width={size} height={size} viewBox="0 0 160 160" fill="none">
        {/* Soft grass mound */}
        <Path
          d="M 15 135 Q 80 115 145 135 L 145 155 L 15 155 Z"
          fill="#D1FAE5"
        />
        <Circle cx="35" cy="140" r="6" fill="#A7F3D0" />
        <Circle cx="125" cy="142" r="5" fill="#A7F3D0" />
        <Circle cx="60" cy="145" r="4" fill="#6EE7B7" />
        <Circle cx="105" cy="146" r="4" fill="#6EE7B7" />

        {/* Tree Trunk */}
        <Path
          d="M 75 60 C 75 90 70 110 65 138 L 95 138 C 90 110 85 90 85 60 Z"
          fill="#92400E"
        />
        <Path
          d="M 68 138 Q 60 142 55 142"
          stroke="#78350F"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <Path
          d="M 92 138 Q 100 142 105 142"
          stroke="#78350F"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Tree Foliage (Lush, calm green canopy) */}
        <Circle cx="80" cy="45" r="32" fill="#34D399" />
        <Circle cx="60" cy="42" r="24" fill="#10B981" />
        <Circle cx="100" cy="42" r="24" fill="#10B981" />
        <Circle cx="80" cy="28" r="22" fill="#059669" />
        <Circle cx="50" cy="52" r="18" fill="#059669" />
        <Circle cx="110" cy="52" r="18" fill="#34D399" />

        {/* Leaves & Blossom details in tree */}
        <Circle cx="65" cy="30" r="3" fill="#FEF08A" />
        <Circle cx="95" cy="32" r="3" fill="#FBCFE8" />
        <Circle cx="80" cy="42" r="3.5" fill="#FDE68A" />
        <Circle cx="72" cy="55" r="3" fill="#FBCFE8" />
        <Circle cx="92" cy="52" r="3" fill="#FEF08A" />

        {/* Little owl/bird in tree */}
        <Circle cx="80" cy="50" r="5" fill="#F97316" />
        <Circle cx="79" cy="49" r="1" fill="#1E293B" />
        <Circle cx="82" cy="49" r="1" fill="#1E293B" />

        {/* Child sitting serenely cross-legged reading */}
        {/* Hair */}
        <Circle cx="80" cy="106" r="10" fill="#92400E" />
        {/* Head */}
        <Circle cx="80" cy="108" r="7.5" fill="#FED7AA" />
        {/* Soft shirt */}
        <Path
          d="M 73 115 C 73 115 77 114 80 114 C 83 114 87 115 87 115 L 89 130 L 71 130 Z"
          fill="#93C5FD"
        />
        {/* Sitting legs cross-legged */}
        <Path
          d="M 66 130 C 66 125 94 125 94 130 C 94 135 66 135 66 130 Z"
          fill="#3B82F6"
        />
        {/* Open book on lap */}
        <Path
          d="M 73 125 L 80 127 L 87 125 L 86 131 L 80 133 L 74 131 Z"
          fill="#FFFFFF"
          stroke="#059669"
          strokeWidth="1"
        />
      </Svg>
    </View>
  );
}

export function StudentAvatarPhoto({
  size = 72,
  showEditBadge = false,
  style,
}: {
  size?: number;
  showEditBadge?: boolean;
  style?: ViewStyle;
}) {
  return (
    <View style={[{ width: size, height: size }, styles.avatarWrap, style]}>
      <Svg width={size} height={size} viewBox="0 0 80 80" fill="none">
        <Defs>
          <ClipPath id="avatarCircle">
            <Circle cx="40" cy="40" r="37" />
          </ClipPath>
          <LinearGradient id="avatarBg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#FEF3C7" />
            <Stop offset="100%" stopColor="#DCFCE7" />
          </LinearGradient>
        </Defs>

        {/* Outer subtle ring */}
        <Circle
          cx="40"
          cy="40"
          r="38"
          stroke={ThemeColors.primary}
          strokeWidth="2.5"
          fill="none"
        />

        {/* Inside Avatar Content */}
        <G clipPath="url(#avatarCircle)">
          <Rect width="80" height="80" fill="url(#avatarBg)" />

          {/* Background bokeh */}
          <Circle cx="20" cy="20" r="15" fill="#FDE68A" opacity="0.6" />
          <Circle cx="65" cy="25" r="12" fill="#BBF7D0" opacity="0.7" />

          {/* Student Girl Portrait */}
          {/* Hair */}
          <Circle cx="40" cy="30" r="18" fill="#1E293B" />
          <Path
            d="M 24 35 C 18 45 20 60 22 68"
            stroke="#1E293B"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <Path
            d="M 56 35 C 62 45 60 60 58 68"
            stroke="#1E293B"
            strokeWidth="5"
            strokeLinecap="round"
          />

          {/* Face */}
          <Circle cx="40" cy="34" r="13" fill="#FDBA74" opacity="0.4" />
          <Circle cx="40" cy="34" r="12" fill="#FED7AA" />
          {/* Eyes */}
          <Circle cx="36" cy="33" r="1.5" fill="#1E293B" />
          <Circle cx="44" cy="33" r="1.5" fill="#1E293B" />
          {/* Cheeks */}
          <Circle cx="33" cy="37" r="2" fill="#F87171" opacity="0.5" />
          <Circle cx="47" cy="37" r="2" fill="#F87171" opacity="0.5" />
          {/* Warm smile */}
          <Path
            d="M 37 38 Q 40 42 43 38"
            stroke="#9A3412"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Uniform White Collar & Red Tie */}
          <Path
            d="M 28 47 L 52 47 L 58 80 L 22 80 Z"
            fill="#FFFFFF"
            stroke="#CBD5E1"
            strokeWidth="1"
          />
          <Path d="M 39 47 L 41 47 L 42 60 L 40 64 L 38 60 Z" fill="#991B1B" />
        </G>
      </Svg>

      {/* Edit Pencil Icon Badge */}
      {showEditBadge && (
        <View style={styles.editBadge}>
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
            <Path
              d="M 3 17.25 L 3 21 L 6.75 21 L 17.81 9.94 L 14.06 6.19 L 3 17.25 Z M 20.71 7.04 C 21.1 6.65 21.1 6.02 20.71 5.63 L 18.37 3.29 C 17.98 2.9 17.35 2.9 16.96 3.29 L 15.13 5.12 L 18.88 8.87 L 20.71 7.04 Z"
              fill="#FFFFFF"
            />
          </Svg>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: ThemeColors.primary,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
