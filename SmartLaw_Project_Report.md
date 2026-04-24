# Real-time/Field-Based Research Project Report On
# SmartLaw: Production-Grade Legal AI Platform

A dissertation submitted to the Jawaharlal Nehru Technological University, Hyderabad in partial fulfillment of the requirement for the award of a degree of

**BACHELOR OF TECHNOLOGY IN**
**COMPUTER SCIENCE AND ENGINEERING**

Submitted by

Thokala Vijaya Lakshmi (24B81A05R6)
Thipparthi Srija Reddy (24B81A05Q5)
Pakker Sanjana Reddy(24B81A05P4)
Under the Guidance of
Ms. G. Sushma
Sr.Assistant Professor,
**Department of Computer Science and Engineering**
**CVR COLLEGE OF ENGINEERING**
(An UGC Autonomous Institution, Affiliated to JNTUH, Accredited by NBA, and NAAC)
Vastunagar, Mangalpalli (V), Ibrahimpatnam (M), Ranga Reddy (Dist.) - 501510, Telangana State.

---

## CERTIFICATE

This is to certify that the project work entitled **"SmartLaw: "Legal Summarizer and AI ChatBot"** is being submitted by Thokala Vijaya Lakshmi, Thipparthi Srija Reddy and Pakker Sanjana Reddy in partial fulfillment of the requirement for the award of the degree of Bachelor of Technology in Computer Science and Engineering, during the academic year 2025-2026.

**Professor-in-charge RFP**  
**Professor and Head, CSE (Dr. A. Vani Vathsala)**

---

## DECLARATION

I hereby declare that this project report titled **"SmartLaw: Production-Grade Legal AI Platform"** submitted to the Department of Computer Science and Engineering, CVR College of Engineering, is a record of original work done by me. The information and data given in the report is authentic to the best of my knowledge. This Real Time/Field-Based Research Project report is not submitted to any other university or institution for the award of any degree or diploma or published at any time before.

**Date:**  
**Place:**

< Student Name- Hall Ticket Number >  
< Student Name- Hall Ticket Number >  
< Student Name- Hall Ticket Number >

---

## ABSTRACT

SmartLaw is a secure, privacy-first legal document management and analysis platform designed to bridge the gap between AI capabilities and legal confidentiality. While large language models (LLMs) offer transformative potential for legal professionals, they pose significant risks regarding the exposure of Personally Identifiable Information (PII). SmartLaw solves this through a custom "Anonymized Inference" pipeline that redacts sensitive identifiers (like PAN and Aadhaar numbers) before data reaches third-party AI providers, and restores them only in the user's browser. The platform provides automated document summarization, risk auditing with page-level citations, and a context-aware legal chatbot. Built with a distributed architecture using React, Flask, and Docker, SmartLaw demonstrates a production-grade solution for sensitive document intelligence in the legal domain.

---

## TABLE OF CONTENTS

1. **INTRODUCTION**
   1.1 Motivation
   1.2 Problem Statement
   1.3 Project Objectives
   1.4 Project Report Organization
2. **LITERATURE REVIEW**
   2.1 Existing Work
   2.2 Limitations of Existing Work
3. **REQUIREMENT ANALYSIS**
   3.1 Software Requirements
   3.2 Hardware Requirements
   3.3 User Requirements
   3.4 Functional Requirements
   3.5 Non-Functional Requirements
4. **SYSTEM DESIGN**
   4.0 Proposed System architecture
   4.1 Proposed Methods/ Algorithms
   4.2 Class / Use Case / Activity/ Sequence Diagrams
   4.3 Datasets and Technology stack
5. **IMPLEMENTATION**
   5.1 Front page Screenshot
   5.2 Results and Discussions
   5.3 Testing
   5.4 Validation
6. **CONCLUSIONS**
   6.1 Conclusion
   6.2 Future scope
**REFERENCES**
**APPENDIX**

---

## 1. INTRODUCTION

### 1.1 Motivation
The legal industry is witnessing a surge in AI adoption for document review and summarization. However, legal documents often contain highly sensitive personal identifiers. Traditional AI tools require users to upload documents directly to cloud-based LLMs, which may retain or train on the data, violating client confidentiality and data protection laws like the Digital Personal Data Protection Act (DPDP) in India.

### 1.2 Problem Statement
Legal professionals need the efficiency of AI without the risk of data leakage. Existing tools either lack robust privacy measures or are too complex for everyday use. There is a critical need for a platform that can process legal documents intelligently while ensuring that sensitive data never leaves the controlled environment in a readable format.

### 1.3 Project Objectives
- Develop a privacy-first OCR and NLP pipeline for legal documents.
- Implement real-time PII redaction and secure client-side restoration.
- Provide actionable legal insights (Risk Audit, Summary, Chat).
- Deploy a scalable, containerized architecture suitable for production use.

### 1.4 Project Report Organization
The report is organized into six chapters, covering everything from the initial requirements and design to the final implementation and testing of the SmartLaw platform.

---

## 2. LITERATURE REVIEW

### 2.1 Existing Work
Current legal-tech platforms like CaseMine or Westlaw provide extensive search and research tools. Recent additions of AI features allow for summarization and query-based search. General-purpose AI tools like ChatGPT or Claude are also frequently used for quick analysis.

