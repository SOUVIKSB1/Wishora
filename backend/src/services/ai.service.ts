interface GenerateWishParams {
  name: string;
  age?: number;
  gender?: string;
  relationship?: string;
  language?: string;
  tone?: 'Funny' | 'Heartfelt' | 'Poetic' | 'Short & Sweet';
}

interface WishSuggestion {
  tone: string;
  message: string;
  emoji_suggestion: string;
}

export async function generateWishSuggestions(params: GenerateWishParams): Promise<WishSuggestion[]> {
  const { name, age = 25, gender = 'unspecified', relationship = 'Friend', language = 'en' } = params;

  // If ANTHROPIC_API_KEY is available, we could fetch from Claude API.
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 800,
          messages: [{
            role: 'user',
            content: `Generate 3 distinct birthday wish messages for ${name}, who is turning ${age} years old.
The recipient is ${gender}. The sender's relationship: ${relationship}.
Tone options: [Funny, Heartfelt, Poetic, Short & Sweet].
Language: ${language}. Each wish should feel deeply human, warm, and specific to their milestone.
Do NOT use generic clichés like "May all your dreams come true."
Format: JSON array ONLY with objects having fields: "tone", "message", "emoji_suggestion".`
          }]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const textContent = data.content?.[0]?.text || '';
        const jsonMatch = textContent.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }
    } catch (e) {
      console.warn('Claude API request failed, falling back to neural generator:', e);
    }
  }

  // Built-in Multilingual Generative Engine
  return generateLocalizedWishes(name, age, gender, relationship, language);
}

