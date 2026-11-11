# Gmail SMTP for Nijo Learn development

This path uses an existing Gmail account while the project has no sending domain. Gmail is intended here for low-volume development; Supabase warns that personal email services can have delivery limitations. Gmail SMTP and the hosted OTP template are now saved for this project. Dashboard reloads confirmed the saved template and SMTP port 587. The app accepts eight-digit signup OTPs, matching the hosted email provider setting. Actual inbox delivery and successful user verification are awaiting the final user test.

## Finish the private credential step

1. Sign into the Google account that will send the emails. Enable Google 2-Step Verification if it is not already enabled.
2. Open https://myaccount.google.com/apppasswords and create an app password named **Nijo Learn**. If the app-password option is missing, consult Google's guide linked below; some managed or protected accounts do not support it.
3. Open the Supabase SMTP settings in a normal browser: https://supabase.com/dashboard/project/mtxvulajjtypfoemqhcw/auth/smtp.
4. Enable custom SMTP and fill the following settings. These settings are already saved in this project; use this table when configuring another environment.

| Field                | Value                                        |
| -------------------- | -------------------------------------------- |
| Sender email address | Your full Gmail address                      |
| Sender name          | Nijo Learn                                   |
| Host                 | smtp.gmail.com                               |
| Port number          | 587 (STARTTLS)                               |
| Username             | The same full Gmail address                  |
| Password             | The Google app password created for this app |

Enter the app password directly into Supabase's Password field and save the settings. Do not use your regular Google password. Do not put the app password in chat, source files, Git, or a NEXT_PUBLIC_ environment variable. No SMTP password is needed by the Next.js application itself: Supabase sends the auth emails.

## Activate and test the OTP email

After SMTP saves successfully, open https://supabase.com/dashboard/project/mtxvulajjtypfoemqhcw/auth/templates/confirm-sign-up. Set the subject to **Your Nijo Learn verification code** and copy the HTML from `supabase/templates/confirmation.html` into the template source. The body must contain `{{ .Token }}`. Save it, keep email confirmation enabled, and keep email OTP length set to 8.

Return to http://localhost:3000/auth/confirmation. Request a new code for your pending signup, check the inbox/spam folder, and enter the eight-digit code. Only emails requested after the hosted template change will contain the code. Successful verification signs the learner in and continues to their requested page. A used code must not create another session.

If mail does not arrive, inspect Supabase Auth logs and any SMTP error before changing settings. Google can reject an unsupported app password or restrict sending. Keep Supabase's rate limits enabled. For a public launch, move to a transactional email provider with a verified sending domain.

## Official references

- Google app passwords and prerequisites: https://support.google.com/accounts/answer/185833
- Google's SMTP host, STARTTLS port and username settings: https://support.google.com/mail/answer/7104828
- Gmail sending limits: https://support.google.com/mail/answer/22839
- Supabase custom SMTP: https://supabase.com/docs/guides/auth/auth-smtp
