#!/usr/bin/env python3
"""Generate translations.ts from JSON language files."""
import json, os, glob

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(SCRIPT_DIR, "translations_data")
OUTPUT = os.path.join(SCRIPT_DIR, "..", "src", "lib", "localization", "translations.ts")

SECTIONS = [
    "common", "auth", "home", "marketplace", "booking",
    "vendor", "restaurant", "driver", "payments", "profile",
    "admin", "errors"
]

language_files = sorted(glob.glob(os.path.join(DATA_DIR, "*.json")))

def js_str(s):
    return json.dumps(s, ensure_ascii=False)

lines = []
lines.append('''type TranslationMap = Record<string, string | Record<string, string | Record<string, string>>>;

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
''')

for lf_idx, lf in enumerate(language_files):
    code = os.path.splitext(os.path.basename(lf))[0]
    with open(lf, "r", encoding="utf-8") as f:
        data = json.load(f)

    lines.append(f"  {code}: {{\n")
    for s_idx, section in enumerate(SECTIONS):
        msgs = data.get(section, {})
        keys = list(msgs.keys())
        lines.append(f"    {section}: {{\n")
        for k_idx, key in enumerate(keys):
            val = msgs[key]
            comma = "," if k_idx < len(keys) - 1 else ","
            lines.append(f"      {key}: {js_str(val)}{comma}\n")
        comma2 = "," if s_idx < len(SECTIONS) - 1 else ","
        lines.append(f"    }}{comma2}\n")
    comma3 = "," if lf_idx < len(language_files) - 1 else ","
    lines.append(f"  }}{comma3}\n\n")

lines.append("};\n")

os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
with open(OUTPUT, "w", encoding="utf-8") as f:
    f.writelines(lines)
print(f"Generated {OUTPUT} from {len(language_files)} language files")