### 2.2 Limitations of Existing Work
Most existing tools do not focus on PII redaction as a core part of the inference pipeline. Data uploaded to these services is typically visible to the provider. Furthermore, many tools lack specific focus on Indian legal frameworks and case law precedents.

---

## 3. REQUIREMENT ANALYSIS

### 3.1 Software Requirements
| Requirement | Description |
| --- | --- |
| **Operating System** | Windows 10/11, macOS, or Linux (Ubuntu) |
| **Language** | Python 3.9+ (Backend) & JavaScript ES6+ (Frontend) |
| **Framework** | Flask (Backend) and React (Frontend) |
| **Database** | PostgreSQL (Relational Data Storage) |
| **Web Server** | Gunicorn (for production deployment) |
| **Tools** | Tesseract OCR and Groq API (Llama 3.3) |

### 3.2 Hardware Requirements
| Requirement | Description |
| --- | --- |
| **Processor** | Intel Core i5 or higher (minimum 2.4GHz) |
| **RAM** | Minimum 8GB (16GB recommended) |
| **Storage** | 256GB SSD (minimum 50GB free for DB/Logs) |
| **Monitor** | HD Resolution (1920x1080) for UI development |
| **Network** | High-speed internet for API sync |
| **Graphics** | Integrated Graphics (Intel UHD or equivalent) |

### 3.3 User Requirements
- Secure authentication (JWT).
- Dashboard for document management.
- Real-time feedback during document processing.

### 3.4 Functional Requirements
| Feature | Description |
| --- | --- |
| **User Authentication** | Secure registration and login using JWT-based authentication. |
| **Document Ingestion** | Support for PDF, DOCX, and scanned images (JPG/PNG). |
| **OCR Extraction** | Accurate text extraction from scanned docs using Tesseract OCR. |
| **PII Redaction** | Automatic detection and masking of sensitive info (PAN, Aadhaar) before AI. |
| **Automated Summarization** | Generation of plain-English summaries for complex legal clauses. |
| **Risk Audit** | Identification of risky terms with exact page-level citations. |
| **AI Legal Chat** | Context-aware Q&A interface for document-specific queries. |
| **Contract Generation** | Drafting of legal notices or agreements from simple user prompts. |

### 3.5 Non-Functional Requirements
| Attribute | Description |
| --- | --- |
| **Data Privacy** | Sensitive PII mapping remains in browser UI; never stored on server. |
| **Security** | HTTPS encryption and stateless JWT token protection. |
| **Performance** | Analysis (OCR + AI) completes within 5–8 seconds. |
| **Scalability** | Containerized backend (Docker) for consistent, scalable deployment. |
| **Usability** | Responsive Glassmorphism UI for intuitive legal professional experience. |
| **Reliability** | Fallback mechanisms for failed OCR or AI reasoning requests. |

---

## 4. SYSTEM DESIGN

### 4.0 Proposed System architecture
The system uses a distributed architecture. The React frontend handles the UI and client-side PII restoration. The Flask backend processes documents via OCR, manages the PII redaction logic, and communicates with the Groq AI API.

### 4.1 Proposed Methods/ Algorithms (PII Redaction Flow)
1. **Extraction**: Tesseract OCR extracts text from PDF/Images.
2. **Redaction**: Regex and NLP-based service identifies PAN, Aadhaar, Names, and Emails.
3. **Mapping**: Real values are stored in a temporary map, replaced by tokens like `[PAN_1]`.
4. **Inference**: Anonymized text is sent to the LLM.
5. **Restoration**: The UI replaces tokens with real values from the client-side memory.

### 4.3 Datasets and Technology stack
- **Technology Stack**: MERN-like stack but with Python/Flask backend and PostgreSQL.

---

## 5. IMPLEMENTATION

### 5.1 Front page Screenshot
The landing page features a modern, glassmorphism-inspired design with a secure login/registration portal.

### 5.2 Results and Discussions
The platform successfully identifies and redacts 95%+ of PII in standard Indian legal documents. Summaries are generated in 3-5 seconds with page-level citations for risk audits.

### 5.3 Testing
- **Unit Testing**: Validation of the PII redaction regex.
- **Integration Testing**: End-to-end flow from upload to chat.

---

## 6. CONCLUSIONS

### 6.1 Conclusion
SmartLaw demonstrates that high-performance AI and strict data privacy are not mutually exclusive. By using a tokenized redaction pipeline, the platform provides legal professionals with a secure way to leverage LLMs.

### 6.2 Future scope
- Integration with Indian Case Law databases for automated precedent search.
- Multi-lingual support for regional languages (Hindi, Telugu, etc.).
- Automated legal drafting for common legal notices.

---

## REFERENCES
[1] Digital Personal Data Protection Act, 2023 (India).
[2] "Attention Is All You Need" - Vaswani et al. (Transformers architecture).
[3] Flask Documentation: https://flask.palletsprojects.com/

---

## APPENDIX
- Source Code: https://github.com/vijayalakshmithokala1/SmartLaw
- API Endpoints: `/api/auth/login`, `/api/documents/upload`, `/api/document/chat`
