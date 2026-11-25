"""Count the changed lines of a branch against its base, without tests and generated files.

Usage: uv run python count_changed_lines.py BASE [HEAD] [--exclude PATTERN ...]
"""

import argparse
import subprocess
from fnmatch import fnmatch

# Tests and generated files do not count for the PR size guide.
DEFAULT_EXCLUDES = ("tests/*", "*/tests/*", "test_*.py", "*.lock")
SIZE_WARNING_LINES = 500


def changed_lines_by_file(base: str, head: str) -> dict[str, int]:
    """Return the added plus deleted lines of each file that differs between `base` and `head`."""
    # Three dots: compare with the merge base, as the PR diff does.
    output = subprocess.run(
        ["git", "diff", "--numstat", f"{base}...{head}"],
        check=True,
        capture_output=True,
        text=True,
    ).stdout
    counts: dict[str, int] = {}
    for line in output.splitlines():
        added, deleted, path = line.split("\t", 2)
        # Binary files show "-" instead of a number.
        counts[path] = 0 if added == "-" else int(added) + int(deleted)
    return counts


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("base", help="Branch that the PR merges into, for example main")
    parser.add_argument("head", nargs="?", default="HEAD")
    parser.add_argument("--exclude", action="append", default=[], help="Extra glob to exclude")
    args = parser.parse_args()

    excludes = DEFAULT_EXCLUDES + tuple(args.exclude)
    counts = changed_lines_by_file(args.base, args.head)
    counted = {
        path: lines
        for path, lines in counts.items()
        if not any(fnmatch(path, pattern) for pattern in excludes)
    }

    for path, lines in sorted(counted.items(), key=lambda item: -item[1]):
        print(f"{lines:6d}  {path}")
    total = sum(counted.values())
    print(f"{total:6d}  TOTAL ({len(counts) - len(counted)} excluded file(s))")
    if total > SIZE_WARNING_LINES:
        print(f"Over about {SIZE_WARNING_LINES} lines: tell the user and suggest a split.")


if __name__ == "__main__":
    main()
