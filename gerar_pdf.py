import re
from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

MD_FILE = Path("documentacao_tecnica.md")
PDF_FILE = Path("documentacao_tecnica.pdf")

text = MD_FILE.read_text(encoding="utf-8")

doc = SimpleDocTemplate(
    str(PDF_FILE),
    pagesize=A4,
    rightMargin=2.5*cm,
    leftMargin=2.5*cm,
    topMargin=2.5*cm,
    bottomMargin=2.5*cm,
    title="Documentação Técnica — Sistema de Faturamento de Academia",
    author="InovaiLab",
)

styles = getSampleStyleSheet()

style_h1 = ParagraphStyle(
    "H1",
    parent=styles["Heading1"],
    fontSize=18,
    fontName="Helvetica-Bold",
    textColor=colors.HexColor("#1a1a2e"),
    spaceAfter=14,
    spaceBefore=6,
    leading=24,
)

style_h3 = ParagraphStyle(
    "H3",
    parent=styles["Heading2"],
    fontSize=13,
    fontName="Helvetica-Bold",
    textColor=colors.HexColor("#16213e"),
    spaceAfter=8,
    spaceBefore=18,
    leading=18,
    borderPad=4,
)

style_body = ParagraphStyle(
    "Body",
    parent=styles["Normal"],
    fontSize=10,
    fontName="Helvetica",
    textColor=colors.HexColor("#333333"),
    spaceAfter=6,
    leading=15,
)

style_bold_item = ParagraphStyle(
    "BoldItem",
    parent=styles["Normal"],
    fontSize=10,
    fontName="Helvetica-Bold",
    textColor=colors.HexColor("#0f3460"),
    spaceAfter=4,
    spaceBefore=8,
    leading=15,
)

style_bullet = ParagraphStyle(
    "Bullet",
    parent=styles["Normal"],
    fontSize=10,
    fontName="Helvetica",
    textColor=colors.HexColor("#444444"),
    spaceAfter=3,
    leftIndent=20,
    leading=14,
    bulletIndent=8,
)

story = []

lines = text.splitlines()
i = 0
while i < len(lines):
    line = lines[i].rstrip()

    # H1
    if line.startswith("# ") and not line.startswith("## "):
        content = line[2:].strip()
        story.append(Paragraph(content, style_h1))
        story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#0f3460"), spaceAfter=10))
        i += 1
        continue

    # H3
    if line.startswith("### "):
        content = line[4:].strip()
        story.append(Spacer(1, 6))
        story.append(Paragraph(content, style_h3))
        i += 1
        continue

    # HR
    if line.strip() == "---":
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#cccccc"), spaceBefore=8, spaceAfter=8))
        i += 1
        continue

    # Bullet list
    if line.startswith("- "):
        content = line[2:].strip()
        # bold inside bullet **text** and inline bold like **Texto** — desc
        content = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', content)
        story.append(Paragraph(f"• {content}", style_bullet))
        i += 1
        continue

    # Bold item line (starts with **N. ...)
    bold_match = re.match(r'^\*\*(\d+\..+?)\*\*$', line)
    if bold_match:
        content = bold_match.group(1)
        story.append(Paragraph(content, style_bold_item))
        i += 1
        continue

    # Normal paragraph (skip blank lines)
    if line.strip() == "":
        story.append(Spacer(1, 4))
        i += 1
        continue

    # Inline bold **text**
    content = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', line)
    # Escape any remaining special XML chars (except our tags)
    content = content.replace("&", "&amp;").replace("<b>", "\x00b\x00").replace("</b>", "\x00/b\x00")
    content = content.replace("<", "&lt;").replace(">", "&gt;")
    content = content.replace("\x00b\x00", "<b>").replace("\x00/b\x00", "</b>")

    story.append(Paragraph(content, style_body))
    i += 1

doc.build(story)
print(f"PDF gerado com sucesso: {PDF_FILE.resolve()}")
