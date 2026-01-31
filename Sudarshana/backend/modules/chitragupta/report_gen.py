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
        story.append(Paragraph("Evidence Files Analysis", styles['Heading2']))
        
        # Table Header
        data = [["Filename", "Verdict", "Score", "Hash (Short)"]]
        
        for f in files_data:
            # Handle potential missing keys if VT fails
            name = f.get('name', 'Unknown')
            verdict = f.get('verdict', 'Pending')
            score = f.get('score', 'N/A')
            f_hash = f.get('hash', 'N/A')
            
            # Colorize Verdict
            if verdict == 'MALICIOUS':
                verdict_cell = Paragraph(f"<font color='red'><b>{verdict}</b></font>", styles['Normal'])
            elif verdict == 'CLEAN':
                verdict_cell = Paragraph(f"<font color='green'>{verdict}</font>", styles['Normal'])
            else:
                verdict_cell = verdict
                
            data.append([name[:20], verdict_cell, score, f_hash[:12] + "..."])
        
        t = Table(data, colWidths=[150, 80, 60, 150])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        story.append(t)
        story.append(Spacer(1, 24))

        # Detailed Analysis
        story.append(Paragraph("Detailed Intelligence", styles['Heading2']))
        
        for f in files_data:
            # Title with Verdict Color
            verdict_text = f.get('verdict', 'UNKNOWN')
            color = "red" if verdict_text == 'MALICIOUS' else "green"
            
            story.append(Paragraph(f"<b>File: {f['name']}</b>", styles['Heading3']))
            story.append(Paragraph(f"<font color='{color}'><b>Verdict: {verdict_text}</b></font> (Score: {f.get('score', 'N/A')})", styles['Normal']))
            
            # Hash
            story.append(Paragraph(f"<b>SHA256:</b> {f.get('hash')}", styles['Code']))
            
            # Size
            size_mb = f.get('size', 0) / (1024*1024)
            story.append(Paragraph(f"<b>Size:</b> {size_mb:.2f} MB", styles['Normal']))
            
            # Known Names
            names = f.get('names', [])
            if names:
                story.append(Paragraph(f"<b>Known Names:</b> {', '.join(names[:5])}", styles['Normal']))
            
            # Detections (show even if empty/clean to confirm)
            detections = f.get('detections', [])
            if detections:
                 story.append(Paragraph(f"<b>Detections:</b> {', '.join(detections)}", styles['Normal']))
            else:
                 story.append(Paragraph(f"<b>Detections:</b> None (Clean)", styles['Normal']))

            # Tags
            tags = f.get('tags', [])
            if tags:
                story.append(Paragraph(f"<b>Tags:</b> {', '.join(tags)}", styles['Normal']))
            
            story.append(Spacer(1, 12))
            
            # Full Engine Results Table
            engine_results = f.get('engine_results', {})
            if engine_results:
                story.append(Paragraph("Antivirus Scan Results:", styles['Heading4']))
                av_data = [["Engine", "Result", "Engine", "Result"]] # 2 columns
                
                engines = sorted(engine_results.keys())
                # Pair them up for 2-column layout
                for i in range(0, len(engines), 2):
                    e1 = engines[i]
                    r1 = engine_results[e1]
                    
                    e2 = engines[i+1] if i+1 < len(engines) else ""
                    r2 = engine_results[e2] if i+1 < len(engines) else ""
                    
                    # Highlight malicious
                    if r1 != "undetected" and r1 != "unknown" and "clean" not in r1.lower():
                         r1 = Paragraph(f"<font color='red'>{r1}</font>", styles['Normal'])
                    if r2 != "undetected" and r2 != "unknown" and e2 and "clean" not in r2.lower():
                         r2 = Paragraph(f"<font color='red'>{r2}</font>", styles['Normal'])
                         
                    av_data.append([e1, r1, e2, r2])
                
                t_av = Table(av_data, colWidths=[120, 100, 120, 100])
                t_av.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                    ('FONTSIZE', (0, 0), (-1, -1), 8),
                    ('TOPPADDING', (0, 0), (-1, -1), 2),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
                ]))
                story.append(t_av)
            
            story.append(Spacer(1, 15))
            story.append(Paragraph("-" * 60, styles['Normal'])) # Separator
            story.append(Spacer(1, 15))

        # Signature
        story.append(Paragraph("Digital Karma Seal", styles['Heading2']))
        story.append(Paragraph(f"Signature: {signature[:64]}...", styles['Code']))
        
        # Build
        doc.build(story)
        return output_path

report_gen = ReportGenerator()
