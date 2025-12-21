import io
import fitz
from docx import Document
from fastapi import UploadFile

from .text_cleaner import clean_text


async def parse_file(file: UploadFile) -> str:
    filename = file.filename.lower()

    if filename.endswith(".pdf"):
        return await parse_pdf(file)
    elif filename.endswith(".docx"):
        return await parse_docx(file)
    elif filename.endswith(".txt"):
        return await parse_txt(file)
    else:
        raise ValueError("Unsupported file format")


async def parse_pdf(file: UploadFile) -> str:
    content = await file.read()
    doc = fitz.open(stream=content, filetype="pdf")

    text = ""
    for page in doc:
        text += page.get_text()

    return clean_text(text)


async def parse_docx(file: UploadFile) -> str:
    content = await file.read()
    file_like = io.BytesIO(content)
    document = Document(file_like)

    text = "\n".join(p.text for p in document.paragraphs)
    return clean_text(text)


async def parse_txt(file: UploadFile) -> str:
    content = await file.read()
    text = content.decode(errors="ignore")
    return clean_text(text)
