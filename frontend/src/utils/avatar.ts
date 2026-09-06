/**
 * WISHORA Avatar System
 * Generates beautiful, deterministic 3D / illustrated studio avatars strictly matched to gender,
 * and provides gender-specific luxury presets & persistent image utilities.
 */

export interface AvatarPreset {
  id: string;
  name: string;
  url: string;
  gender: 'female' | 'male' | 'child' | 'unspecified';
  category: '3d' | 'illustrated' | 'cinematic';
}

export const LUXURY_AVATAR_PRESETS: AvatarPreset[] = [
  // ─── FEMALE PRESETS ───
  {
    id: 'fem_gold_muse',
    name: 'Executive Gold',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    gender: 'female',
    category: 'cinematic'
  },
  {
    id: 'fem_neon_dreamer',
    name: 'Neon Muse',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
    gender: 'female',
    category: 'cinematic'
  },
  {
    id: 'fem_velvet_star',
    name: 'Velvet Star',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80',
    gender: 'female',
    category: 'cinematic'
  },
  {
    id: 'fem_aurora_glow',
    name: 'Aurora Glow',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
    gender: 'female',
    category: 'cinematic'
  },
  {
    id: 'fem_illustrated_muse',
    name: 'Modernist Muse',
    url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Priya&hair=straight01,wavy01,curvy01&backgroundColor=ffd5dc,ffdfbf,d1d4f9&radius=20',
    gender: 'female',
    category: 'illustrated'
  },
  {
    id: 'fem_boho_artist',
    name: 'Boho Dreamer',
    url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Ananya&hair=curvy01,bun01&backgroundColor=ffd5dc,b6e3f4&radius=20',
    gender: 'female',
    category: 'illustrated'
  },

  // ─── MALE PRESETS ───
  {
    id: 'male_cosmic_creator',
    name: 'Cosmic Vision',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    gender: 'male',
    category: 'cinematic'
  },
  {
    id: 'male_studio_portrait',
    name: 'Studio Master',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    gender: 'male',
    category: 'cinematic'
  },
  {
    id: 'male_urban_artist',
    name: 'Urban Artist',
    url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&auto=format&fit=crop&q=80',
    gender: 'male',
    category: 'cinematic'
  },
  {
    id: 'male_notion_crown',
    name: 'Crown Royal',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Souvik&backgroundColor=ffd5dc,b6e3f4&radius=20',
    gender: 'male',
    category: '3d'
  },
  {
    id: 'male_digital_artist',
    name: 'Digital Creator',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Aarav&backgroundColor=b6e3f4,c0aede,d1d4f9&radius=20',
    gender: 'male',
    category: 'illustrated'
  },
  {
    id: 'male_minimalist',
    name: 'Modern Gent',
    url: 'https://api.dicebear.com/7.x/micah/svg?seed=Rohan&backgroundColor=c0aede,ffdfbf&radius=20',
    gender: 'male',
    category: 'illustrated'
  },

  // ─── CHILD & UNISEX PRESETS ───
  {
    id: 'child_bottts_fun',
    name: 'Cyber Companion',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=WishoraKid&backgroundColor=ffd5dc,ffdfbf,b6e3f4&radius=20',
    gender: 'child',
    category: '3d'
  },
  {
    id: 'child_adventurer',
    name: 'Young Wanderer',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Leo&backgroundColor=b6e3f4,ffd5dc&radius=20',
    gender: 'child',
    category: 'illustrated'
  },
  {
    id: 'unisex_notionists',
    name: 'Creative Soul',
    url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Creative&backgroundColor=ffd5dc,b6e3f4&radius=20',
    gender: 'unspecified',
    category: '3d'
  }
];

/**
 * Filter avatar presets strictly by gender
 */
export function getAvatarPresetsForGender(gender?: string): AvatarPreset[] {
  if (!gender || gender === 'unspecified' || gender === 'nonbinary') {
    return LUXURY_AVATAR_PRESETS;
  }
  const filtered = LUXURY_AVATAR_PRESETS.filter(p => p.gender === gender || p.gender === 'unspecified');
  return filtered.length > 0 ? filtered : LUXURY_AVATAR_PRESETS;
}

/**
 * Returns a high-definition auto-assigned avatar URL strictly matched to gender if no custom avatar is provided.
 */
