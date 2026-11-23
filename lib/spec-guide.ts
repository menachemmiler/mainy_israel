import { NAV_ITEMS } from "@/lib/nav";

export type SpecPage = {
  title: string;
  spec: string;
  need: string;
};

export type SpecButton = {
  label: string;
  href?: string;
  spec: string;
  does: string;
};

export type SpotlightStep = {
  tourId: string;
  parentHref?: string;
  label: string;
  spec: string;
  does: string;
};

export const PAGE_SPEC: Record<string, SpecPage> = {
  "/": {
    title: "בית גזבר",
    spec: "חלק ב — בית גזבר + חלק א סעיף 7 תזרים",
    need: "יתרות, זמן עדכון בנק, תור משימות וטיוטות במבט אחד. יתרה ונקודת שפל קודמות לפירוט.",
  },
  "/tasks": {
    title: "תיבת משימות",
    spec: "חלק א §1 + חלק ב תיבת משימות",
    need: "כל חריג הופך למשימה עם אחראי, מועד ומקור. בלי משימה אין חריג שקט.",
  },
  "/budget": {
    title: "תקציב",
    spec: "חלק ב — בניית תקציב ויעדי גיוס",
    need: "טבלה לפי שנה, אגף, פרויקט וסעיף. שנתי מול חודשי מתיישב לפני אישור, והכנסה נגדית מזינה יעד גיוס.",
  },
  "/projects": {
    title: "פרויקטים",
    spec: "חלק ב — כרטיס פרויקט",
    need: "תקציב, עלות צפויה, מאושר, שולם, פתוח וסעיפים שטרם דווחו. מפיק רואה רק את הפרויקטים שלו.",
  },
  "/contacts": {
    title: "אלפון",
    spec: "חלק ב — צדדים וכרטסת + חיפוש לפי הרשאה",
    need: "אדם, משפחה או ארגון יכולים להיות תורם, ספק, זכאי או מוטב. החיפוש כפוף לאותה מדיניות הרשאות.",
  },
  "/fundraising": {
    title: "תורמים והתחייבויות",
    spec: "חלק א ציר תורם רוחבי + חלק ב גיוס",
    need: "כרטיס תורם משותף אחד. מנהל אגף רואה תרומה לאגף אחר בתאריך, סכום וייעוד בלבד.",
  },
  "/fundraising/recurring": {
    title: "הוראות קבע",
    spec: "חלק ב — גבייה והוראות קבע",
    need: "מעקב גבייה: עתידי, ממתין, נכשל, חלקי, נגבה. חיוב, קבלה וזיכוי בנק הם אירועים נפרדים.",
  },
  "/payments": {
    title: "בקשות ותשלומים",
    spec: "חלק ב — קליטת בקשה, אישור ותשלום",
    need: "מגיש, זכאי ומוטב יכולים להיות שונים. אישור מלא או חלקי, הפרדת מגיש ממאשר, ואז תזרים.",
  },
  "/vendors": {
    title: "ספקים",
    spec: "חלק א §1 ספק + חלק ב פורטל ספק",
    need: "הספק רואה רק מה שהותר לו: הגשה, השלמה ובקשת שינוי פרטי חשבון. החשבון ממוסך לפי הרשאה.",
  },
  "/payroll": {
    title: "שכר וקבועים",
    spec: "חלק ב — מסך שכר",
    need: "מחזור, רכיבי תשלום ושיוך עלות. גישת שכר נפרדת מתפקידי הליבה; אין חשיפת שורות שכר לתפקיד אחר.",
  },
  "/banking": {
    title: "חשבונות ויתרות",
    spec: "חלק ב — חשבונות בנק + שליפת יתרה",
    need: "חשבון, מטבע ויתרה מאומתת עם מועד חתך. אין להסיק מהחשבון לאיזה אגף שייכת תרומה.",
  },
  "/banking/movements": {
    title: "תנועות",
    spec: "חלק ב — תנועות עו״ש ומט״ח מפאגי",
    need: "שליפת תנועות מהבנק כמקור ביצוע. תנועה פנימית מתקזזת רק לאחר התאמה.",
  },
  "/banking/drafts": {
    title: "טיוטות העברה",
    spec: "חלק א B01 + מדיניות כתיבה לבנק",
    need: "המערכת מכינה אצווה וטיוטה. שידור חי כבוי (מצב mock) עד אישור. חתימה סופית נשארת בבנק.",
  },
  "/banking/checks": {
    title: "פנקס צ׳קים",
    spec: "חלק א B03 + חלק ב פנקס צ׳קים",
    need: "נכנס/יוצא, מועד פירעון וסעיף תזרים. צ׳ק חלופי מקושר לקודם כדי שלא יהיו שתי תחזיות לאותו חוב.",
  },
  "/banking/cashflow": {
    title: "תזרים ותרחישים",
    spec: "חלק א סעיף 7 + חלק ב תזרים",
    need: "יתרה מאומתת + תנועות אחרי חתך + תחזית. תרחישי דחייה בלי לשכתב את הבסיס. מטבעות לא מחוברים בלי שער.",
  },
  "/banking/connections": {
    title: "חיבורי בנק",
    spec: "סעיפים 1.4.1–1.4.4 שיטת הזדהות לפאגי",
    need: "הפניה ל־OAuth של מנהל הכספים, החלפת access_code ב־Refresh Token, בלי סיסמת בנק אצלנו.",
  },
  "/communications": {
    title: "תקשורת",
    spec: "חלק ב — ערוצי קליטה (וואטסאפ, מייל, גיליון)",
    need: "קליטה ממקור חיצוני הופכת למשימה או בקשה עם קישור לרשומה. אין כסף בלי שיוך.",
  },
  "/reports": {
    title: "דוחות",
    spec: "חלק א הרשאות בייצוא + חלק ב פלט",
    need: "ייצוא ושיתוף לפי אותה מטריצת הרשאות. דוח להנהלה ממוקד בחריגים ובמי מטפל.",
  },
  "/settings": {
    title: "הגדרות והרשאות",
    spec: "חלק א A01 — מה המשתמש יראה",
    need: "תצוגה לפי תחום ופעולה עם הכלל שמכריע. מנהל מערכת מנהל חיבורים, לא רואה אוטומטית את כל הנתונים העסקיים.",
  },
};

