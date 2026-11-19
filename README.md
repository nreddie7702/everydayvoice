# EverydayVoice

A mobile-first, six-step open-ended survey built with HTML, CSS, vanilla JavaScript, Google Apps Script and Google Sheets.

## Project files

- `index.html` — landing page, survey interface and confirmation screen.
- `style.css` — responsive visual design.
- `script.js` — six-question flow, validation, navigation and submission.
- `Code.gs` — Apps Script endpoint that appends completed responses to Sheets.

## 1. Create your response spreadsheet

1. Create a new Google Sheet.
2. Copy the spreadsheet ID from its URL. It is the text between `/d/` and `/edit`.
3. Open **Extensions → Apps Script**.
4. Replace the editor contents with `Code.gs` from this project.
5. In `Code.gs`, replace `PASTE_YOUR_GOOGLE_SHEET_ID_HERE` with your spreadsheet ID.
6. Save the project.
7. In the Apps Script editor, select `testSheetAccess` and click **Run**. Approve the requested Google Sheets permissions. This verifies that the script can open the spreadsheet. The response tab is created automatically on the first successful survey submission.

The script creates a tab named `EverydayVoice Responses` with these columns:

`Submitted At | Question 1 | Question 2 | Question 3 | Question 4 | Question 5 | Question 6 | Submission ID`

Every completed response is appended as a new row.

## 2. Deploy the Apps Script web app

1. In Apps Script, click **Deploy → New deployment**.
2. Click the gear icon and choose **Web app**.
3. Set **Execute as** to **Me**.
4. Set **Who has access** to **Anyone** so respondents can submit without signing into your Google account.
5. Click **Deploy** and authorize if prompted.
6. Copy the Web app URL. It must end in `/exec`.

Do not share the spreadsheet itself publicly. Respondents only need the website URL.

## 3. Connect the website to Sheets

Open `script.js` and replace the empty `GOOGLE_SCRIPT_URL` value near the top with the deployed `/exec` URL:

```js
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec";
```

Save the file. Do not put your Google password, API keys or spreadsheet editing credentials in the frontend. The spreadsheet ID belongs only in the Apps Script server code.

If you change `Code.gs` after deployment, use **Deploy → Manage deployments → Edit** and deploy a new version. The web app URL normally remains the same for an edited deployment.

## 4. Publish the website

This is a static website. You can host the `index.html`, `style.css` and `script.js` files on any static web host.

### GitHub Pages

1. Create a GitHub repository, for example `everydayvoice`.
2. Upload `index.html`, `style.css` and `script.js` to the repository root. `Code.gs` and this README are project documentation/backend source; they do not need to be served publicly.
3. In the repository, open **Settings → Pages**.
4. Under Build and deployment, select **Deploy from a branch**.
5. Select the `main` branch and `/ (root)`, then save.
6. Wait for GitHub Pages to publish. Your public URL will be shown in the Pages settings, usually `https://YOUR-USERNAME.github.io/everydayvoice/`.

You can also deploy the same three frontend files using Netlify or another static host. Keep the Apps Script project in your Google account.

## 5. Test before sharing

Use the deployed website URL and complete a test submission from a phone and desktop.

- Confirm all six questions appear in the exact requested order.
- Try Next with a blank answer; it must stop and show validation.
- Enter answers, move forward, go back, and confirm earlier text remains.
- Submit all six answers and wait for the success screen.
- Check that a new row appears in the response tab with a timestamp and all six answers.
- Submit a second test response and confirm it creates another row.
- Test a failed connection (for example, temporarily clear the Apps Script URL in a local test copy). The page must show an error, not success.

The frontend waits for a confirmation message from Apps Script. If the server does not confirm within 30 seconds, it shows an error instead of displaying a false success screen.

## Privacy and operational notes

- The deployed Apps Script is configured for anonymous public submissions. Anyone with the website can submit; do not collect sensitive personal information unless you have a clear lawful basis and suitable privacy notice.
- The six free-text answers are limited to 3,000 characters each.
- The submission ID is used to reduce accidental duplicate rows on retries. Apps Script cache entries expire after six hours.
- Google Apps Script quotas and Google account policies apply.
- The website does not ask for a name, phone number or email address.

## Troubleshooting

**“The survey owner has not configured the Google Sheets connection yet.”**  
Set `GOOGLE_SCRIPT_URL` in `script.js` to the deployed `/exec` URL, then publish the updated website files.

**“The server did not confirm the submission.”**  
Check that the Apps Script deployment is active, access is set to Anyone, the script is authorized, and the spreadsheet ID is correct. Open Apps Script → Executions to inspect server errors.

**You changed Apps Script but the old behavior remains.**  
Edit the deployment and select **New version**, then deploy again.

**No response tab exists yet.**  
It is created automatically after the first successful submission. You can also create it manually with the exact name `EverydayVoice Responses`.

## Share

Once the site is published and a real test submission has appeared in your Google Sheet, share the public website URL through WhatsApp, Instagram or other channels.
