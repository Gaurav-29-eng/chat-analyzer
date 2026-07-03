from docx import Document
import PyPDF2
import csv
import json


def extract_text(file):
    if not file or not file.filename:
        raise ValueError("No file provided")

    filename = file.filename.lower()

    if filename.endswith(".txt"):
        content = file.read().decode("utf-8")
        if not content.strip():
            raise ValueError("File is empty")
        return content

    elif filename.endswith(".csv"):
        content = file.read().decode("utf-8")
        if not content.strip():
            raise ValueError("File is empty")
        reader = csv.reader(content.splitlines())
        rows = []
        for row in reader:
            rows.append(", ".join(row))
        return "\n".join(rows)

    elif filename.endswith(".json"):
        content = file.read().decode("utf-8")
        if not content.strip():
            raise ValueError("File is empty")
        try:
            data = json.loads(content)
            if isinstance(data, list):
                return "\n".join(str(item) for item in data)
            elif isinstance(data, dict):
                return json.dumps(data, indent=2)
            else:
                return str(data)
        except json.JSONDecodeError:
            return content

    elif filename.endswith(".docx"):
        doc = Document(file)
        text = "\n".join([para.text for para in doc.paragraphs])
        if not text.strip():
            raise ValueError("File is empty")
        return text

    elif filename.endswith(".pdf"):
        reader = PyPDF2.PdfReader(file)
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        if not text.strip():
            raise ValueError("File is empty")
        return text

    raise ValueError(f"Unsupported file type: {filename}. Supported types: .txt, .csv, .json, .pdf, .docx")