export const NAV_BUTTONS: SpecButton[] = [
  {
    label: "בית",
    href: "/",
    spec: "חלק ב — בית גזבר",
    does: "פותח את לוח הבקרה: יתרות, משימות פתוחות, גבייה ממתינה וטיוטות בנק.",
  },
  {
    label: "משימות",
    href: "/tasks",
    spec: "תיבת משימות",
    does: "מרכז חריגים לטיפול: סירוב גבייה, המתנה לבנק, ליד והשלמת מסמך.",
  },
  {
    label: "תקציב ופרויקטים",
    href: "/budget",
    spec: "בניית תקציב",
    does: "כניסה לתקציב השנתי/חודשי ולפרויקטים שמתחתיו.",
  },
  {
    label: "תקציב",
    href: "/budget",
    spec: "מסך בניית תקציב",
    does: "עריכת סעיפים, פריסה ואחראי לפי אגף.",
  },
  {
    label: "פרויקטים",
    href: "/projects",
    spec: "כרטיס פרויקט",
    does: "סטטוס עלות, מימון וסעיפים שטרם דווחו.",
  },
  {
    label: "גיוס ותורמים",
    href: "/fundraising",
    spec: "ציר גיוס רוחבי",
    does: "כניסה לאלפון, התחייבויות והוראות קבע.",
  },
  {
    label: "אלפון",
    href: "/contacts",
    spec: "צדדים וכרטסת",
    does: "חיפוש כרטיס אדם/משפחה/ארגון לפי הרשאה.",
  },
  {
    label: "תורמים והתחייבויות",
    href: "/fundraising",
    spec: "כרטיס התחייבות",
    does: "סכום, ייעוד, הקצאה לאגפים ומצב גבייה.",
  },
  {
    label: "הוראות קבע",
    href: "/fundraising/recurring",
    spec: "גבייה חוזרת",
    does: "מעקב חיובים מחזוריים בלי לייצר זיכוי בנק פיקטיבי.",
  },
  {
    label: "בקשות ותשלומים",
    href: "/payments",
    spec: "קליטה ואישור הוצאה",
    does: "תיבת בקשות: חדשות, השלמות, לאישור ולשיוך.",
  },
  {
    label: "בקשות",
    href: "/payments",
    spec: "תיבת בקשות",
    does: "פתיחת בקשה, מסמכים, מסלול מאשר והפרדת מגיש.",
  },
  {
    label: "ספקים",
    href: "/vendors",
    spec: "פורטל ספק / APT",
    does: "כרטיס ספק, יתרה והגשות במסגרת ההרשאה שהוקצתה.",
  },
  {
    label: "שכר וקבועים",
    href: "/payroll",
    spec: "מסך שכר",
    does: "מחזור שכר ותשלומים קבועים למינוי שכר בלבד.",
  },
  {
    label: "בנקים ותזרים",
    href: "/banking",
    spec: "גזברות מול בנק",
    does: "חשבונות, תנועות, טיוטות, צ׳קים, תזרים וחיבור פאגי.",
  },
  {
    label: "חשבונות ויתרות",
    href: "/banking",
    spec: "יתרה מאומתת",
    does: "מציג יתרה וזמן סנכרון אחרון לכל חשבון.",
  },
  {
    label: "תנועות",
    href: "/banking/movements",
    spec: "שליפת תנועות פאגי",
    does: "רשימת תנועות עו״ש/מט״ח כפי שהבנק מחזיר (כשיהיה חיבור).",
  },
  {
    label: "טיוטות העברה",
    href: "/banking/drafts",
    spec: "B01 הכנת אצווה",
    does: "בניית הוראת העברה. שידור לבנק במצב הדגמה הוא mock — אין כסף אמיתי.",
  },
  {
    label: "צ׳קים",
    href: "/banking/checks",
    spec: "B03 פנקס צ׳קים",
    does: "מעקב צ׳ק נכנס/יוצא והשפעה על התזרים.",
  },
  {
    label: "תזרים",
    href: "/banking/cashflow",
    spec: "סעיף 7 תזרים ותרחישים",
    does: "גרף יתרה חזויה, ודאות, נקודת שפל ותרחיש דחייה.",
  },
  {
    label: "חיבורי בנק",
    href: "/banking/connections",
    spec: "1.4.2 OAuth מנהל כספים",
    does: "הפניה לפורטל פאגי או הדבקת Refresh Token. סיסמת הבנק לא נשמרת אצלנו.",
  },
  {
    label: "תקשורת",
    href: "/communications",
    spec: "ערוצי קליטה",
    does: "קישור וואטסאפ/מייל/גיליון לרשומה קיימת או למשימת בירור.",
  },
  {
    label: "דוחות",
    href: "/reports",
    spec: "פלט והרשאות ייצוא",
    does: "הפקת דוח לפי מה שמותר לתפקיד הנוכחי לייצא.",
  },
  {
    label: "הגדרות",
    href: "/settings",
    spec: "A01 מה המשתמש יראה",
    does: "מטריצת תחום/פעולה והכלל שמכריע לכל זהות.",
  },
  {
    label: "חיפוש",
    spec: "חיפוש לפי מדיניות הרשאות",
    does: "מחפש שם, טלפון, בקשה או אסמכתא רק ברשומות שהתפקיד רשאי לראות.",
  },
  {
    label: "הדרכה",
    spec: "קריאות האפיון במסך",
    does: "פותח מחדש את ההדרכה: קודם הסבר על הרשאות, ואז בועה על כל לחצן בתפריט.",
  },
  {
    label: "יציאה",
    spec: "החלפת הרשאה",
    does: "חוזר למסך בחירת זהות — כך הלקוח מחליף תפקיד בלי סיסמה.",
  },
];

