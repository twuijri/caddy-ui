# Arabic review distribution

This branch contains an AI-authored Arabic catalog explicitly requested by the
fork owner for review. It has not been attested as human-reviewed and is not part
of the functional upstream hybrid pull request. Do not submit the translated
values upstream until a fluent human reviews them and accepts that project's
contribution requirements.

The frontend uses the project's existing i18next locale structure and language
picker. The review backend image defaults `CADDY_UI_ADDITIONAL_LANGUAGES` to `ar`
so existing deployments get the Arabic option after pulling both updated images.
Select **العربية** in the language picker next to the theme control. Existing
deployment environment values override the image default. English remains
available and remains the fallback for missing keys.

Language direction follows the selected locale, including dialogs, navigation,
and mobile layouts. Technical values such as hostnames remain left-to-right.
Hybrid configuration ownership still requires `CADDY_UI_HYBRID=true`; language
support does not automatically enable hybrid mode.
