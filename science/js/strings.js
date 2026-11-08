// Interface text in English, Hindi and Hinglish.
export const LANGS = ['en', 'hi', 'hg'];
export const LANG_LABEL = { en: 'English', hi: 'हिंदी', hg: 'Hinglish' };
export const FONT = '"Noto Sans Devanagari", "Noto Sans", system-ui, sans-serif';
export const T = {
  appTitle: { en: 'Science Lab 360', hi: 'साइंस लैब 360', hg: 'Science Lab 360' },
  chemistry: { en: 'Chemistry', hi: 'रसायन विज्ञान', hg: 'Chemistry' },
  physics: { en: 'Physics', hi: 'भौतिकी', hg: 'Physics' }, maths: { en: 'Maths', hi: 'गणित', hg: 'Maths' }, biology: { en: 'Biology', hi: 'जीव विज्ञान', hg: 'Biology' },
  astronomy: { en: 'Astronomy', hi: 'खगोल विज्ञान', hg: 'Astronomy' }, robotics: { en: 'Robotics', hi: 'रोबोटिक्स', hg: 'Robotics' }, nature: { en: 'Nature', hi: 'प्रकृति', hg: 'Nature' },
  soon: { en: 'coming soon', hi: 'जल्द आ रहा है', hg: 'jaldi aa raha hai' },
  all: { en: 'All', hi: 'सभी', hg: 'All' }, cls: { en: 'Class', hi: 'कक्षा', hg: 'Class' },
  experiments: { en: 'Experiments', hi: 'प्रयोग', hg: 'Experiments' },
  step: { en: 'Step', hi: 'चरण', hg: 'Step' }, of: { en: 'of', hi: 'में से', hg: 'of' },
  doLabel: { en: 'Do', hi: 'करें', hg: 'Karo' }, seeLabel: { en: 'You see', hi: 'आप देखेंगे', hg: 'Aap dekhoge' }, whyLabel: { en: 'Why', hi: 'क्यों', hg: 'Kyun' },
  doIt: { en: 'Do it', hi: 'करके दिखाएँ', hg: 'Karke dikhao' }, next: { en: 'Next', hi: 'आगे', hg: 'Next' }, back: { en: 'Back', hi: 'पीछे', hg: 'Back' },
  autoplay: { en: 'Auto play', hi: 'अपने-आप चलाएँ', hg: 'Auto play' }, pause: { en: 'Pause', hi: 'रोकें', hg: 'Pause' }, reset: { en: 'Start again', hi: 'फिर से शुरू', hg: 'Phir se shuru' },
  speed: { en: 'Speed', hi: 'गति', hg: 'Speed' }, notebook: { en: 'Lab notebook', hi: 'लैब नोटबुक', hg: 'Lab notebook' },
  aim: { en: 'Aim', hi: 'उद्देश्य', hg: 'Aim' }, needs: { en: 'You need', hi: 'सामग्री', hg: 'Saamaan' }, obs: { en: 'Observation', hi: 'प्रेक्षण', hg: 'Observation' },
  eq: { en: 'Equation', hi: 'समीकरण', hg: 'Equation' }, concl: { en: 'Conclusion', hi: 'निष्कर्ष', hg: 'Conclusion' }, safety: { en: 'Safety', hi: 'सावधानियाँ', hg: 'Safety' },
  viva: { en: 'Viva questions', hi: 'मौखिक प्रश्न', hg: 'Viva questions' }, showAns: { en: 'Show answer', hi: 'उत्तर देखें', hg: 'Answer dekho' },
  finished: { en: 'Experiment complete', hi: 'प्रयोग पूरा हुआ', hg: 'Experiment complete' },
  tapHint: { en: 'Tap the glowing item, or press “Do it”.', hi: 'चमकती चीज़ पर टैप करें, या “करके दिखाएँ” दबाएँ।', hg: 'Chamakti cheez par tap karo, ya “Karke dikhao” dabao.' },
  vrHint: { en: 'Point at the glowing item and pull the trigger — or grab things with the grip button and do it yourself.', hi: 'चमकती चीज़ की ओर इशारा करके ट्रिगर दबाएँ — या ग्रिप बटन से चीज़ें पकड़कर खुद करें।', hg: 'Chamakti cheez par point karke trigger dabao — ya grip button se cheezein pakad ke khud karo.' },
  doing: { en: 'Doing…', hi: 'हो रहा है…', hg: 'Ho raha hai…' },
  voice: { en: 'Voice', hi: 'आवाज़', hg: 'Voice' }, sound: { en: 'Sounds', hi: 'ध्वनि', hg: 'Sounds' },
  enterVR: { en: 'Enter VR', hi: 'VR में जाएँ', hg: 'VR mein jao' }, exitVR: { en: 'Exit VR', hi: 'VR से बाहर', hg: 'VR se bahar' },
  timelapse: { en: 'Time-lapse', hi: 'टाइम-लैप्स', hg: 'Time-lapse' },
  menu: { en: 'Menu', hi: 'मेनू', hg: 'Menu' }, recenter: { en: 'Recentre', hi: 'बीच में लाएँ', hg: 'Recentre' },
  pickExp: { en: 'Choose an experiment', hi: 'एक प्रयोग चुनें', hg: 'Ek experiment chuno' },
  welcome: { en: 'Welcome to the DUET STEM chemistry lab. Choose an experiment to begin.', hi: 'DUET STEM रसायन प्रयोगशाला में आपका स्वागत है। शुरू करने के लिए एक प्रयोग चुनें।', hg: 'DUET STEM chemistry lab mein welcome. Shuru karne ke liye ek experiment chuno.' },
  more: { en: 'More', hi: 'और', hg: 'Aur' },
};
export const tx = (o, L) => (o ? (o[L] || o.en || '') : '');