/** החלון הכללי בהתחלה — הרשאות והדגמה. אחריו הסיור עובר לבועות על התפריט. */
export const TOUR_STEPS: {
  id: string;
  title: string;
  spec: string;
  body: string;
  bullets?: string[];
}[] = [
  {
    id: "welcome",
    title: "ברוכים הבאים למערכת הגזברות",
    spec: "חלק א קובע חוזי מימוש · חלק ב הוא האפיון העסקי",
    body: "זו סביבת הדגמה לפי האפיון של מרכז מעייני ישראל. הנתונים מדומים, וחיבור פאגי עדיין ממתין להשלמת scope מצד הבנק. המטרה כאן לראות את הרעיון המלא: תפקידים, מסכים והפרדת סמכויות — בלי להסתבך עם סיסמאות.",
    bullets: [
      "עברית ו־RTL, מחשב ונייד",
      "כל תפקיד רואה רק את התחומים שלו",
      "שידור לבנק כבוי (mock) — אין הוראה חיה",
    ],
  },
  {
    id: "roles",
    title: "בחירת הרשאה בכניסה",
    spec: "חלק א §1 — טבלת תפקידים",
    body: "במסך הכניסה מופיעים המיילים של כל בעלי ההרשאות מהאפיון. לחיצה על כרטיס נכנסת בזהות הזו. כך אפשר להשוות מה הגזבר רואה מול מנהל אגף, נציג גבייה, ספק או מבקר. בשלב הבא יופיעו בועות על כל לחצן בתפריט — כולל לחצנים שנפתחים מתחת להורה.",
    bullets: [
      "גזבר: תקציב, תזרים, בנק וטיוטות",
      "מנהל אגף: תמונת האגף + ציר תורם מצומצם",
      "ספק: רק הרשומות שהותרו לו",
      "מבקר: קריאה רחבה בלי אישור הוצאה",
    ],
  },
];

