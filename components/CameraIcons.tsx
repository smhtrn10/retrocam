/**
 * SVG camera icons for each camera type.
 * Each icon is a stylized illustration of the real camera.
 */
import { View } from 'react-native';
import Svg, {
  Rect, Circle, Ellipse, Path, Line, G, Defs, LinearGradient as SvgGradient, Stop,
} from 'react-native-svg';

interface IconProps { size?: number }

// ── Kodak Gold 200 style — yellow point-and-shoot ──
export function KodakIcon({ size = 52 }: IconProps) {
  return (
    <Svg width={size} height={size * 0.72} viewBox="0 0 52 37">
      <Defs>
        <SvgGradient id="kg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFD700" /><Stop offset="1" stopColor="#E6A800" />
        </SvgGradient>
      </Defs>
      <Rect x="2" y="6" width="48" height="28" rx="5" fill="url(#kg)" />
      <Rect x="2" y="6" width="48" height="8" rx="4" fill="#E6A800" />
      <Circle cx="26" cy="22" r="9" fill="#222" />
      <Circle cx="26" cy="22" r="6.5" fill="#111" />
      <Circle cx="26" cy="22" r="4" fill="#1a1a1a" />
      <Circle cx="23.5" cy="19.5" r="1.2" fill="rgba(255,255,255,0.3)" />
      <Rect x="6" y="9" width="10" height="3" rx="1.5" fill="#FFE566" />
      <Rect x="38" y="8" width="8" height="5" rx="2" fill="#FFE566" />
      <Circle cx="44" cy="10.5" r="1.5" fill="#FFF" opacity="0.6" />
    </Svg>
  );
}

// ── Fuji Superia — green/teal point-and-shoot ──
export function FujiIcon({ size = 52 }: IconProps) {
  return (
    <Svg width={size} height={size * 0.72} viewBox="0 0 52 37">
      <Defs>
        <SvgGradient id="fj" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#4CAF50" /><Stop offset="1" stopColor="#2E7D32" />
        </SvgGradient>
      </Defs>
      <Rect x="2" y="5" width="48" height="29" rx="5" fill="url(#fj)" />
      <Rect x="2" y="5" width="48" height="9" rx="4" fill="#2E7D32" />
      <Circle cx="26" cy="22" r="9.5" fill="#1a1a1a" />
      <Circle cx="26" cy="22" r="7" fill="#111" />
      <Circle cx="26" cy="22" r="4.5" fill="#0d0d0d" />
      <Circle cx="23.5" cy="19.5" r="1.4" fill="rgba(255,255,255,0.25)" />
      <Rect x="5" y="8" width="12" height="3" rx="1.5" fill="#81C784" />
      <Rect x="37" y="7" width="9" height="5" rx="2" fill="#81C784" />
    </Svg>
  );
}

// ── Polaroid — white instant camera ──
export function PolaroidIcon({ size = 52 }: IconProps) {
  return (
    <Svg width={size} height={size * 0.85} viewBox="0 0 52 44">
      <Defs>
        <SvgGradient id="pol" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F5F5F5" /><Stop offset="1" stopColor="#E0E0E0" />
        </SvgGradient>
      </Defs>
      <Rect x="3" y="2" width="46" height="34" rx="5" fill="url(#pol)" />
      <Rect x="3" y="36" width="46" height="8" rx="3" fill="#EEEEEE" />
      <Circle cx="26" cy="17" r="9" fill="#333" />
      <Circle cx="26" cy="17" r="6.5" fill="#222" />
      <Circle cx="26" cy="17" r="4" fill="#111" />
      <Circle cx="23.5" cy="14.5" r="1.2" fill="rgba(255,255,255,0.4)" />
      <Rect x="6" y="5" width="8" height="4" rx="2" fill="#BDBDBD" />
      <Rect x="38" y="5" width="8" height="4" rx="2" fill="#BDBDBD" />
      <Rect x="8" y="38" width="36" height="4" rx="2" fill="white" opacity="0.5" />
    </Svg>
  );
}

// ── Disposable — orange/yellow cheap camera ──
export function DisposableIcon({ size = 52 }: IconProps) {
  return (
    <Svg width={size} height={size * 0.72} viewBox="0 0 52 37">
      <Defs>
        <SvgGradient id="dis" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FF8F00" /><Stop offset="1" stopColor="#E65100" />
        </SvgGradient>
      </Defs>
      <Rect x="2" y="5" width="48" height="29" rx="4" fill="url(#dis)" />
      <Rect x="2" y="5" width="48" height="8" rx="3" fill="#BF360C" />
      <Circle cx="22" cy="22" r="8" fill="#222" />
      <Circle cx="22" cy="22" r="5.5" fill="#111" />
      <Circle cx="22" cy="22" r="3.5" fill="#0d0d0d" />
      <Circle cx="20" cy="20" r="1" fill="rgba(255,255,255,0.3)" />
      {/* Flash unit */}
      <Rect x="33" y="14" width="12" height="10" rx="2" fill="#FFD54F" />
      <Circle cx="39" cy="19" r="3" fill="#FFF9C4" />
      <Rect x="5" y="8" width="8" height="3" rx="1.5" fill="#FFAB40" />
    </Svg>
  );
}