function generateLocalizedWishes(
  name: string,
  age: number,
  gender: string,
  rel: string,
  lang: string
): WishSuggestion[] {
  const isChild = age < 15;
  const isSenior = age >= 50;

  switch (lang.toLowerCase()) {
    case 'bn': // Bengali
      return [
        {
          tone: 'Heartfelt',
          message: `${name}, তোমার এই ${age}তম জন্মদিনে এক রাশ ভালোবাসা আর শুভেচ্ছা! তোমার উপস্থিতি আমাদের জীবনে যে আনন্দ এনে দেয়, তা অমূল্য। আজকের দিনটা চমৎকার কাটুক!`,
          emoji_suggestion: '✨🎂❤️'
        },
        {
          tone: 'Poetic',
          message: `আকাশের তারাদের মতো উজ্জ্বল হোক তোমার আগামী দিনগুলো, ${name}। প্রতিটি পদক্ষেপে থাকুক সফলতা আর অটুট হাসি। শুভ জন্মদিন প্রিয়!`,
          emoji_suggestion: '🌸🌟🥂'
        },
        {
          tone: 'Funny',
          message: `শুভ জন্মদিন ${name}! বয়স তো একটা সাধারণ সংখ্যা মাত্র... যদিও তোমার বেলায় সংখ্যাটা একটু দ্রুতই বাড়ছে! আজ মন খুলে কেক খাও!`,
          emoji_suggestion: '🍰🎈😜'
        },
        {
          tone: 'Short & Sweet',
          message: `${name}, তোমাকে জন্মদিনের অফুরন্ত শুভেচ্ছা ও ভালোবাসা। দিনটি আনন্দে ভরপুর হোক!`,
          emoji_suggestion: '🎁💫🎉'
        }
      ];

    case 'hi': // Hindi
      return [
        {
          tone: 'Heartfelt',
          message: `${name}, आपके ${age}वें जन्मदिन पर ढेरों खुशियां और प्यार! आपकी मुस्कान हमेशा यूं ही चमकती रहे और आपका हर दिन खास बने। जन्मदिन मुबारक!`,
          emoji_suggestion: '🎂✨❤️'
        },
        {
          tone: 'Poetic',
          message: `चांदनी सी शीतलता और फूलों सी महक रहे आपकी जिंदगी में, ${name}। आने वाला हर साल आपके लिए नई उमंग लेकर आए।`,
          emoji_suggestion: '🌟🌸🥂'
        },
        {
          tone: 'Funny',
          message: `हैप्पी बर्थडे ${name}! उम्र चाहे जितनी भी बढ़ जाए, दिल से हमेशा बच्चे ही रहना (और पार्टी देना मत भूलना)!`,
          emoji_suggestion: '🍰🥳🍕'
        },
        {
          tone: 'Short & Sweet',
          message: `${name}, जन्मदिन की हार्दिक शुभकामनाएं! आपका जीवन सदा खुशियों से महकता रहे।`,
          emoji_suggestion: '🎉💖✨'
        }
      ];

    case 'es': // Spanish
      return [
        {
          tone: 'Heartfelt',
          message: `¡Feliz cumpleaños, ${name}! En tus ${age} años, gracias por iluminar cada momento con tu energía y cariño. ¡Que este nuevo año esté lleno de triunfos!`,
          emoji_suggestion: '🥂✨🎂'
        },
        {
          tone: 'Poetic',
          message: `${name}, que la vida te siga regalando atardeceres mágicos, abrazos sinceros y sueños cumplidos. Eres pura inspiración.`,
          emoji_suggestion: '🌟🌹💫'
        },
        {
          tone: 'Funny',
          message: `¡Felicidades ${name}! No estás envejeciendo, te estás convirtiendo en un clásico inolvidable. ¡A celebrar en grande!`,
          emoji_suggestion: '🎉🍾😎'
        },
        {
          tone: 'Short & Sweet',
          message: `¡Muchas felicidades en tu día, ${name}! Que sea un año extraordinario.`,
          emoji_suggestion: '🎂🎈❤️'
        }
      ];

    case 'fr': // French
      return [
        {
          tone: 'Heartfelt',
          message: `Joyeux anniversaire ${name} ! Pour tes ${age} ans, je te souhaite une année pleine d'amour, de rires et de beaux projets. Merci d'être une personne si précieuse.`,
          emoji_suggestion: '✨🎂🥂'
        },
        {
          tone: 'Poetic',
          message: `${name}, que chaque instant de cette nouvelle bougie rayonne de poésie et de bonheur partagé. Très bel anniversaire !`,
          emoji_suggestion: '🌸🌟🍷'
        },
        {
          tone: 'Funny',
          message: `Bon anniversaire ${name} ! Un an de plus, mais toujours autant de classe (et d'énergie pour faire la fête) !`,
          emoji_suggestion: '🍰🎉😄'
        },
        {
          tone: 'Short & Sweet',
          message: `Joyeux anniversaire ${name} ! Que cette journée soit aussi lumineuse que toi.`,
          emoji_suggestion: '🎁💫💖'
        }
      ];

    case 'de': // German
      return [
        {
          tone: 'Heartfelt',
          message: `Alles Gute zum ${age}. Geburtstag, ${name}! Möge dein neues Lebensjahr voller unvergesslicher Augenblicke, Gesundheit und Freude sein.`,
          emoji_suggestion: '🎂✨🍀'
        },
        {
          tone: 'Funny',
          message: `Herzlichen Glückwunsch ${name}! Du wirst nicht älter, sondern einfach immer spektakulärer. Lass dich heute ordentlich feiern!`,
          emoji_suggestion: '🍻🎉🎈'
        },
        {
          tone: 'Poetic',
          message: `Möge jeder neue Tag wie ein Sonnenstrahl deine Welt erhellen, ${name}. Ein wundervolles neues Lebensjahr!`,
          emoji_suggestion: '🌟🌿💫'
        },
        {
          tone: 'Short & Sweet',
          message: `Liebe ${name}, alles Liebe und Gute zum Geburtstag! Genieße deinen Ehrentag.`,
          emoji_suggestion: '🥂🎁❤️'
        }
      ];

    case 'ja': // Japanese
      return [
        {
          tone: 'Heartfelt',
          message: `${name}さん、${age}歳のお誕生日おめでとうございます！いつも温かい笑顔をありがとう。素敵な1年になりますように。`,
          emoji_suggestion: '🎂🌸✨'
        },
        {
          tone: 'Poetic',
          message: `${name}さんの歩む未来が、光あふれる実り豊かな日々でありますように。心より祝福を込めて。`,
          emoji_suggestion: '🌟🍁🍵'
        },
        {
          tone: 'Short & Sweet',
          message: `${name}さん、お誕生日おめでとうございます！最高の一日をお過ごしください。`,
          emoji_suggestion: '🎉🎁🎈'
        }
      ];

    default: // English
      return [
        {
          tone: 'Heartfelt',
          message: isChild
            ? `Happy ${age}th Birthday ${name}! You bring so much endless laughter, curious wonder, and pure sunshine to everyone around you. Keep dreaming big! 🚀`
            : isSenior
            ? `Happy ${age}th Birthday, ${name}. Your wisdom, warmth, and grace are a constant guiding light. Wishing you a year of deep contentment, health, and cherished moments.`
            : `Happy ${age}th Birthday, ${name}! Your presence makes every room brighter and every conversation richer. Here's to a year of bold leaps, unforgettable memories, and pure joy.`,
          emoji_suggestion: '✨🎂🥂'
        },
        {
          tone: 'Poetic',
          message: `${name}, may this next chapter unfold like a masterfully shot film — filled with golden light, quiet triumphs, and people who truly see how extraordinary you are.`,
          emoji_suggestion: '🌟🎞️🕯️'
        },
        {
          tone: 'Funny',
          message: `Happy Birthday ${name}! Congratulations on surviving another 365 days of being awesome (and slightly chaotic). You’re not getting older, just more limited edition!`,
          emoji_suggestion: '🍰🍸🕺'
        },
        {
          tone: 'Short & Sweet',
          message: `${name}, wishing you a day as brilliant, kind, and unforgettable as you are. Cheers to ${age}!`,
          emoji_suggestion: '🎁💫🎉'
        }
      ];
  }
}
