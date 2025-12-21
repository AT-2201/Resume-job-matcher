import re

def clean_text(text: str) -> str:
    if not text:
        return ""

    # normalize whitespace
    text = re.sub(r"\s+", " ", text)

    # remove common resume junk
    text = re.sub(r"(page \d+ of \d+)", "", text, flags=re.IGNORECASE)
    text = re.sub(r"(curriculum vitae)", "", text, flags=re.IGNORECASE)

    # remove emails & phone numbers (optional but realistic)
    text = re.sub(r"\S+@\S+", "", text)
    text = re.sub(r"\+?\d[\d\s\-()]{8,}\d", "", text)

    return text.strip()
