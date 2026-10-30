/** The 22 Major Arcana with short original readings (English and Hindi). */
export type TarotCard = { name: string; nameHi: string; icon: string; en: string; hi: string };

export const MAJOR_ARCANA: TarotCard[] = [
  { name: "The Fool", nameHi: "द फ़ूल", icon: "fa-person-walking", en: "A fresh start. Trust yourself and take the first step.", hi: "नई शुरुआत। खुद पर भरोसा करें और पहला कदम उठाएं।" },
  { name: "The Magician", nameHi: "द मैजिशियन", icon: "fa-wand-magic-sparkles", en: "You already have the skills you need. Act with focus.", hi: "ज़रूरी हुनर आपके पास है। एकाग्रता से काम करें।" },
  { name: "The High Priestess", nameHi: "द हाई प्रीस्टेस", icon: "fa-moon", en: "Listen to your intuition before you decide.", hi: "निर्णय से पहले अपने अंतर्मन की सुनें।" },
  { name: "The Empress", nameHi: "द एम्प्रेस", icon: "fa-seedling", en: "Growth, care and abundance. Nurture what matters.", hi: "विकास, देखभाल और समृद्धि। जो ज़रूरी है उसे संवारें।" },
  { name: "The Emperor", nameHi: "द एम्परर", icon: "fa-crown", en: "Structure and discipline bring stability now.", hi: "अनुशासन और व्यवस्था से अभी स्थिरता आएगी।" },
  { name: "The Hierophant", nameHi: "द हायरोफ़ैंट", icon: "fa-book-open", en: "Seek guidance from tradition or a trusted mentor.", hi: "परंपरा या किसी भरोसेमंद गुरु से मार्गदर्शन लें।" },
  { name: "The Lovers", nameHi: "द लवर्स", icon: "fa-heart", en: "An important choice of the heart. Choose with honesty.", hi: "दिल से जुड़ा अहम फ़ैसला। ईमानदारी से चुनें।" },
  { name: "The Chariot", nameHi: "द चैरियट", icon: "fa-flag-checkered", en: "Willpower moves you forward. Stay on course.", hi: "इच्छाशक्ति आपको आगे ले जाएगी। राह पर टिके रहें।" },
  { name: "Strength", nameHi: "स्ट्रेंथ", icon: "fa-hand-fist", en: "Gentle courage and patience win over force.", hi: "धैर्य और कोमल साहस बल से अधिक प्रभावी है।" },
  { name: "The Hermit", nameHi: "द हर्मिट", icon: "fa-lightbulb", en: "Step back and reflect. Answers come from within.", hi: "थोड़ा रुककर सोचें। उत्तर भीतर से आएंगे।" },
  { name: "Wheel of Fortune", nameHi: "व्हील ऑफ़ फ़ॉर्च्यून", icon: "fa-dharmachakra", en: "Cycles are turning. Be ready for a change of luck.", hi: "समय का चक्र घूम रहा है। भाग्य बदलने को तैयार रहें।" },
  { name: "Justice", nameHi: "जस्टिस", icon: "fa-scale-balanced", en: "Fairness and truth. Actions bring their results.", hi: "न्याय और सत्य। कर्मों का फल मिलता है।" },
  { name: "The Hanged Man", nameHi: "द हैंग्ड मैन", icon: "fa-hourglass-half", en: "Pause. A new view of the situation will help.", hi: "ठहरें। स्थिति को नए नज़रिए से देखना मदद करेगा।" },
  { name: "Death", nameHi: "डेथ", icon: "fa-leaf", en: "An ending that makes room for something new.", hi: "एक अंत, जो कुछ नए के लिए जगह बनाता है।" },
  { name: "Temperance", nameHi: "टेम्परेंस", icon: "fa-glass-water", en: "Balance and moderation. Blend, don't rush.", hi: "संतुलन और संयम। जल्दबाज़ी न करें।" },
  { name: "The Devil", nameHi: "द डेविल", icon: "fa-link", en: "Notice what holds you back and loosen its grip.", hi: "पहचानें कि आपको क्या रोक रहा है और उससे मुक्त हों।" },
  { name: "The Tower", nameHi: "द टॉवर", icon: "fa-bolt", en: "A sudden shake-up clears what was unstable.", hi: "अचानक बदलाव अस्थिर चीज़ों को हटा देता है।" },
  { name: "The Star", nameHi: "द स्टार", icon: "fa-star", en: "Hope and healing. Keep faith in your path.", hi: "आशा और उपचार। अपनी राह पर विश्वास रखें।" },
  { name: "The Moon", nameHi: "द मून", icon: "fa-cloud-moon", en: "Things are unclear. Don't act on fear or rumours.", hi: "स्थिति अस्पष्ट है। डर या अफ़वाह पर कदम न उठाएं।" },
  { name: "The Sun", nameHi: "द सन", icon: "fa-sun", en: "Joy, success and clarity are on your side.", hi: "खुशी, सफलता और स्पष्टता आपके साथ हैं।" },
  { name: "Judgement", nameHi: "जजमेंट", icon: "fa-bell", en: "A wake-up call. Learn from the past and rise.", hi: "जागने का समय। अतीत से सीखें और आगे बढ़ें।" },
  { name: "The World", nameHi: "द वर्ल्ड", icon: "fa-earth-asia", en: "Completion and fulfilment. A chapter closes well.", hi: "पूर्णता और संतोष। एक अध्याय अच्छे से पूरा होता है।" },
];

export const CARD_BACK_ICONS = ["fa-sun", "fa-moon", "fa-star", "fa-eye", "fa-hand-holding-heart", "fa-compass", "fa-gem", "fa-infinity"];