export function getAvatarUrl(name: string, customUrl?: string | null, gender?: string): string {
  if (customUrl && customUrl.trim() !== '') {
    return customUrl.trim();
  }

  const cleanName = (name || 'Friend').trim();
  const seed = encodeURIComponent(cleanName);

  // Background palette combinations
  const bgPalettes = [
    'b6e3f4,c0aede,d1d4f9',
    'ffd5dc,ffdfbf,d1d4f9',
    'd1d4f9,b6e3f4,ffd5dc',
    'ffdfbf,ffd5dc,b6e3f4',
    'c0aede,d1d4f9,ffdfbf'
  ];

  let hash = 0;
  for (let i = 0; i < cleanName.length; i++) {
    hash = cleanName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const paletteIndex = Math.abs(hash) % bgPalettes.length;
  const bg = bgPalettes[paletteIndex];

  let normalizedGender = (gender || '').toLowerCase();

  // If gender is unspecified or missing, infer from name
  if (!normalizedGender || normalizedGender === 'unspecified') {
    const lowerName = cleanName.toLowerCase();
    const femaleIndicators = ['ananya', 'priya', 'subarna', 'sneha', 'pooja', 'riya', 'tanvi', 'shreya', 'neha', 'diya', 'aanya', 'annie', 'emma', 'sophia', 'olivia', 'mia', 'ava', 'charlotte', 'amelia', 'harper', 'evelyn', 'sister', 'mother', 'mom', 'wife', 'girlfriend'];
    const maleIndicators = ['aarav', 'souvik', 'rohit', 'rahul', 'amit', 'vikram', 'arjun', 'aditya', 'leo', 'robert', 'alex', 'john', 'david', 'james', 'daniel', 'michael', 'brother', 'father', 'dad', 'husband', 'boyfriend'];

    if (femaleIndicators.some(ind => lowerName.includes(ind)) || lowerName.endsWith('a') || lowerName.endsWith('i') || lowerName.endsWith('ee')) {
      normalizedGender = 'female';
    } else if (maleIndicators.some(ind => lowerName.includes(ind))) {
      normalizedGender = 'male';
    }
  }

  // Generate reliable, self-contained SVG data URIs that work 100% offline and never fail to load
  const palettePairs = [
    { bg1: '#FFD1DC', bg2: '#D8B4E2', skin: '#FAD2B0', hair: '#4A2E18', acc: '#E06D8A' }, // Feminine Rose
    { bg1: '#C0D8FA', bg2: '#9BB8EB', skin: '#E8B991', hair: '#1E1E28', acc: '#4F86F7' }, // Masculine Blue
    { bg1: '#FFE4B5', bg2: '#FAD074', skin: '#F5C6A5', hair: '#8B4513', acc: '#F59E0B' }, // Warm Amber
    { bg1: '#D1FAE5', bg2: '#A7F3D0', skin: '#F8D8BE', hair: '#2D3748', acc: '#10B981' }, // Emerald Soft
    { bg1: '#EDE9FE', bg2: '#DDD6FE', skin: '#F0C7A6', hair: '#3730A3', acc: '#8B5CF6' }  // Purple Velvet
  ];

  const p = palettePairs[paletteIndex % palettePairs.length];
  const initial = cleanName.charAt(0).toUpperCase() || 'W';

  let svgContent = '';

  if (normalizedGender === 'female') {
    // Elegant Female Stylized Vector Portrait
    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%">
      <defs>
        <linearGradient id="bg_${paletteIndex}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${p.bg1}"/>
          <stop offset="100%" stop-color="${p.bg2}"/>
        </linearGradient>
      </defs>
      <rect width="120" height="120" rx="24" fill="url(#bg_${paletteIndex})"/>
      <!-- Flowing Long Hair Back -->
      <path d="M30,42 Q22,80 34,105 Q60,118 86,105 Q98,80 90,42 Z" fill="${p.hair}"/>
      <!-- Neck & Shoulders -->
      <rect x="52" y="70" width="16" height="20" fill="${p.skin}" rx="4"/>
      <path d="M28,110 Q60,92 92,110 L96,120 L24,120 Z" fill="${p.acc}"/>
      <!-- Head -->
      <ellipse cx="60" cy="56" rx="22" ry="26" fill="${p.skin}"/>
      <!-- Hair Bangs & Waves -->
      <path d="M38,46 Q60,26 82,46 Q76,32 60,32 Q44,32 38,46 Z" fill="${p.hair}"/>
      <path d="M36,44 Q44,65 40,78 Q36,65 37,50" fill="${p.hair}"/>
      <path d="M84,44 Q76,65 80,78 Q84,65 83,50" fill="${p.hair}"/>
      <!-- Soft Eyes -->
      <ellipse cx="51" cy="56" rx="2.5" ry="3" fill="#222"/>
      <ellipse cx="69" cy="56" rx="2.5" ry="3" fill="#222"/>
      <circle cx="52" cy="55" r="0.8" fill="#FFF"/>
      <circle cx="70" cy="55" r="0.8" fill="#FFF"/>
      <!-- Eyelashes -->
      <path d="M47,52 Q51,50 55,53" stroke="#222" stroke-width="1.2" fill="none"/>
      <path d="M65,53 Q69,50 73,52" stroke="#222" stroke-width="1.2" fill="none"/>
      <!-- Cheeks Blush -->
      <circle cx="47" cy="63" r="3.5" fill="#E06D8A" opacity="0.35"/>
      <circle cx="73" cy="63" r="3.5" fill="#E06D8A" opacity="0.35"/>
      <!-- Smile -->
      <path d="M54,67 Q60,73 66,67" stroke="#9C4158" stroke-width="2" stroke-linecap="round" fill="none"/>
    </svg>`;
  } else if (normalizedGender === 'male') {
    // Handsome Male Stylized Vector Portrait
    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%">
      <defs>
        <linearGradient id="bg_${paletteIndex}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${p.bg1}"/>
          <stop offset="100%" stop-color="${p.bg2}"/>
        </linearGradient>
      </defs>
      <rect width="120" height="120" rx="24" fill="url(#bg_${paletteIndex})"/>
      <!-- Neck & Shoulders -->
      <rect x="51" y="70" width="18" height="20" fill="${p.skin}" rx="4"/>
      <path d="M26,108 Q60,94 94,108 L98,120 L22,120 Z" fill="${p.acc}"/>
      <!-- Head -->
      <path d="M38,48 Q38,82 60,82 Q82,82 82,48 Q82,34 60,34 Q38,34 38,48 Z" fill="${p.skin}"/>
      <!-- Styled Modern Haircut -->
      <path d="M36,46 Q38,26 60,24 Q82,24 84,42 Q78,34 60,32 Q42,34 36,46 Z" fill="${p.hair}"/>
      <!-- Confident Eyes -->
      <ellipse cx="50" cy="54" rx="2.5" ry="3" fill="#222"/>
      <ellipse cx="70" cy="54" rx="2.5" ry="3" fill="#222"/>
      <circle cx="51" cy="53" r="0.8" fill="#FFF"/>
      <circle cx="71" cy="53" r="0.8" fill="#FFF"/>
      <!-- Eyebrows -->
      <path d="M45,49 L55,49" stroke="${p.hair}" stroke-width="2" stroke-linecap="round"/>
      <path d="M65,49 L75,49" stroke="${p.hair}" stroke-width="2" stroke-linecap="round"/>
      <!-- Smile -->
      <path d="M53,66 Q60,71 67,66" stroke="#873E23" stroke-width="2" stroke-linecap="round" fill="none"/>
    </svg>`;
  } else if (normalizedGender === 'child') {
    // Playful Happy Child Portrait
    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%">
      <defs>
        <linearGradient id="bg_${paletteIndex}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${p.bg1}"/>
          <stop offset="100%" stop-color="${p.bg2}"/>
        </linearGradient>
      </defs>
      <rect width="120" height="120" rx="24" fill="url(#bg_${paletteIndex})"/>
      <!-- Neck & Shirt -->
      <rect x="52" y="74" width="16" height="18" fill="${p.skin}" rx="4"/>
      <path d="M30,108 Q60,94 90,108 L94,120 L26,120 Z" fill="#F59E0B"/>
      <!-- Round Head -->
      <circle cx="60" cy="56" r="24" fill="${p.skin}"/>
      <!-- Playful Hair -->
      <path d="M38,48 Q44,28 60,26 Q76,28 82,48 Q72,38 60,38 Q48,38 38,48 Z" fill="${p.hair}"/>
      <circle cx="48" cy="32" r="6" fill="${p.hair}"/>
      <!-- Big Sparkling Eyes -->
      <circle cx="50" cy="54" r="4.5" fill="#222"/>
      <circle cx="70" cy="54" r="4.5" fill="#222"/>
      <circle cx="51.5" cy="52.5" r="1.5" fill="#FFF"/>
      <circle cx="71.5" cy="52.5" r="1.5" fill="#FFF"/>
      <!-- Rosy Cheeks -->
      <circle cx="44" cy="62" r="4" fill="#FF8080" opacity="0.5"/>
      <circle cx="76" cy="62" r="4" fill="#FF8080" opacity="0.5"/>
      <!-- Big Open Smile -->
      <path d="M52,64 Q60,74 68,64 Z" fill="#D946EF"/>
    </svg>`;
  } else {
    // Unisex Modern Monogram Badge
    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%">
      <defs>
        <linearGradient id="bg_${paletteIndex}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${p.bg1}"/>
          <stop offset="100%" stop-color="${p.bg2}"/>
        </linearGradient>
      </defs>
      <rect width="120" height="120" rx="24" fill="url(#bg_${paletteIndex})"/>
      <circle cx="60" cy="60" r="32" fill="#FFFFFF" opacity="0.3"/>
      <text x="60" y="69" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="34" font-weight="900" fill="#1E1E28" text-anchor="middle">${initial}</text>
    </svg>`;
  }

  return `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`;
}

/**
 * Helper to convert an uploaded image File into a base64 Data URL.
 */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > 4 * 1024 * 1024) {
      reject(new Error('Image must be smaller than 4MB'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = (err) => {
      reject(err);
    };
    reader.readAsDataURL(file);
  });
}
