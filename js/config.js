// config.js — Koi Pond constants
export const FISH_COUNT = 7;

export const KOI_VARIETIES = [
  // Kohaku family (white + red)
  { name: '红白', nameEn: 'Kohaku', body: '#F6F5ED', spots: '#E35D46', belly: '#FFFFFF', desc: '白底红花纹', descEn: 'White body, red markings' },
  // Taisho Sanshoku (white + red + black)
  { name: '大正三色', nameEn: 'Taisho Sanshoku', body: '#F6F5ED', spots: '#E35D46', belly: '#FFFFFF', accent: '#293C3B', desc: '白底红黑三色', descEn: 'White with red & black' },
  // Showa Sanshoku (black + red + white)
  { name: '昭和三色', nameEn: 'Showa', body: '#293C3B', spots: '#E35D46', belly: '#354B48', accent: '#F6F5ED', desc: '黑底红白三色', descEn: 'Black with red & white' },
  // Bekko (white/red/yellow + black spots)
  { name: '白别甲', nameEn: 'Shiro Bekko', body: '#F6F5ED', spots: '#293C3B', belly: '#FFFFFF', desc: '白底黑斑', descEn: 'White with black spots' },
  { name: '赤别甲', nameEn: 'Aka Bekko', body: '#E35D46', spots: '#293C3B', belly: '#F2A490', desc: '红底黑斑', descEn: 'Red with black spots' },
  // Utsuri (black + one color)
  { name: '白写', nameEn: 'Shiro Utsuri', body: '#293C3B', spots: '#F6F5ED', belly: '#354B48', desc: '黑白双色', descEn: 'Black & white' },
  { name: '绯写', nameEn: 'Hi Utsuri', body: '#293C3B', spots: '#E35D46', belly: '#354B48', desc: '黑红双色', descEn: 'Black & red' },
  { name: '黄写', nameEn: 'Ki Utsuri', body: '#293C3B', spots: '#D6A34D', belly: '#354B48', desc: '黑黄双色', descEn: 'Black & yellow' },
  // Asagi (blue-grey + red belly)
  { name: '浅黄', nameEn: 'Asagi', body: '#6B8BA4', spots: '#8AA0B5', belly: '#CC5533', desc: '蓝灰背红腹', descEn: 'Blue-grey back, red belly' },
  // Ogon (metallic single color)
  { name: '黄金', nameEn: 'Yamabuki Ogon', body: '#DAB15E', spots: '#EBD18B', belly: '#F4E5B6', desc: '全身金色', descEn: 'Solid metallic gold' },
  { name: '白金', nameEn: 'Gin Matsuba', body: '#E2E8E2', spots: '#BDCFC9', belly: '#F7FAF5', desc: '银白色', descEn: 'Silvery white' },
  // Goshiki (5 colors)
  { name: '五色', nameEn: 'Goshiki', body: '#4A6070', spots: '#E35D46', belly: '#8090A0', desc: '五色杂陈', descEn: 'Five-color blend' },
  // Tancho (white + single red dot on head)
  { name: '丹顶', nameEn: 'Tancho', body: '#F6F5ED', spots: '#E35D46', belly: '#FFFFFF', tancho: true, desc: '白底头顶红圆', descEn: 'White with red crown spot' },
  // Benigoi (solid red)
  { name: '红鲤', nameEn: 'Benigoi', body: '#E35D46', spots: '#EE7962', belly: '#F2A490', desc: '全身红色', descEn: 'Solid deep red' },
  // Karashigoi (solid yellow-cream)
  { name: '芥子鲤', nameEn: 'Karashigoi', body: '#DED197', spots: '#CABC82', belly: '#EEE7C5', desc: '全身淡黄', descEn: 'Soft pale yellow' },
  // Kumonryu (black + white, pattern changes)
  { name: '九纹龙', nameEn: 'Kumonryu', body: '#293C3B', spots: '#F6F5ED', belly: '#3A3A3A', desc: '黑白变化龙纹', descEn: 'Shifting black & white dragon' },
  // Chagoi (brown/olive)
  { name: '茶鲤', nameEn: 'Chagoi', body: '#8B9278', spots: '#A7AD92', belly: '#CCD0B3', desc: '全身茶色', descEn: 'Earthy tea brown' },
  // Karasugoi (solid black)
  { name: '乌鲤', nameEn: 'Karasugoi', body: '#293C3B', spots: '#354B48', belly: '#333333', desc: '全身墨黑', descEn: 'Solid ink black' },
];
export const FEAR_RADIUS = 150;
export const FEAR_FORCE = 3.5;
export const FEAR_DECAY = 0.98;
export const WANDER_SPEED = 0.8;
export const MAX_SPEED = 4;
export const TURN_RATE = 0.02;
export const TAIL_SPEED = 0.08;
export const RIPPLE_MAX_RADIUS = 120;
export const RIPPLE_DURATION = 60; // frames

// Duck constants
export const DUCK_SPEED = 0.52;           // WANDER_SPEED * 0.65
export const DUCK_WAKE_INTERVAL_MS = 90;  // ms between wake ripples
export const DUCK_AVOID_RADIUS = 85;      // px — fish gently clear this zone (scaled for 40px duck)
export const DUCK_NUDGE_RADIUS = 110;     // px — curious reaction to nearby taps
// Keep for backward compat (initial fish)
export const FISH_COLORS = [
  { body: '#E49A54', spots: '#FFFFFF', belly: '#F6F5ED' }, // orange/white
  { body: '#E35D46', spots: '#FFFFFF', belly: '#F0C8C8' }, // red/white
  { body: '#D6A34D', spots: '#F5E6A3', belly: '#FFF5D6' }, // gold
  { body: '#293C3B', spots: '#E49A54', belly: '#4A3A2A' }, // black/orange
  { body: '#E49A54', spots: '#D6A34D', belly: '#FFFFFF' }, // orange/gold
  { body: '#E35D46', spots: '#D6A34D', belly: '#F6F5ED' }, // red/gold
  { body: '#F6F5ED', spots: '#E35D46', belly: '#FFFFFF' }, // white/red
];
