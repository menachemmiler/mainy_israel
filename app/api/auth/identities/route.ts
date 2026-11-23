import { json, errorResponse } from "@/lib/api/http";
import usersFile from "@/data/users.json";

export async function GET() {
  try {
    const items = usersFile.users
      .filter((u) => u.showOnLogin !== false)
      .map((u) => ({
        email: u.email,
        nameHe: u.nameHe,
        loginLabel: u.loginLabel ?? u.nameHe,
        specRef: "specRef" in u ? u.specRef : "",
        summaryHe: "summaryHe" in u ? u.summaryHe : "",
        role: u.roles[0]?.role ?? "",
      }));
    return json({
      demo: true,
      notice:
        "סביבת הדגמה לפי האפיון. בחרו הרשאה מהרשימה — בלי סיסמה. הנתונים מדומים והבנק עדיין לא מחובר.",
      items,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
