from fastapi import APIRouter, UploadFile, File, HTTPException
from openai import OpenAI
from app.core.config import settings
import pypdf
import io

router = APIRouter()

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=settings.openrouter_api_key,
)

@router.post("/pdf/analyze")
async def analyze_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    contents = await file.read()
    
    try:
        pdf_reader = pypdf.PdfReader(io.BytesIO(contents))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() or ""
        text = text[:3000]
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read PDF: {str(e)}")

    if not text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from PDF")

    prompt = f"""You are a Construction Document Analysis Expert.
Analyze this construction document and provide:
1. Document type (BOQ, Cost Sheet, Project Report, Contract, etc.)
2. Key findings (top 5 most important items)
3. Total costs mentioned (if any)
4. Project scope summary
5. Recommendations or red flags

Document content:
{text}

Be concise and practical for contractors."""

    response = client.chat.completions.create(
        model="openrouter/free",
        messages=[{"role": "user", "content": prompt}],
    )

    return {
        "filename": file.filename,
        "pages": len(pdf_reader.pages),
        "characters_extracted": len(text),
        "analysis": response.choices[0].message.content,
        "agent": "Document Analysis Agent",
    }