// ── VHS Camcorder ──
export function VHSIcon({ size = 52 }: IconProps) {
  return (
    <Svg width={size} height={size * 0.72} viewBox="0 0 52 37">
      <Defs>
        <SvgGradient id="vhs" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#37474F" /><Stop offset="1" stopColor="#1C2B33" />
        </SvgGradient>
      </Defs>
      <Rect x="1" y="4" width="38" height="28" rx="4" fill="url(#vhs)" />
      {/* Lens barrel */}
      <Ellipse cx="42" cy="18" rx="9" ry="9" fill="#263238" />
      <Ellipse cx="42" cy="18" rx="6.5" ry="6.5" fill="#1a1a1a" />
      <Ellipse cx="42" cy="18" rx="4" ry="4" fill="#111" />
      <Circle cx="40" cy="16" r="1.2" fill="rgba(255,255,255,0.25)" />
      {/* Viewfinder */}
      <Rect x="4" y="7" width="14" height="9" rx="2" fill="#455A64" />
      <Rect x="5" y="8" width="12" height="7" rx="1.5" fill="#263238" />
      {/* REC button */}
      <Circle cx="28" cy="10" r="3" fill="#FF3B30" />
      {/* Grip lines */}
      <Line x1="4" y1="20" x2="4" y2="28" stroke="#546E7A" strokeWidth="1.5" />
      <Line x1="7" y1="20" x2="7" y2="28" stroke="#546E7A" strokeWidth="1.5" />
      <Line x1="10" y1="20" x2="10" y2="28" stroke="#546E7A" strokeWidth="1.5" />
    </Svg>
  );
}

// ── Hasselblad 500 — medium format, silver/black ──
export function HasselIcon({ size = 52 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 52 52">
      <Defs>
        <SvgGradient id="has" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#9E9E9E" /><Stop offset="1" stopColor="#616161" />
        </SvgGradient>
      </Defs>
      <Rect x="4" y="8" width="44" height="36" rx="3" fill="url(#has)" />
      <Rect x="4" y="8" width="44" height="10" rx="3" fill="#757575" />
      <Rect x="8" y="12" width="36" height="28" rx="2" fill="#424242" />
      <Circle cx="26" cy="26" r="11" fill="#212121" />
      <Circle cx="26" cy="26" r="8" fill="#1a1a1a" />
      <Circle cx="26" cy="26" r="5" fill="#111" />
      <Circle cx="23" cy="23" r="1.5" fill="rgba(255,255,255,0.3)" />
      {/* Waist-level finder */}
      <Rect x="18" y="4" width="16" height="6" rx="2" fill="#616161" />
      <Rect x="20" y="5" width="12" height="4" rx="1" fill="#424242" />
    </Svg>
  );
}

// ── Super 8 — vintage cine camera ──
export function Super8Icon({ size = 52 }: IconProps) {
  return (
    <Svg width={size} height={size * 0.85} viewBox="0 0 52 44">
      <Defs>
        <SvgGradient id="s8" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#8D6E63" /><Stop offset="1" stopColor="#4E342E" />
        </SvgGradient>
      </Defs>
      <Rect x="2" y="8" width="48" height="30" rx="4" fill="url(#s8)" />
      {/* Film reels */}
      <Circle cx="12" cy="14" r="7" fill="#3E2723" />
      <Circle cx="12" cy="14" r="4" fill="#212121" />
      <Circle cx="12" cy="14" r="1.5" fill="#5D4037" />
      <Circle cx="38" cy="14" r="7" fill="#3E2723" />
      <Circle cx="38" cy="14" r="4" fill="#212121" />
      <Circle cx="38" cy="14" r="1.5" fill="#5D4037" />
      {/* Lens */}
      <Circle cx="26" cy="30" r="8" fill="#1a1a1a" />
      <Circle cx="26" cy="30" r="5.5" fill="#111" />
      <Circle cx="26" cy="30" r="3" fill="#0d0d0d" />
      <Circle cx="24" cy="28" r="1" fill="rgba(255,255,255,0.3)" />
      {/* Film path */}
      <Rect x="18" y="8" width="16" height="4" rx="1" fill="#6D4C41" />
    </Svg>
  );
}

