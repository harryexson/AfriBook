#!/usr/bin/env python3
import json, os

def js_str(s):
    return json.dumps(s)

OUT = r"""type TranslationMap = Record<string, string | Record<string, string | Record<string, string>>>;

export interface Translations {
  common: Record<string, string>;
  auth: Record<string, string>;
  home: Record<string, string>;
  marketplace: Record<string, string>;
  booking: Record<string, string>;
  vendor: Record<string, string>;
  restaurant: Record<string, string>;
  driver: Record<string, string>;
  payments: Record<string, string>;
  profile: Record<string, string>;
  admin: Record<string, string>;
  errors: Record<string, string>;
}

type LocaleTranslations = {
  [K in keyof Translations]: Record<string, string>;
};

export const TRANSLATIONS: Record<string, LocaleTranslations> = {
"""

langs = {
    "en": "English",
    "fr": "French",
    "ar": "Arabic",
    "sw": "Swahili",
    "hi": "Hindi",
    "es": "Spanish",
    "pt": "Portuguese",
    "yo": "Yoruba",
    "ha": "Hausa",
    "zu": "Zulu",
    "de": "German",
}

# Read all language files
lang_dir = os.path.join(os.path.dirname(__file__), "translations_data")
entries = []
for code in langs:
    path = os.path.join(lang_dir, f"{code}.json")
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    entries.append((code, data))

# Generate TypeScript
for idx, (code, data) in enumerate(entries):
    OUT += f"  {code}: {{\n"
    sections = ["common","auth","home","marketplace","booking","vendor","restaurant","driver","payments","profile","admin","errors"]
    for s_idx, section in enumerate(sections):
        msgs = data.get(section, {})
        OUT += f"    {section}: {{\n"
        keys = list(msgs.keys())
        for k_idx, key in enumerate(keys):
            val = msgs[key]
            comma = "," if k_idx < len(keys) - 1 else ","
            OUT += f"      {key}: {js_str(val)}{comma}\n"
        comma2 = "," if s_idx < len(sections) - 1 else ","
        OUT += f"    }}{comma2}\n"
    comma3 = "," if idx < len(entries) - 1 else ","
    OUT += f"  }}{comma3}\n\n"

OUT += r"""};
"""

output_path = os.path.join(os.path.dirname(__file__), "src", "lib", "localization", "translations.ts")
os.makedirs(os.path.dirname(output_path), exist_ok=True)
with open(output_path, "w", encoding="utf-8") as f:
    f.write(OUT)
print(f"Wrote {output_path}")