function specButton(label: string, href?: string) {
  return (
    NAV_BUTTONS.find((b) => b.label === label && (href == null || b.href === href)) ??
    NAV_BUTTONS.find((b) => b.label === label)
  );
}

export function buildSpotlightSteps(): SpotlightStep[] {
  const chrome: SpotlightStep[] = [
    {
      tourId: "search",
      label: "חיפוש",
      spec: specButton("חיפוש")?.spec ?? "",
      does: specButton("חיפוש")?.does ?? "",
    },
    {
      tourId: "help",
      label: "הדרכה",
      spec: specButton("הדרכה")?.spec ?? "",
      does: specButton("הדרכה")?.does ?? "",
    },
  ];

  const nav: SpotlightStep[] = NAV_ITEMS.flatMap((item) => {
    const parent = specButton(item.label, item.href);
    const parentStep: SpotlightStep = {
      tourId: `nav-parent-${item.href}`,
      parentHref: item.children ? item.href : undefined,
      label: item.label,
      spec: parent?.spec ?? "",
      does: parent?.does ?? "",
    };
    const children = (item.children ?? []).map((child) => {
      const spec = specButton(child.label, child.href);
      return {
        tourId: `nav-child-${child.href}`,
        parentHref: item.href,
        label: child.label,
        spec: spec?.spec ?? "",
        does: spec?.does ?? "",
      };
    });
    return [parentStep, ...children];
  });

  return [
    ...chrome,
    ...nav,
    {
      tourId: "logout",
      label: "יציאה",
      spec: specButton("יציאה")?.spec ?? "",
      does: specButton("יציאה")?.does ?? "",
    },
  ];
}

export function specForPath(pathname: string): SpecPage | null {
  const exact = PAGE_SPEC[pathname];
  if (exact) return exact;
  const match = Object.keys(PAGE_SPEC)
    .filter((key) => key !== "/" && pathname.startsWith(key))
    .sort((a, b) => b.length - a.length)[0];
  return match ? PAGE_SPEC[match] : null;
}

export const TOUR_STORAGE_KEY = "mayanei-spec-tour-v1";
