#!/usr/bin/env python3
"""Summarize Bikeshed's `--print=json` output for GitHub Actions.

Usage: bikeshed-report.py <source.bs> <bikeshed-output.json> <bikeshed-exit-code>

Emits a workflow annotation for every warning or error, appends a table to the
job summary, and exits non-zero if any warnings or errors were found. The
caller decides whether that exit code should block anything.
"""

import json
import os
import re
import sys

# Bikeshed message types that indicate a problem in the source document.
PROBLEM_TYPES = {
    "fatal": ("error", "Fatal error"),
    "failure": ("error", "Failure"),
    "link": ("error", "Link error"),
    "warning": ("warning", "Warning"),
    "lint": ("warning", "Lint"),
}


def escape_data(value):
    return value.replace("%", "%25").replace("\r", "%0D").replace("\n", "%0A")


def escape_property(value):
    return escape_data(value).replace(":", "%3A").replace(",", "%2C")


def parse_line(line_num):
    # Bikeshed reports "24", "121:67", or "~82:12" (approximate).
    match = re.match(r"~?(\d+)(?::(\d+))?", str(line_num or ""))
    if not match:
        return None, None
    return match.group(1), match.group(2)


def main():
    source, output_path, exit_code = sys.argv[1], sys.argv[2], int(sys.argv[3])

    try:
        with open(output_path, encoding="utf-8") as f:
            messages = json.load(f)
    except (OSError, ValueError) as e:
        messages = [{
            "lineNum": None,
            "messageType": "fatal",
            "text": f"Could not parse Bikeshed output ({e}); see the build log.",
        }]

    if exit_code != 0 and not any(m.get("messageType") in ("fatal", "failure") for m in messages):
        messages.append({
            "lineNum": None,
            "messageType": "fatal",
            "text": f"Bikeshed exited with status {exit_code}.",
        })

    problems = [m for m in messages if m.get("messageType") in PROBLEM_TYPES]
    counts = {t: 0 for t in PROBLEM_TYPES}

    for m in problems:
        msg_type = m["messageType"]
        counts[msg_type] += 1
        level, label = PROBLEM_TYPES[msg_type]
        props = [f"file={escape_property(source)}", f"title={escape_property(f'Bikeshed {label}')}"]
        line, col = parse_line(m.get("lineNum"))
        if line:
            props.append(f"line={line}")
            if col:
                props.append(f"col={col}")
        print(f"::{level} {','.join(props)}::{escape_data(m.get('text', ''))}")

    summary_path = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary_path:
        with open(summary_path, "a", encoding="utf-8") as f:
            if problems:
                f.write(f"### :warning: Bikeshed reported {len(problems)} issue(s) in `{source}`\n\n")
                f.write("This check is advisory; the preview is still built and published.\n\n")
                f.write("| Type | Count |\n|---|---|\n")
                for msg_type, (_, label) in PROBLEM_TYPES.items():
                    if counts[msg_type]:
                        f.write(f"| {label} | {counts[msg_type]} |\n")
                f.write("\n<details><summary>Messages</summary>\n\n")
                for m in problems:
                    where = f"line {m['lineNum']}" if m.get("lineNum") else "no line"
                    label = PROBLEM_TYPES[m["messageType"]][1]
                    text = m.get("text", "").replace("\n", "\n    ")
                    f.write(f"- **{label}** ({where}):\n\n    ```\n    {text}\n    ```\n")
                f.write("\n</details>\n\n")
            else:
                f.write(f"### :white_check_mark: Bikeshed reported no warnings or errors in `{source}`\n\n")

    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
