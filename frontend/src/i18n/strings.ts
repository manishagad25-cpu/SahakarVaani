// Bilingual string dictionary — Tamil (ta) & English (en)
export type Lang = 'en' | 'ta';

export const strings = {
  // ── App ─────────────────────────────────────────────────────────────────
  appName: { en: 'SahakarVaani', ta: 'சஹாகார்வாணி' },
  tagline: {
    en: 'Your voice. Your work. Your cooperative.',
    ta: 'உங்கள் குரல். உங்கள் வேலை. உங்கள் கூட்டுறவு.',
  },
  demoLabel: { en: '⚠ Demo data', ta: '⚠ டெமோ தரவு' },

  // ── Navigation ───────────────────────────────────────────────────────────
  nav: {
    home: { en: 'Home', ta: 'முகப்பு' },
    dashboard: { en: 'Dashboard', ta: 'டாஷ்போர்ட்' },
    bookService: { en: 'Book a Service', ta: 'சேவை பதிவு செய்க' },
    myBookings: { en: 'My Bookings', ta: 'என் முன்பதிவுகள்' },
    workers: { en: 'Workers', ta: 'தொழிலாளர்கள்' },
    payments: { en: 'Payments', ta: 'கட்டணங்கள்' },
    ratings: { en: 'Ratings & Disputes', ta: 'மதிப்பீடுகள் & தகராறுகள்' },
    settings: { en: 'Settings', ta: 'அமைப்புகள்' },
    logout: { en: 'Sign Out', ta: 'வெளியேறு' },
    adminPanel: { en: 'Admin Panel', ta: 'நிர்வாக பலகை' },
    allocation: { en: 'Fair Allocation', ta: 'நியாயமான ஒதுக்கீடு' },
    forecast: { en: 'Demand Forecast', ta: 'தேவை முன்னறிவிப்பு' },
    federation: { en: 'Federation', ta: 'கூட்டமைப்பு' },
    welfare: { en: 'Welfare Claims', ta: 'நல உரிமைகோரல்கள்' },
  },

  // ── Auth ─────────────────────────────────────────────────────────────────
  auth: {
    signIn: { en: 'Sign In', ta: 'உள்நுழைக' },
    signUp: { en: 'Create Account', ta: 'கணக்கு உருவாக்கவும்' },
    email: { en: 'Email address', ta: 'மின்னஞ்சல் முகவரி' },
    password: { en: 'Password', ta: 'கடவுச்சொல்' },
    fullName: { en: 'Full name', ta: 'முழு பெயர்' },
    phone: { en: 'Phone number', ta: 'தொலைபேசி எண்' },
    role: { en: 'I am a', ta: 'நான் ஒரு' },
    roleCustomer: { en: 'Customer', ta: 'வாடிக்கையாளர்' },
    roleWorker: { en: 'Service Worker', ta: 'சேவை தொழிலாளர்' },
    signingIn: { en: 'Signing in…', ta: 'உள்நுழைகிறோம்…' },
    noAccount: { en: "Don't have an account?", ta: 'கணக்கு இல்லையா?' },
    haveAccount: { en: 'Already have an account?', ta: 'ஏற்கனவே கணக்கு உள்ளதா?' },
    forgotPassword: { en: 'Forgot password?', ta: 'கடவுச்சொல் மறந்துவிட்டதா?' },
    loginAs: { en: 'Login as', ta: 'இவராக உள்நுழைக' },
  },

  // ── Landing page ─────────────────────────────────────────────────────────
  landing: {
    heroTitle: {
      en: 'Household Services, Powered by Your Community',
      ta: 'உங்கள் சமூகத்தால் இயக்கப்படும் வீட்டு சேவைகள்',
    },
    heroSubtitle: {
      en: 'A worker-owned cooperative platform connecting households with verified local service professionals — accessible by voice, in Tamil.',
      ta: 'சரிபார்க்கப்பட்ட உள்ளூர் சேவை நிபுணர்களுடன் வீடுகளை இணைக்கும் தொழிலாளர் சொந்தமான கூட்டுறவு தளம் — குரல் மூலம், தமிழில் அணுகலாம்.',
    },
    bookNow: { en: 'Book a Service', ta: 'சேவை பதிவு செய்க' },
    joinWorker: { en: 'Join as a Worker', ta: 'தொழிலாளராக சேரவும்' },
    coopLogin: { en: 'Cooperative Login', ta: 'கூட்டுறவு உள்நுழைவு' },
    howItWorks: { en: 'How It Works', ta: 'எப்படி வேலை செய்கிறது' },
    step1Title: { en: 'Request a Service', ta: 'சேவையை கோரவும்' },
    step1Desc: {
      en: 'Speak or type your service request in Tamil or English. Our assistant extracts the details.',
      ta: 'தமிழ் அல்லது ஆங்கிலத்தில் உங்கள் சேவை கோரிக்கையை பேசுங்கள் அல்லது தட்டச்சு செய்யுங்கள்.',
    },
    step2Title: { en: 'Get a Fair Match', ta: 'நியாயமான பொருத்தம் பெறுங்கள்' },
    step2Desc: {
      en: 'Our algorithm matches you with a verified, available worker — balancing skill, distance, and fair job distribution.',
      ta: 'எங்கள் வழிமுறை திறன், தூரம் மற்றும் நியாயமான வேலை விநியோகத்தை சமநிலைப்படுத்தி சரிபார்க்கப்பட்ட தொழிலாளரை உங்களுக்கு பொருத்துகிறது.',
    },
    step3Title: { en: 'Complete the Job', ta: 'வேலையை முடிக்கவும்' },
    step3Desc: {
      en: 'The worker completes the job. You pay transparently. The cooperative deducts a fair share, and workers earn directly.',
      ta: 'தொழிலாளர் வேலையை முடிக்கிறார். நீங்கள் வெளிப்படையாக செலுத்துகிறீர்கள். கூட்டுறவு நியாயமான பங்கை கழிக்கிறது.',
    },
    services: { en: 'Our Services', ta: 'எங்கள் சேவைகள்' },
    trust: { en: 'Why Trust SahakarVaani?', ta: 'ஏன் சஹாகார்வாணியை நம்புகிறீர்கள்?' },
    trustVerified: { en: 'Cooperative Verification', ta: 'கூட்டுறவு சரிபார்ப்பு' },
    trustVerifiedDesc: {
      en: 'Every worker is verified by a registered cooperative, not just an algorithm.',
      ta: 'ஒவ்வொரு தொழிலாளரும் ஒரு பதிவு செய்யப்பட்ட கூட்டுறவு மூலம் சரிபார்க்கப்படுகிறார்.',
    },
    trustPricing: { en: 'Transparent Pricing', ta: 'வெளிப்படையான விலை' },
    trustPricingDesc: {
      en: 'You see exactly how the fee is split between the worker and the cooperative.',
      ta: 'கட்டணம் தொழிலாளருக்கும் கூட்டுறவுக்கும் எவ்வாறு பிரிக்கப்படுகிறது என்பதை நீங்கள் தெளிவாக காண்கிறீர்கள்.',
    },
    trustVoice: { en: 'Voice-First, Tamil-First', ta: 'குரல் முதல், தமிழ் முதல்' },
    trustVoiceDesc: {
      en: 'Designed for low-literacy users. Speak your request in Tamil — no forms needed.',
      ta: 'குறைந்த எழுத்தறிவு உள்ளவர்களுக்காக வடிவமைக்கப்பட்டது. தமிழில் கோரிக்கையை பேசுங்கள்.',
    },
    trustWelfare: { en: 'Worker Welfare', ta: 'தொழிலாளர் நலன்' },
    trustWelfareDesc: {
      en: 'Workers access welfare support through the cooperative. Contributions are tracked transparently.',
      ta: 'தொழிலாளர்கள் கூட்டுறவு மூலம் நலன் ஆதரவை அணுகுகிறார்கள். பங்களிப்புகள் வெளிப்படையாக கண்காணிக்கப்படுகின்றன.',
    },
    disclaimer: {
      en: 'SahakarVaani is a cooperative-run platform prototype. It is not a government service and does not imply official endorsement.',
      ta: 'சஹாகார்வாணி ஒரு கூட்டுறவு-இயங்கும் தளம் முன்மாதிரி. இது அரசு சேவை அல்ல மற்றும் அதிகாரப்பூர்வ அங்கீகாரத்தை குறிக்கவில்லை.',
    },
  },

  // ── Booking ──────────────────────────────────────────────────────────────
  booking: {
    newBooking: { en: 'New Booking', ta: 'புதிய முன்பதிவு' },
    selectService: { en: 'Select a Service', ta: 'சேவையை தேர்ந்தெடுக்கவும்' },
    date: { en: 'Date', ta: 'தேதி' },
    timeWindow: { en: 'Time Window', ta: 'நேர இடைவெளி' },
    address: { en: 'Address', ta: 'முகவரி' },
    city: { en: 'City', ta: 'நகரம்' },
    urgency: { en: 'Urgency', ta: 'அவசரநிலை' },
    notes: { en: 'Additional notes', ta: 'கூடுதல் குறிப்புகள்' },
    confirm: { en: 'Confirm Booking', ta: 'முன்பதிவை உறுதிப்படுத்துக' },
    cancel: { en: 'Cancel', ta: 'ரத்து செய்' },
    status: { en: 'Status', ta: 'நிலை' },
    reference: { en: 'Booking Ref', ta: 'முன்பதிவு குறிப்பு' },
    requestedService: { en: 'Requested Service', ta: 'கோரிய சேவை' },
    assignedWorker: { en: 'Assigned Worker', ta: 'நியமிக்கப்பட்ட தொழிலாளர்' },
    urgencyNormal: { en: 'Normal', ta: 'சாதாரண' },
    urgencyUrgent: { en: 'Urgent', ta: 'அவசரம்' },
    urgencyEmergency: { en: 'Emergency', ta: 'அவசரகால நிலை' },
    morning: { en: 'Morning (7–12)', ta: 'காலை (7–12)' },
    afternoon: { en: 'Afternoon (12–17)', ta: 'மதியம் (12–17)' },
    evening: { en: 'Evening (17–21)', ta: 'மாலை (17–21)' },
    statusRequested: { en: 'Requested', ta: 'கோரப்பட்டது' },
    statusMatched: { en: 'Matched', ta: 'பொருத்தப்பட்டது' },
    statusAccepted: { en: 'Accepted', ta: 'ஏற்றுக்கொள்ளப்பட்டது' },
    statusInProgress: { en: 'In Progress', ta: 'நடைபெறுகிறது' },
    statusCompleted: { en: 'Completed', ta: 'முடிந்தது' },
    statusCancelled: { en: 'Cancelled', ta: 'ரத்து செய்யப்பட்டது' },
  },

  // ── Voice ─────────────────────────────────────────────────────────────────
  voice: {
    title: { en: 'Voice Booking Assistant', ta: 'குரல் முன்பதிவு உதவியாளர்' },
    subtitle: {
      en: 'Speak your service request in Tamil or English.',
      ta: 'தமிழ் அல்லது ஆங்கிலத்தில் உங்கள் சேவை கோரிக்கையை பேசுங்கள்.',
    },
    tapToSpeak: { en: 'Tap to speak', ta: 'பேச தட்டவும்' },
    listening: { en: 'Listening…', ta: 'கேட்கிறோம்…' },
    processing: { en: 'Processing your request…', ta: 'உங்கள் கோரிக்கையை செயலாக்குகிறோம்…' },
    transcript: { en: 'Recognized', ta: 'அங்கீகரிக்கப்பட்டது' },
    extractedDetails: { en: 'Extracted Details', ta: 'பிரித்தெடுக்கப்பட்ட விவரங்கள்' },
    pleaseConfirm: {
      en: 'Please confirm these details before we create your booking.',
      ta: 'முன்பதிவை உருவாக்குவதற்கு முன் இந்த விவரங்களை உறுதிப்படுத்தவும்.',
    },
    missingFields: {
      en: 'Please provide the following before confirming:',
      ta: 'உறுதிப்படுத்துவதற்கு முன் பின்வருவனவற்றை வழங்கவும்:',
    },
    retry: { en: 'Try Again', ta: 'மீண்டும் முயற்சிக்கவும்' },
    typeInstead: { en: 'Type instead', ta: 'தட்டச்சு செய்யுங்கள்' },
    operatorHelp: { en: 'Get Operator Help', ta: 'ஆபரேட்டர் உதவி பெறுங்கள்' },
    samplePrompt: {
      en: 'Try: "I need a plumber tomorrow morning"',
      ta: 'முயற்சிக்கவும்: "நாளைக்கு காலையில் ஒரு plumber வேண்டும்"',
    },
    permissionNeeded: {
      en: 'Microphone permission is needed. Please allow access and try again.',
      ta: 'மைக்ரோஃபோன் அனுமதி தேவை. அணுகலை அனுமதித்து மீண்டும் முயற்சிக்கவும்.',
    },
    voiceDemoMode: {
      en: 'Voice Demo Mode (no live STT configured)',
      ta: 'குரல் டெமோ பயன்முறை (நேரடி STT இல்லை)',
    },
    confidenceLow: {
      en: 'Recognition confidence is low. Please review the extracted fields.',
      ta: 'அங்கீகார நம்பகத்தன்மை குறைவாக உள்ளது. பிரித்தெடுக்கப்பட்ட புலங்களை மதிப்பாய்வு செய்யவும்.',
    },
  },

  // ── Worker ────────────────────────────────────────────────────────────────
  worker: {
    availability: { en: 'Availability', ta: 'கிடைக்கும் தன்மை' },
    available: { en: 'Available', ta: 'கிடைக்கும்' },
    unavailable: { en: 'Unavailable', ta: 'கிடைக்காது' },
    skills: { en: 'Skills', ta: 'திறன்கள்' },
    rating: { en: 'Rating', ta: 'மதிப்பீடு' },
    distance: { en: 'Distance', ta: 'தூரம்' },
    earnings: { en: 'Earnings', ta: 'வருமானம்' },
    jobs: { en: 'Jobs', ta: 'வேலைகள்' },
    accept: { en: 'Accept Job', ta: 'வேலையை ஏற்கவும்' },
    decline: { en: 'Decline', ta: 'மறுக்கவும்' },
    verificationStatus: { en: 'Verification Status', ta: 'சரிபார்ப்பு நிலை' },
    pending: { en: 'Pending Verification', ta: 'சரிபார்ப்பு நிலுவையில்' },
    verified: { en: 'Verified', ta: 'சரிபார்க்கப்பட்டது' },
    rejected: { en: 'Rejected', ta: 'நிராகரிக்கப்பட்டது' },
    welfareContrib: { en: 'Welfare Contribution', ta: 'நல பங்களிப்பு' },
    cooperative: { en: 'Cooperative', ta: 'கூட்டுறவு' },
  },

  // ── Admin ─────────────────────────────────────────────────────────────────
  admin: {
    verifyWorker: { en: 'Verify Worker', ta: 'தொழிலாளரை சரிபார்க்கவும்' },
    rejectWorker: { en: 'Reject', ta: 'நிராகரிக்கவும்' },
    pendingQueue: { en: 'Pending Verification Queue', ta: 'சரிபார்ப்பு காத்திருப்பு வரிசை' },
    recentActivity: { en: 'Recent Activity', ta: 'சமீபத்திய செயல்பாடு' },
    commissionRate: { en: 'Commission Rate', ta: 'கமிஷன் விகிதம்' },
    welfareRate: { en: 'Welfare Rate', ta: 'நல விகிதம்' },
  },

  // ── Common ────────────────────────────────────────────────────────────────
  common: {
    loading: { en: 'Loading…', ta: 'ஏற்றுகிறோம்…' },
    save: { en: 'Save', ta: 'சேமிக்கவும்' },
    submit: { en: 'Submit', ta: 'சமர்ப்பிக்கவும்' },
    search: { en: 'Search', ta: 'தேடல்' },
    filter: { en: 'Filter', ta: 'வடிகட்டி' },
    noData: { en: 'No data available.', ta: 'தரவு இல்லை.' },
    error: { en: 'An error occurred. Please try again.', ta: 'பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.' },
    success: { en: 'Done!', ta: 'முடிந்தது!' },
    viewDetails: { en: 'View Details', ta: 'விவரங்களை பார்க்கவும்' },
    back: { en: 'Back', ta: 'திரும்பு' },
    edit: { en: 'Edit', ta: 'திருத்து' },
    delete: { en: 'Delete', ta: 'நீக்கு' },
    confirm: { en: 'Confirm', ta: 'உறுதிப்படுத்து' },
    close: { en: 'Close', ta: 'மூடு' },
    yes: { en: 'Yes', ta: 'ஆம்' },
    no: { en: 'No', ta: 'இல்லை' },
    km: { en: 'km', ta: 'கி.மீ' },
    inr: { en: '₹', ta: '₹' },
    perHour: { en: '/hr', ta: '/மணி' },
    all: { en: 'All', ta: 'அனைத்தும்' },
    today: { en: 'Today', ta: 'இன்று' },
    tomorrow: { en: 'Tomorrow', ta: 'நாளை' },
    thisWeek: { en: 'This week', ta: 'இந்த வாரம்' },
  },
} as const;

export type StringKey = keyof typeof strings;

export function t(
  key: string,
  lang: Lang = 'en'
): string {
  const parts = key.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let obj: any = strings;
  for (const p of parts) {
    obj = obj?.[p];
    if (obj === undefined) return key;
  }
  return obj?.[lang] ?? obj?.['en'] ?? key;
}
