from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet
import os
import time

class ReportGenerator:
    def generate_report(self, case_id, files_data, root_hash, signature, output_path="report.pdf"):
        doc = SimpleDocTemplate(output_path, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []

        # Title
        story.append(Paragraph(f"FORENSIC REPORT: {case_id}", styles['Title']))
        story.append(Spacer(1, 12))
        
        # Metadata
        story.append(Paragraph(f"Date: {time.ctime()}", styles['Normal']))
        story.append(Paragraph(f"Integrity Hash (Merkle Root): {root_hash}", styles['Normal']))
        story.append(Spacer(1, 12))

        # Executive Summary
        story.append(Paragraph("Executive Summary", styles['Heading2']))
        story.append(Paragraph("Automated analysis detected potential anomalies in the provided artifacts. Chain of custody is preserved via cryptographic signature.", styles['Normal']))
        story.append(Spacer(1, 12))

        # Evidence Table
        story.append(Paragraph("Evidence Files", styles['Heading2']))
        data = [["Filename", "SHA-256 Hash", "Status"]]
        for f in files_data:
            data.append([f['name'], f['hash'][:16] + "...", f['status']])
        
        t = Table(data)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(t)
        story.append(Spacer(1, 24))

        # Signature
        story.append(Paragraph("Digital Karma Seal", styles['Heading2']))
        story.append(Paragraph(f"Signature: {signature[:64]}...", styles['Code']))
        
        # Build
        doc.build(story)
        return output_path

report_gen = ReportGenerator()