// ── Y2K Digital — silver 2000s digicam ──
export function Y2KIcon({ size = 52 }: IconProps) {
  return (
    <Svg width={size} height={size * 0.72} viewBox="0 0 52 37">
      <Defs>
        <SvgGradient id="y2k" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#E3F2FD" /><Stop offset="1" stopColor="#90CAF9" />
        </SvgGradient>
      </Defs>
      <Rect x="2" y="5" width="48" height="29" rx="5" fill="url(#y2k)" />
      <Rect x="2" y="5" width="48" height="7" rx="4" fill="#BBDEFB" />
      <Circle cx="22" cy="22" r="9" fill="#1565C0" />
      <Circle cx="22" cy="22" r="6.5" fill="#0D47A1" />
      <Circle cx="22" cy="22" r="4" fill="#0a0a2a" />
      <Circle cx="20" cy="20" r="1.2" fill="rgba(255,255,255,0.5)" />
      {/* LCD screen */}
      <Rect x="33" y="13" width="14" height="11" rx="2" fill="#1A237E" />
      <Rect x="34" y="14" width="12" height="9" rx="1" fill="#283593" />
      <Rect x="5" y="7" width="6" height="3" rx="1.5" fill="#E3F2FD" />
    </Svg>
  );
}

// ── Olympus PEN half-frame ──
export function OlympusPenIcon({ size = 52 }: IconProps) {
  return (
    <Svg width={size} height={size * 0.72} viewBox="0 0 52 37">
      <Defs>
        <SvgGradient id="pen" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#ECEFF1" /><Stop offset="1" stopColor="#B0BEC5" />
        </SvgGradient>
      </Defs>
      <Rect x="2" y="5" width="48" height="29" rx="5" fill="url(#pen)" />
      <Rect x="2" y="5" width="48" height="8" rx="4" fill="#CFD8DC" />
      <Circle cx="26" cy="22" r="9" fill="#37474F" />
      <Circle cx="26" cy="22" r="6.5" fill="#263238" />
      <Circle cx="26" cy="22" r="4" fill="#1a1a1a" />
      <Circle cx="23.5" cy="19.5" r="1.2" fill="rgba(255,255,255,0.35)" />
      {/* Half-frame indicator lines */}
      <Line x1="14" y1="14" x2="14" y2="30" stroke="#90A4AE" strokeWidth="1" />
      <Rect x="5" y="8" width="7" height="3" rx="1.5" fill="#ECEFF1" />
      <Rect x="38" y="7" width="9" height="5" rx="2" fill="#CFD8DC" />
    </Svg>
  );
}

// ── Lomography — colorful plastic ──
export function LomoIcon({ size = 52 }: IconProps) {
  return (
    <Svg width={size} height={size * 0.72} viewBox="0 0 52 37">
      <Defs>
        <SvgGradient id="lomo" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#E91E63" /><Stop offset="1" stopColor="#9C27B0" />
        </SvgGradient>
      </Defs>
      <Rect x="2" y="5" width="48" height="29" rx="6" fill="url(#lomo)" />
      <Circle cx="26" cy="21" r="10" fill="#1a1a1a" />
      <Circle cx="26" cy="21" r="7" fill="#111" />
      <Circle cx="26" cy="21" r="4.5" fill="#0d0d0d" />
      <Circle cx="23.5" cy="18.5" r="1.4" fill="rgba(255,255,255,0.3)" />
      <Rect x="5" y="7" width="10" height="4" rx="2" fill="#F48FB1" />
      <Circle cx="43" cy="10" r="4" fill="#CE93D8" />
      <Circle cx="43" cy="10" r="2" fill="#9C27B0" />
    </Svg>
  );
}

// ── Noir / B&W 35mm ──
export function NoirIcon({ size = 52 }: IconProps) {
  return (
    <Svg width={size} height={size * 0.72} viewBox="0 0 52 37">
      <Defs>
        <SvgGradient id="noir" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#424242" /><Stop offset="1" stopColor="#212121" />
        </SvgGradient>
      </Defs>
      <Rect x="2" y="5" width="48" height="29" rx="5" fill="url(#noir)" />
      <Rect x="2" y="5" width="48" height="8" rx="4" fill="#333" />
      <Circle cx="26" cy="22" r="9.5" fill="#111" />
      <Circle cx="26" cy="22" r="7" fill="#0d0d0d" />
      <Circle cx="26" cy="22" r="4.5" fill="#080808" />
      <Circle cx="23.5" cy="19.5" r="1.2" fill="rgba(255,255,255,0.2)" />
      <Rect x="5" y="8" width="9" height="3" rx="1.5" fill="#555" />
      <Rect x="37" y="7" width="9" height="5" rx="2" fill="#444" />
    </Svg>
  );
}

// ── Generic fallback ──
export function GenericCamIcon({ size = 52, color = '#888' }: IconProps & { color?: string }) {
  return (
    <Svg width={size} height={size * 0.72} viewBox="0 0 52 37">
      <Rect x="2" y="5" width="48" height="29" rx="5" fill={color} opacity={0.85} />
      <Rect x="2" y="5" width="48" height="8" rx="4" fill={color} opacity={0.6} />
      <Circle cx="26" cy="22" r="9" fill="#1a1a1a" />
      <Circle cx="26" cy="22" r="6" fill="#111" />
      <Circle cx="26" cy="22" r="3.5" fill="#0d0d0d" />
      <Circle cx="23.5" cy="19.5" r="1" fill="rgba(255,255,255,0.3)" />
      <Rect x="5" y="8" width="8" height="3" rx="1.5" fill="white" opacity={0.2} />
    </Svg>
  );
}
