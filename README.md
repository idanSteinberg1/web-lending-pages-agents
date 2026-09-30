# Web landing pages agents

סוכן מבוסס Claude Code שבונה אתרים ודפי נחיתה ברמת סטודיו מתוך איפיון: בריף, אסטרטגיה, שלושה כיוונים אמנותיים, בנייה, לולאת QA ותצוגה מקדימה.

## מה יש בריפו

- `.claude/commands/new-site.md`, `.claude/commands/quick-site.md`
- `.claude/agents/site-*.md` (5 סוכנים)
- `.claude/skills/*` (11 סקילים, כולל ui-components, motion-choreography, webgl-moments, payment-card-ui ו-treatment-landing לדפי טיפולים וקליניקות)
- `scripts/` (shoot, audit, record-motion, palette, contrast)
- `templates/brief.schema.json`, `templates/site-output.schema.json`
- `API.md` (הפעלה דרך ה-API עם פלט JSON מובנה)
- `examples/` (דף הדוגמה עם ההירו האינטראקטיבי, כרפרנס לסוכן)
- `CLAUDE.md`: חוקי העבודה, טעם עיצובי וספי איכות.

## התקנה
```bash
npm install
pip install pillow
# ffmpeg (לדפי הפריימים של בדיקת התנועה): brew install ffmpeg
```
(Playwright MCP כבר מחובר אצלך; הסקריפטים משתמשים ב-Playwright ישירות.)
אם קיימים סקילים באותם שמות ברמת החשבון, הגרסה בריפו גוברת בפרויקט הזה.

אם הסקיל `ui-ux-pro-max` מותקן בחשבון, ה-builder וה-critic משתמשים בו לכללי UX, נגישות ובדיקה לפני מסירה, אבל לא לבחירת סגנון, צבעים ופונטים (ראו CLAUDE.md).

## הפעלה
```
/new-site spec/client-brief.pdf
```
סקיצה מהירה בקובץ אחד:
```
/quick-site "חנות מדרסים אורתופדיים, קהל: אנשים שעומדים הרבה, פעולה: רכישה"
```
המשך ריצה שנעצרה:
```
/new-site projects/<slug>
```

## בדיקה ראשונה מומלצת
הרץ על איפיון קטן ואמיתי (למשל דף נחיתה למדרסים), ועצור אחרי שלב הכיוונים האמנותיים כדי לראות אם שלושת הכיוונים באמת שונים זה מזה.
