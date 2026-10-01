export type Language = 'si' | 'en';

export const translations: Record<Language, Record<string, string>> = {
  si: {
    // Common interface labels
    'common.back': 'ආපසු',
    'common.home': 'මුල් පිටුව',
    'common.settings': 'සැකසුම්',
    'common.exit': 'නික්මෙන්න',
    'common.logout': 'ඉවත් වන්න',
    'common.close': 'වසන්න',
    'common.loading': 'ක්‍රියාත්මක වෙමින්...',
    'common.retry': 'නැවත උත්සාහ කරන්න',

    // Navigation bar & bottom tabs
    'nav.home': 'මුල් පිටුව',
    'nav.learning': 'ඉගෙනුම',
    'nav.games': 'ක්‍රීඩා',
    'nav.progress': 'ප්‍රගතිය',
    'nav.profile': 'මගේ ගිණුම',
    'navbar.font': 'අකුරු',

    // Settings screen
    'settings.title': 'සැකසුම්',
    'settings.language.section': 'භාෂාව',
    'settings.language.label': 'යෙදුමේ භාෂාව',
    'settings.language.sinhala': 'සිංහල',
    'settings.language.english': 'English',

    'settings.account': 'ගිණුම',
    'settings.profile': 'මගේ පැතිකඩ',
    'settings.changePassword': 'මුරපදය වෙනස් කරන්න',

    'settings.accessibility': 'ඉගෙනුම් පහසුකම්',
    'settings.fontSize': 'අකුරු ප්‍රමාණය',
    'settings.small': 'කුඩා',
    'settings.medium': 'මධ්‍යම',
    'settings.large': 'විශාල',

    'settings.lineSpacing': 'පේළි පරතරය',
    'settings.normal': 'සාමාන්‍ය',
    'settings.wide': 'පුළුල්',

    'settings.audioAssistance': 'ශබ්ද සහාය',
    'settings.readingSpeed': 'කියවීමේ වේගය',
    'settings.slow': 'මන්දගාමී',
    'settings.fast': 'වේගවත්',

    'settings.sound': 'ශබ්ද',
    'settings.soundFeedback': 'ශබ්ද ප්‍රතිචාර',

    // Role Selection Screen
    'auth.roleSelect.title': 'කාර්යභාරය තේරීම',
    'auth.roleSelect.subtitle': 'සුදුසු පළපුරුද්ද තෝරන්න',
    'auth.roleSelect.heading': 'අද කියවන්නේ කවුද?',
    'auth.roleSelect.subheading': 'සුදුසු පළපුරුද්ද ලබා ගැනීමට ඔබේ කාර්යභාරය තෝරන්න',
    'auth.roleSelect.studentTitle': 'මම ශිෂ්‍යයෙක්',
    'auth.roleSelect.studentDesc': 'ඔබේ කියවීමේ අභ්‍යාස ආරම්භ කරන්න! සිංහල වචන පුහුණු වී තරු දිනා ගන්න.',
    'auth.roleSelect.parentTitle': 'මම දෙමාපියෙක් / ගුරුවරයෙක්',
    'auth.roleSelect.parentDesc': 'කියවීමේ ප්‍රගතිය, උච්චාරණ දෝෂ වාර්තා සහ AI නිර්දේශ බලන්න.',
    'auth.roleSelect.registerLink': 'නැණ-මං හි අලුත්ද? ගිණුමක් සාදන්න →',

    // Login Screen
    'auth.login.title': 'ගිණුමට පිවිසෙන්න',
    'auth.login.studentTab': 'ශිෂ්‍ය පිවිසුම',
    'auth.login.parentTab': 'දෙමාපිය / ගුරු පිවිසුම',
    'auth.login.greeting': 'ආයුබෝවන්!',
    'auth.login.greetingSub': 'ඔබේ ඉගෙනුම් ගමන අදින් ආරම්භ කරමු.',
    'auth.login.tagline': 'නැණ මං · සිංහල කියවීමේ සහායක',
    'auth.login.parentHeroTag': 'දෙමාපිය සහ ගුරු පුවරුව',
    'auth.login.parentHeroTitle': 'දෙමාපිය / ගුරු පුවරුව',
    'auth.login.parentHeroDesc': 'ළමයාගේ දෛනික කියවීමේ ප්‍රගතිය, උච්චාරණ දෝෂ වාර්තා සහ AI නිර්දේශ අධීක්ෂණය සඳහා පිවිසෙන්න.',
    'auth.login.studentTitle': 'ශිෂ්‍ය ගිණුමට පිවිසෙන්න',
    'auth.login.parentTitle': 'ගිණුමට පිවිසෙන්න',
    'auth.login.studentLabel': 'ශිෂ්‍ය අංකය හෝ විද්‍යුත් තැපෑල',
    'auth.login.parentLabel': 'විද්‍යුත් තැපෑල හෝ දුරකථන අංකය',
    'auth.login.studentPlaceholder': 'ශිෂ්‍ය අංකය ඇතුළත් කරන්න',
    'auth.login.parentPlaceholder': 'parent@example.com',
    'auth.login.passwordLabel': 'මුරපදය',
    'auth.login.forgotPassword': 'මුරපදය අමතකද?',
    'auth.login.submitBtn': 'පිවිසෙන්න',
    'auth.login.noAccount': 'ගිණුමක් නැද්ද?',
    'auth.login.registerNow': 'දැන් ලියාපදිංචි වන්න',

    // Register Screen
    'auth.register.title': 'ගිණුමක් සාදන්න',
    'auth.register.subtitle': 'ඔබේ ඉගෙනුම් පැතිකඩ සකසන්න',
    'auth.register.parentTab': 'දෙමාපියන්',
    'auth.register.educatorTab': 'ගුරුවරුන් / උපදේශකයින්',
    'auth.register.fullName': 'සම්පූර්ණ නම',
    'auth.register.email': 'විද්‍යුත් තැපෑල',
    'auth.register.password': 'මුරපදය',
    'auth.register.confirmPassword': 'මුරපදය තහවුරු කරන්න',
    'auth.register.childName': 'ළමයාගේ නම',
    'auth.register.grade': 'ශ්‍රේණිය',
    'auth.register.submitBtn': 'ලියාපදිංචි වන්න',
    'auth.register.alreadyAccount': 'දැනටමත් ගිණුමක් තිබේද?',
    'auth.register.loginLink': 'පිවිසෙන්න',

    // Forgot Password & Verify Email
    'auth.forgotPassword.title': 'මුරපදය නැවත සකසන්න',
    'auth.forgotPassword.subtitle': 'ගිණුම නැවත ලබා ගැනීම',
    'auth.forgotPassword.desc': 'ඔබේ විද්‍යුත් තැපැල් ලිපිනය ඇතුළත් කරන්න. මුරපදය නැවත සැකසීමේ සබැඳියක් අපි එවන්නෙමු.',
    'auth.forgotPassword.submitBtn': 'යොමු කරන්න',
    'auth.verifyEmail.title': 'විද්‍යුත් තැපෑල සත්‍යාපනය කරන්න',
    'auth.verifyEmail.desc': 'පුවරුවට පිවිසීමට පෙර කරුණාකර ඔබගේ විද්‍යුත් තැපෑල සත්‍යාපනය කරන්න.',
    'auth.verifyEmail.checkBtn': 'සත්‍යාපනය පරීක්ෂා කරන්න',
    'auth.verifyEmail.resendBtn': 'නැවත යොමු කරන්න',

    // Dashboards Common UI
    'dashboard.greeting': 'ආයුබෝවන්',
    'dashboard.childTagline': 'ඔබේ දෛනික කියවීමේ අභ්‍යාස',
    'dashboard.parentTitle': 'දෙමාපිය / ගුරු පුවරුව',
    'dashboard.parentSubtitle': 'ළමයාගේ කියවීමේ ප්‍රගතිය සහ AI විශ්ලේෂණය',
  },
  en: {
    // Common interface labels
    'common.back': 'Back',
    'common.home': 'Home',
    'common.settings': 'Settings',
    'common.exit': 'Exit',
    'common.logout': 'Log Out',
    'common.close': 'Close',
    'common.loading': 'Loading...',
    'common.retry': 'Try Again',

    // Navigation bar & bottom tabs
    'nav.home': 'Home',
    'nav.learning': 'Learning',
    'nav.games': 'Games',
    'nav.progress': 'Progress',
    'nav.profile': 'Profile',
    'navbar.font': 'Font',

    // Settings screen
    'settings.title': 'Settings',
    'settings.language.section': 'Language',
    'settings.language.label': 'App Language',
    'settings.language.sinhala': 'Sinhala',
    'settings.language.english': 'English',

    'settings.account': 'Account',
    'settings.profile': 'My Profile',
    'settings.changePassword': 'Change Password',

    'settings.accessibility': 'Learning Accessibility',
    'settings.fontSize': 'Font Size',
    'settings.small': 'Small',
    'settings.medium': 'Medium',
    'settings.large': 'Large',

    'settings.lineSpacing': 'Line Spacing',
    'settings.normal': 'Normal',
    'settings.wide': 'Wide',

    'settings.audioAssistance': 'Audio Assistance',
    'settings.readingSpeed': 'Reading Speed',
    'settings.slow': 'Slow',
    'settings.fast': 'Fast',

    'settings.sound': 'Sound',
    'settings.soundFeedback': 'Sound Feedback',

    // Role Selection Screen
    'auth.roleSelect.title': 'Role Selection',
    'auth.roleSelect.subtitle': 'Choose your profile',
    'auth.roleSelect.heading': 'Who is reading today?',
    'auth.roleSelect.subheading': 'Choose your role to get the right experience',
    'auth.roleSelect.studentTitle': "I'm a Student",
    'auth.roleSelect.studentDesc': 'Start your reading adventure! Practice Sinhala words and earn stars.',
    'auth.roleSelect.parentTitle': "I'm a Parent / Teacher",
    'auth.roleSelect.parentDesc': 'View reading progress, clinical error reports, and AI recommendations.',
    'auth.roleSelect.registerLink': 'New to Nena-Man? Create an Account →',

    // Login Screen
    'auth.login.title': 'Log In',
    'auth.login.studentTab': 'Student Login',
    'auth.login.parentTab': 'Parent / Teacher Login',
    'auth.login.greeting': 'Welcome!',
    'auth.login.greetingSub': 'Let us start your learning journey today.',
    'auth.login.tagline': 'Nena Man · Sinhala Reading Companion',
    'auth.login.parentHeroTag': 'Guardian & Educator Portal',
    'auth.login.parentHeroTitle': 'Parent / Teacher Portal',
    'auth.login.parentHeroDesc': 'Access your child’s daily reading progress, pronunciation error reports, and AI recommendations.',
    'auth.login.studentTitle': 'Student Login',
    'auth.login.parentTitle': 'Parent / Teacher Login',
    'auth.login.studentLabel': 'Student ID or Email',
    'auth.login.parentLabel': 'Email or Phone Number',
    'auth.login.studentPlaceholder': 'Enter Student ID',
    'auth.login.parentPlaceholder': 'parent@example.com',
    'auth.login.passwordLabel': 'Password',
    'auth.login.forgotPassword': 'Forgot Password?',
    'auth.login.submitBtn': 'Sign In',
    'auth.login.noAccount': "Don't have an account?",
    'auth.login.registerNow': 'Register Now',

    // Register Screen
    'auth.register.title': 'Create Account',
    'auth.register.subtitle': 'Set up your learning profile',
    'auth.register.parentTab': 'Parent',
    'auth.register.educatorTab': 'Educators / Teachers',
    'auth.register.fullName': 'Full Name',
    'auth.register.email': 'Email Address',
    'auth.register.password': 'Password',
    'auth.register.confirmPassword': 'Confirm Password',
    'auth.register.childName': "Child's Name",
    'auth.register.grade': 'Grade',
    'auth.register.submitBtn': 'Register',
    'auth.register.alreadyAccount': 'Already have an account?',
    'auth.register.loginLink': 'Log In',

    // Forgot Password & Verify Email
    'auth.forgotPassword.title': 'Reset Password',
    'auth.forgotPassword.subtitle': 'Account Recovery',
    'auth.forgotPassword.desc': 'Enter your email address to receive a password reset link.',
    'auth.forgotPassword.submitBtn': 'Send Link',
    'auth.verifyEmail.title': 'Verify Email',
    'auth.verifyEmail.desc': 'Please verify your email before accessing the dashboard.',
    'auth.verifyEmail.checkBtn': 'Check Verification',
    'auth.verifyEmail.resendBtn': 'Resend Verification Email',

    // Dashboards Common UI
    'dashboard.greeting': 'Welcome',
    'dashboard.childTagline': 'Your daily reading exercises',
    'dashboard.parentTitle': 'Parent & Teacher Dashboard',
    'dashboard.parentSubtitle': 'Child reading progress & AI analytics',
  },
};
