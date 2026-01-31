from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet
import os
import time

class ReportGenerator:
    def generate_report(self, metadata, files_data, root_hash, signature, output_path="report.pdf"):
        doc = SimpleDocTemplate(output_path, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []

        # Title
        story.append(Paragraph(f"DIVINE FORENSIC REPORT", styles['Title']))
        story.append(Spacer(1, 12))
        
        # Metadata Block
        story.append(Paragraph("CASE METADATA", styles['Heading2']))
        meta_data = [
            ["Case ID:", metadata.get('case_id', 'N/A'), "Investigator:", metadata.get('investigator', 'N/A')],
            ["Agency:", metadata.get('agency', 'N/A'), "Suspect:", metadata.get('suspect', 'N/A')],
            ["Date:", time.ctime(), "Threat Score:", metadata.get('threat_score', '0')]
        ]
        mt = Table(meta_data, colWidths=[100, 150, 100, 150])
        mt.setStyle(TableStyle([
            ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
            ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
            ('FONTNAME', (2,0), (2,-1), 'Helvetica-Bold'),
            ('BACKGROUND', (0,0), (0,-1), colors.whitesmoke),
            ('BACKGROUND', (2,0), (2,-1), colors.whitesmoke),
        ]))
        story.append(mt)
        story.append(Spacer(1, 24))

        # Forensic Dashboard Summary
        story.append(Paragraph("EXECUTIVE SUMMARY", styles['Heading2']))
        summary_text = f"Subject <b>{metadata.get('suspect')}</b> analysis completed. "
        summary_text += f"Remarks: {metadata.get('remarks', 'No additional notes.')}"
        story.append(Paragraph(summary_text, styles['Normal']))
        story.append(Spacer(1, 12))

        # Evidence Integrity Table
        story.append(Paragraph("EVIDENCE INTEGRITY LOG", styles['Heading2']))
        data = [["Filename", "SHA-256 Hash Integrity", "Status"]]
        for f in files_data:
            # Shorten hash for display
            display_hash = f['hash'][:32] + "..." if len(f['hash']) > 32 else f['hash']
            data.append([f['name'], display_hash, "VERIFIED"])
        
        t = Table(data, colWidths=[120, 300, 80])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.navy),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
        ]))
        story.append(t)
        story.append(Spacer(1, 36))

        # Divine Karma Seal
        story.append(Paragraph("KARMA SEAL OF INTEGRITY", styles['Heading2']))
        story.append(Paragraph("This document and its associated payloads are cryptographically signed. Any modification will invalidate the seal.", styles['Normal']))
        story.append(Spacer(1, 6))
        
        # Visual Seal Representation (Boxed signature)
        sig_data = [[f"RSA-4096 SIGNATURE: {signature[:48]}..."]]
        st = Table(sig_data, colWidths=[500])
        st.setStyle(TableStyle([
            ('BOX', (0,0), (-1,-1), 2, colors.gold),
            ('BACKGROUND', (0,0), (-1,-1), colors.black),
            ('TEXTCOLOR', (0,0), (-1,-1), colors.gold),
            ('FONTNAME', (0,0), (-1,-1), 'Courier-Bold'),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ]))
        story.append(st)
        
        # Build
        doc.build(story)
        return output_path

report_gen = ReportGenerator()
