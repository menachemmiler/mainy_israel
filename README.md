# מעייני ישראל — מערכת גזברות (גרסה 1)

שלד Next.js (App Router, TypeScript) לעמותת מרכז מעייני ישראל: הרשאות, תיבת משימות, אלפון, וכרטסת דוגמה — ובמקביל מעטפת FIBI עם כתיבה חסומה עד אימות ספק.

## התקנה מקומית

דרישות: Node 22, Docker Desktop, npm.

```bash
docker compose up -d
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm test
npm run dev
```

פתחו http://localhost:3000 והתחברו עם חשבון דמו.

סיסמה לכל חשבונות הדמו: `MayaneiDemo1!`

חמישה חשבונות כניסה (לא 13). תפקידים נוספים מהאפיון נשארים במנוע ההרשאות בלי חשבון דמו.

| תפקיד | דוא״ל |
|---|---|
| גזבר | treasurer@mayanei.local |
| מנהל קרן הבניין | building@mayanei.local |
| מנהלת פעילות שוטפת | ops@mayanei.local |
| נציג גבייה | collector@mayanei.local |
| ספק | vendor@mayanei.local |

נתוני הדמו נטענים מ־`data/*.json`. האפיון נמצא ב־`docs/Mayanei-Treasury-Requirements.docx`.

## מבנה

- `app/api/` — נתיבי API מאובטחים (זהות + פעולה + תחום + רשומה)
- `lib/db/` — Prisma / PostgreSQL (`DECIMAL(19,4)`)
- `lib/rbac/` — מנוע הרשאות, כולל הגבלה מפורשת שגוברת
- `lib/auth/` — Local Auth (Bcrypt + JWT httpOnly)
- `services/secrets/` — דרייבר `.env` עם ממשק להחלפה לכספת ענן
- `services/fibi/` — מעטפת FIBI: תנועות, טיוטה בודדת, אצווה, OAuth2
- `services/integrations/` — קטלוג מחברים גנרי (FIBI ב־v1, פאג״י בהמשך)

מחרוזת הענן ל־PostgreSQL מופיעה כהערה ב־`.env.example` (Neon / Supabase / RDS).

## כתיבה לבנק

`FIBI_WRITE_MODE=mock` כברירת מחדל. טיוטות נשמרות מקומית עם מפתח בקשה (B01) ואינן נשלחות לבנק. החתימה הסופית נשארת בפורטל FIBI.

## בדיקות

| מזהה | מצב |
|---|---|
| A01 הרשאות לפי תפקיד ותחום | עבר (Vitest) |
| A02 הרשאה זמנית שפגה | עבר (Vitest) |
| A03 תרומה מפוצלת נספרת פעם אחת | עבר (Vitest) |
| P02 פריסה 1,000 / 3 | עבר (Vitest) |
| B01 מפתח בקשה / בלי טיוטה כפולה | ממומש בקוד; דורש אימות ספק לשידור חי |
| B02 אצווה נפסלת בשורה אחת | עבר (Vitest) |
| FIBI קריאה/כתיבה חיה | נדרש אימות ספק |
| APT / נדרים / Drive | לא מחובר — מתאם מדומה בלבד |

## ייצור

1. החליפו `DATABASE_URL` למחרוזת הענן.
2. החליפו `SECRETS_DRIVER=vault` וממשו את `services/secrets/vault-driver.ts`.
3. הגדירו `FIBI_ENV=prd` ו־`FIBI_WRITE_MODE=live` רק אחרי `capabilityVerified`.
