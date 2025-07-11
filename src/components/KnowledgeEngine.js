
const knowledgeBase = [
  {
    keywords: ['course', 'available', 'offer', 'program', 'programme', 'degrees'],
    responses: {
      en: "We offer BCA, MCA, MBA, and B.Tech in Computer Science.",
      hi: "हम BCA, MCA, MBA और कंप्यूटर साइंस में B.Tech कोर्स ऑफर करते हैं।"
    }
  },
  {
    keywords: ['fee', 'payment', 'cost', 'structure', 'charges'],
    responses: {
      en: "The fee structure starts from ₹16,000 per year Up To Depends On the Course You Choose ",
      hi: "फीस संरचना ₹50,000 प्रति वर्ष से शुरू होती है।"
    }
  },

   {
    keywords: ['location', 'place', 'situated', 'where is', 'kidhar hai' , 'address'],
    responses: {
      en: "Mind Power University Is Situated In Bohra Kunn Bheemtaal Nainital Uttarakhand India"
      
    }
  },

  {
    keywords: ['register', 'admission', 'apply', 'join', 'admission', 'enroll'],
    responses: {
      en: "You can register by saying 'yes' when I ask.",
      hi: "आप मेरे पूछने पर 'हां' कहकर रजिस्टर कर सकते हैं।"
    }
  },
  {
    keywords: ['contact', 'email', 'phone', 'number'],
    responses: {
      en: "Contact us at info@mindpoweruniversity.ac.in or call +91 8439512284.",
      hi: "हमें admissions@university.edu पर ईमेल करें या +91 9876543210 पर कॉल करें।"
    }
  }
];

export const getResponse = (text, lang = 'en') => {
  const input = text.toLowerCase();
  
  // Check for exact matches first
  for (const item of knowledgeBase) {
    if (item.keywords.some(keyword => {
      if (typeof keyword === 'string') {
        return input.includes(keyword);
      }
      return false;
    })) {
      return item.responses[lang] || item.responses.en;
    }
  }
  
  return lang === 'hi' 
    ? "मैं समझ नहीं पाया। कृपया दोबारा पूछें।" 
    : "I'm not sure I understand. Could you rephrase that?";
};